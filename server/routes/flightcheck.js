var express = require('express');
var router = express.Router();
var pg = require('pg');
var path = require('path');
var env = process.env.G7TRAVEL_ENV;
var connectionString = require(path.join(__dirname,  '../', 'config/'+env+'.js'));
var config = require(path.join(__dirname, '../', 'config/'+env+'.js'));
var https = require('https');
var jsonQuery = require('json-query');
var airports = require('../../server/classes/airport');
var moment = require('moment');
var logger = require(path.join(__dirname, '../', 'classes','logging')).logger;

var options = {
  host: 'api.flightstats.com',
  method: 'GET'
}

var apiRowID = 0;
var counter = 0;

var flightcheck = {
  init: function() {
    console.log('Started flight check...');
    logger.info('Started flight check...');
    config.init();
    setInterval(this.expirator.bind(this), 15000); //check for flights to check every 15 seconds - NOT checking the API every 15 seconds
  },

  flightStatsError: function(id) {
    pg.connect(config.connectionString, function(err, client, done) {
        if (err) {
        done();
        console.log(err);
        }
        client.query("UPDATE travelchecking SET status='TRAVELID_ERROR' where id=($1)", [id]);
        done();
    });
  },

  flightStatsLogApi: function(f, call) {
        pg.connect(config.connectionString, function(err, client, done) {
            if (err) {
                done();
		            logger.info(err);
                console.log(err);
            }
            client.query("INSERT INTO travelapi VALUES (now(),'" + f.travelid + "','"+call+"') RETURNING id",

                function(err, result) {

                if (err) {

                }
                else {
                    apiRowID = result.rows[0].id;
                }
            });
            done();
        });
  },

  flightStatsDoCheck: function(f, status) {
    //debugger;
    console.log(Date.now().toLocaleString() + " API check");
    logger.info("API check");

    var re = /([A-Za-z]{3}|[A-Za-z0-9]{2})([0-9]*)/g;
    var travid = re.exec(f.travelid);


    if (travid == null) {
      // null value in travelid somehow - just make a dummy flight ID
      flightcheck.flightStatsError(f.id);
      return;
    }

    if (travid[1].length == 0 || travid[2].length == 0) {
      flightcheck.flightStatsError(f.id);
      return;
    }

    travid[1] = travid[1].trim().replace(/([^a-z0-9]+)/gi, 'x');
    travid[2] = travid[2].trim().replace(/([^a-z0-9]+)/gi, 'x');
    var travelid = f.travelid;
    var id = f.id;
    var checkstatus = f.status;
    var currentestimate = f.currentestimatetravelarrival;

    options.path = config.flightstatsPath + travid[1].trim().toUpperCase() +'/'
        + travid[2].trim().toUpperCase()
        + '/arr/20' + f.pickupday.substring(6,8) + '/' + f.pickupday.substring(3,5) + '/' + f.pickupday.substring(0,2)
        +'?appId=' + config.flightstatsAppID + '&appKey=' + config.flightstatsAppKey + '&utc=false' + '&airport=' + f.internationalcode;

    // Log the check in the API call table
    flightcheck.flightStatsLogApi(f, options.path);

    var req = https.request(options, function(res,options) {
    res.on('data', function(data){
        var fd;
        try {
            fd = JSON.parse(data);
        } catch (err)  {
            flightcheck.flightStatsError(id);
            return;
        }
        console.log(travelid + ' ' + checkstatus);
        logger.info(travelid + ' ' + checkstatus);
        if (fd.error == null) {
        if (fd.flightStatuses.length == 0) {
            flightcheck.flightStatsError(id);
        }

        var fs;
        var i=0;
        while ((fs = fd.flightStatuses[i++]) != null)
        {

            if ((fs.arrivalAirportFsCode != 'LAX') && (fs.arrivalAirportFsCode != 'ORY' && fs.arrivalAirportFsCode != 'CDG'))
                continue;
            else {
                break;
            }
        }

        if (fs == null || (fs.arrivalAirportFsCode != 'LAX' && fs.arrivalAirportFsCode != 'ORY' && fs.arrivalAirportFsCode != 'CDG')) {
            flightcheck.flightStatsError(id);
        } else if (fs != null) {

        // query PG and update
        pg.connect(config.connectionString, function(err, client, done) {
        if (err) {
            done();
	          logger.info(err);
            console.log(err);
        }

        var otimes = fs.operationalTimes;
        var from_airport = fs.departureAirportFsCode;
        var coder = jsonQuery('codes[Code='+from_airport+'].Name', {
            data: Airports
        });
        from_airport = coder.value;
        if (from_airport == null) {
            from_airport = "UNK";
        }
        if (from_airport.length > 30) {
            from_airport = from_airport.substring(0,30);
        }


        // We have details on the scehduled arrival in the response
        if (otimes.estimatedGateArrival||otimes.scheduledGateArrival||otimes.estimatedRunwayArrival) {
            if (checkstatus == 'ACTIVE') {
                if (otimes.actualGateArrival) { // flight has arrived at gate.
                    client.query("UPDATE travelchecking SET status='TERMINATED',currentestimatetravelarrival=($1),nexttravelcheckdate=to_timestamp(($2)) WHERE id=($3)",
                        [otimes.actualGateArrival.dateLocal,Math.floor(Date.now()/1000),uniqueID ]);
                } else
                {
                    // this is our second check. If all is good we end monitoring of this flight.
                    // compare the stored ETA with that returned by the Flight API.
                    // If more than 15 minutes longer...set another check in the future
                    //var newEstimate = new Date((otimes.estimatedGateArrival?otimes.estimatedGateArrival.dateLocal:otimes.scheduledGateArrival.dateLocal));
                    var newEstimate = null;
                    if (!otimes.estimatedGateArrival && !otimes.scheduledGateArrival)
                        newEstimate = parseInt(moment(otimes.estimatedRunwayArrival), 'YYYY-MM-DDTHH:mm:ss.SSSZ').format('X');
                    else
                        newEstimate = parseInt(moment((otimes.estimatedGateArrival?otimes.estimatedGateArrival.dateLocal:otimes.scheduledGateArrival.dateLocal), 'YYYY-MM-DDTHH:mm:ss.SSSZ').format('X'));

                    var origEstimate = new Date(currentestimate);
                    var secondsDiff = newEstimate - origEstimate.getTime()/1000;
                    var nowTime = Math.floor(Date.now()/1000);

                    if (nowTime - newEstimate > 5*60) // > 5 minutes since original arrival estimate. Old!
                        client.query("UPDATE travelchecking SET status='TERMINATED',currentestimatetravelarrival=($1) WHERE id=($2)",
                            [(otimes.estimatedGateArrival?otimes.estimatedGateArrival.dateLocal:otimes.scheduledGateArrival.dateLocal),
                            uniqueID ]);
                    else if (secondsDiff > 15*60)
                        client.query("UPDATE travelchecking SET status='ACTIVE',checkiteration=2,currentestimatetravelarrival=($1),nexttravelcheckdate=timestamp '" +
                            (otimes.estimatedGateArrival?otimes.estimatedGateArrival.dateLocal:otimes.scheduledGateArrival.dateLocal)+"'  - interval '" + config.limitCheck + " minutes' WHERE id=($2)",
                            [(otimes.estimatedGateArrival?otimes.estimatedGateArrival.dateLocal:otimes.scheduledGateArrival.dateLocal),
                            uniqueID ]);
                    else  //we're good and don't need to check this one again
                        client.query("UPDATE travelchecking SET currentestimatetravelarrival=($1),checkiteration=99 WHERE id=($2)",
                            [(otimes.estimatedGateArrival?otimes.estimatedGateArrival.dateLocal:otimes.scheduledGateArrival.dateLocal),
                            uniqueID ]);
                }
            }
            else if (checkstatus == 'UNCHECKED') {  // getting an initial estimate of arrival and setup for another check 30 minutes prior to this estimate
                if (otimes.estimatedGateArrival||otimes.scheduledGateArrival) {

                    client.query("UPDATE travelchecking SET status='ACTIVE',currentestimatetravelarrival=($1), initialtravelarrival=($2),nexttravelcheckdate=timestamp '" +
                        (otimes.estimatedGateArrival?otimes.estimatedGateArrival.dateLocal:otimes.scheduledGateArrival.dateLocal)+ "'  - interval '" + config.limitCheck + " minutes', checkiteration=1  WHERE id=($3)",
                        [(otimes.estimatedGateArrival?otimes.estimatedGateArrival.dateLocal:otimes.scheduledGateArrival.dateLocal),
                        (otimes.scheduledGateArrival?otimes.scheduledGateArrival.dateLocal:otimes.estimatedGateArrival.dateLocal),
                        uniqueID]);
                } else if (otimes.estimatedRunwayArrival) {
                    client.query("UPDATE travelchecking SET status='ACTIVE',currentestimatetravelarrival=($1), initialtravelarrival=($2),nexttravelcheckdate=timestamp '" +
                        otimes.estimatedRunwayArrival.dateLocal + "' - interval ' " + config.limitCheck + " minutes', checkiteration=1 WHERE id=($3)",
                        [otimes.estimatedRunwayArrival.dateLocal,
                        otimes.estimatedRunwayArrival.dateLocal,
                        uniqueID]);
                }

            }
        }
        // We have some other details that allow us to estimate arrival
        else if (otimes.estimatedRunwayArrival || otimes.actualRunwayArrival) {

            if (checkstatus == 'UNCHECKED') {
                if (otimes.actualRunwayArrival != null)
                client.query("UPDATE travelchecking SET status='TERMINATED',initialtravelarrival=($1),currentestimatetravelarrival=($2) WHERE id=($3)",
                [otimes.actualRunwayArrival.dateLocal,otimes.actualRunwayArrival.dateLocal,uniqueID ]);
            }
            else if (checkstatus == 'CHECKED' || checkstatus == 'ACTIVE') {

            if (otimes.actualRunwayArrival != null)
                client.query("UPDATE travelchecking SET status='TERMINATED',currentestimatetravelarrival=($1),nexttravelcheckdate=to_timestamp(($2)) WHERE id=($3)",
                [otimes.actualRunwayArrival.dateLocal,Math.floor(Date.now()/1000),uniqueID ]);
            else if (otimes.estimatedRunwayArrival != null)
                client.query("UPDATE travelchecking SET status='ACTIVE',initialtravelarrival=($1),currentestimatetravelarrival=($2),nexttravelcheckdate=to_timestamp(($3)) WHERE id=($4)",
                    [otimes.estimatedRunwayArrival.dateLocal,otimes.estimatedRunwayArrival.dateLocal,Math.floor(Date.now()/1000),uniqueID ]);

            }
        }

        if (fs.delays && otimes.estimatedGateArrival) {
            client.query("UPDATE travelapi SET delay=($1), estimatedarrival=($2) WHERE id=($3)",
                [fs.delays.arrivalGateDelayMinutes, otimes.estimatedGateArrival.dateLocal, apiRowID]);
        } else if (otimes.estimatedGateArrival) {
            client.query("UPDATE travelapi SET delay=0, estimatedarrival=($1) WHERE id=($2)",
                [otimes.estimatedGateArrival.dateLocal, apiRowID]);
        } else if (otimes.scheduledGateArrival) {
             client.query("UPDATE travelapi SET delay=0, estimatedarrival=($1) WHERE id=($2)",
                [otimes.scheduledGateArrival.dateLocal, apiRowID]);
        }
        done();
        });
    }
    } else {  // Error response

        // query PG and update
        pg.connect(config.connectionString, function(err, client, done) {
            if (err) {
                done();
                logger.info(err);
            }
            client.query("UPDATE travelchecking SET status='TRAVELID_ERROR' where id=($1)", [uniqueID]);
            done();
        });
    }
    });

    res.on('error', function(e){
        logger.info(e.message);
    });
    }.bind({travelid:travelid,checkstatus:checkstatus}));

    req.end();
    req.on('error', function(err){
      logger.info("Error: ", err);
    });

  },

  expirator: function() {
    logger.info('Checking flights...' + ++counter);
    //if (counter == 75)
    //  process.exit();

    var results = [];
    pg.connect(config.connectionString, function(err, client, done) {
      if (err) {
        done();
        console.log(err);
      }
      var nowTime = Math.floor(Date.now()/1000);
      var query = client.query("SELECT *, to_char(currentestimatetravelarrival,'YYYY-MM-DD HH24:MM:ss') as current FROM travelchecking WHERE (checkiteration < 99 OR checkiteration = NULL) AND typeofplace ='A' AND status != 'TRAVELID_ERROR' AND status != 'ARRIVED' AND status != 'TERMINATED';");
      query.on('row', function(row) {
        results.push(row);
      });
      query.on('end', function() {
        done();
        if (results) {
          results.forEach(function(f){
            var uniqueID = f.id;
            var travelid = f.travelid.substring(0,2) + f.travelid.substring(2,f.travelid.length);
            var checkstatus = f.status;
            // check criteria for making Flight Stats API call - always make when INITIAL
            var time2arrival = Math.floor(f.initialtravelarrival/1000) - Math.floor(Date.now() / 1000);
            var check2arrival = 0;
            if (f.currentestimatetravelarrival > 0)
                check2arrival = Math.floor(f.currentestimatetravelarrival/1000) - Math.floor(Date.now()/1000);
            else
                check2arrival = Math.floor(f.initialtravelarrival/1000) - Math.floor(Date.now()/1000);
            var time2check = 0;

            // UNCHECKED - record just added to the table. No query to the API yet
            // CHECKED - first check of arrival tiem retrieved. Won't be checked again until within configurable time of arrival
            // ACTIVE - flight that is being actively checked for status
            if ((checkstatus == 'UNCHECKED') || (checkstatus == 'ACTIVE' && time2arrival > 0) || (checkstatus == 'TRAVELID_ERROR') ||
                (checkstatus == 'CHECKED' && (time2arrival < config.firstCheck * 60) && (time2arrival > 0)))
            {
                switch (checkstatus) {
                    case 'UNCHECKED':
                        if ((time2arrival < config.firstCheck * 60) && (time2arrival > -7200)) {
                            console.log(new Date().toLocaleString() + " Initial API check - " + travelid);
                            logger.info(new Date().toLocaleString() + " Initial API check - " + travelid);
                            flightcheck.flightStatsDoCheck(f, checkstatus);
                        }
                        break;
                    case 'ACTIVE':
                        // is it time to check again?
                        time2check = Math.floor(f.nexttravelcheckdate/1000) - Math.floor(Date.now()/1000);
                        if (time2check < 5 * 60) {
                            console.log(new Date().toLocaleString() + " Second API check - " + travelid);
                            logger.info(new Date().toLocaleString() + " Second API check - " + travelid);
                            flightcheck.flightStatsDoCheck(f, checkstatus);
                        }
                        break;
                    case 'CHECKED':
                    break;
                    case 'TRAVELID_ERROR':
                    break;
                    default:
                    break;
                }
          } else if (check2arrival <= -(5*60)) {
              //already arrived...terminate
              client.query("UPDATE travelchecking SET status='TERMINATED' WHERE id=($1)",
                [uniqueID]);
          }
        });
     }
   });
  });
 }
}

module.exports = flightcheck;
