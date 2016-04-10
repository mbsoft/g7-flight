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

var options = {
  host: 'api.flightstats.com',
  method: 'GET'
}

var flightcheck = {
  init: function() {
    console.log('Started flight check...');
    config.init();
    setInterval(this.expirator.bind(this), 15000); //check for flights to check every 15 seconds - NOT checking the API every 15 seconds
  },
  
  flightStatsError: function(travelid) {
    pg.connect(config.connectionString, function(err, client, done) {
        if (err) {
        done();
        console.log(err);
        }
        client.query("UPDATE travelchecking SET status='TRAVELID_ERROR' where travelid=($1)", [travelid]);
        done();
    });       
  },
  
  flightStatsLogApi: function(f, call) {
        pg.connect(config.connectionString, function(err, client, done) {
            if (err) {
                done();
                console.log(err);
            }
            client.query("INSERT INTO travelapi VALUES (now(),'" + f.travelid + "','"+call+"')");
            done();
        });     
  },
  
  flightStatsDoCheck: function(f, status) {
    console.log(Date.now().toLocaleString() + " API check");
    //debugger;
    var travid = f.travelid.match(/(\d+|[^\d]+)/g).join(',').split(',');
    var travelid = f.travelid.substring(0,2) + f.travelid.substring(2,f.travelid.length);
    var checkstatus = f.status;
    var currentestimate = f.currentestimatetravelarrival;
    options.path = config.flightstatsPath + travid[0] +'/'
        + travid[1]
        + '/arr/20' + f.pickupday.substring(6,8) + '/' + f.pickupday.substring(3,5) + '/' + f.pickupday.substring(0,2)
        +'?appId=' + config.flightstatsAppID + '&appKey=' + config.flightstatsAppKey + '&utc=false' + '&airport=' + f.internationalcode;
        
    // Log the check in the API call table
    flightcheck.flightStatsLogApi(f, options.path);
    
    var req = https.request(options, function(res,options) {
    res.on('data', function(data){
        var fd = JSON.parse(data);
        console.log(travelid + ' ' + checkstatus);
        debugger;
        if (fd.error == null) {
        if (fd.flightStatuses.length == 0) {
            flightcheck.flightStatsError(travelid);      
        }
             
        var fs;
        var i=0;
        while ((fs = fd.flightStatuses[i++]) != null)
        {
            debugger;
            if ((fs.arrivalAirportFsCode != 'LGA') && (fs.arrivalAirportFsCode != 'ORY' && fs.arrivalAirportFsCode != 'CDG'))
                continue;
            else {
                break;
            }
        }
        
        if (fs == null || (fs.arrivalAirportFsCode != 'LGA' && fs.arrivalAirportFsCode != 'ORY' && fs.arrivalAirportFsCode != 'CDG')) {
            flightcheck.flightStatsError(travelid);                       
        } else if (fs != null) {

        // query PG and update
        pg.connect(config.connectionString, function(err, client, done) {
        if (err) {
            done();
            console.log(err);
        }

        var otimes = fs.operationalTimes;
        var from_airport = fs.departureAirportFsCode;
        var coder = jsonQuery('codes[Code='+from_airport+'].Name', {
            data: Airports
        });
        debugger;
        from_airport = coder.value;
        if (from_airport == null) {
            from_airport = "UNK";
        }
        if (from_airport.length > 30) {
            from_airport = from_airport.substring(0,30);
        }
        
        //debugger;
        // We have details on the scehduled arrival in the response
        if (otimes.estimatedGateArrival||otimes.scheduledGateArrival||otimes.estimatedRunwayArrival) {
            debugger;
            if (checkstatus == 'ACTIVE') {
                if (otimes.actualGateArrival) { // flight has arrived at gate.
                    client.query("UPDATE travelchecking SET status='TERMINATED',currentestimatetravelarrival=($1),nexttravelcheckdate=to_timestamp(($2)) WHERE travelid=($3)",
                        [otimes.actualGateArrival.dateLocal,Math.floor(Date.now()/1000),travelid ]);
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
                        client.query("UPDATE travelchecking SET status='TERMINATED',currentestimatetravelarrival=($1) WHERE travelid=($2)",
                            [(otimes.estimatedGateArrival?otimes.estimatedGateArrival.dateLocal:otimes.scheduledGateArrival.dateLocal),
                            travelid ]);                   
                    else if (secondsDiff > 15*60)
                        client.query("UPDATE travelchecking SET status='ACTIVE',checkiteration=2,currentestimatetravelarrival=($1),nexttravelcheckdate=timestamp '" + 
                            (otimes.estimatedGateArrival?otimes.estimatedGateArrival.dateLocal:otimes.scheduledGateArrival.dateLocal)+"'  - interval '" + config.limitCheck + " minutes' WHERE travelid=($2)",
                            [(otimes.estimatedGateArrival?otimes.estimatedGateArrival.dateLocal:otimes.scheduledGateArrival.dateLocal),
                            travelid ]); 
                    else  //we're good and don't need to check this one again                      
                        client.query("UPDATE travelchecking SET currentestimatetravelarrival=($1),checkiteration=99 WHERE travelid=($2)",
                            [(otimes.estimatedGateArrival?otimes.estimatedGateArrival.dateLocal:otimes.scheduledGateArrival.dateLocal),
                            travelid ]);
                }
            }
            else if (checkstatus == 'UNCHECKED') {  // getting an initial estimate of arrival and setup for another check 30 minutes prior to this estimate
                if (otimes.estimatedGateArrival||otimes.scheduledGateArrival) {
                    client.query("UPDATE travelchecking SET status='ACTIVE',currentestimatetravelarrival=($1), initialtravelarrival=($2),nexttravelcheckdate=timestamp '" +
                        (otimes.estimatedGateArrival?otimes.estimatedGateArrival.dateLocal:otimes.scheduledGateArrival.dateLocal)+ "'  - interval '" + config.limitCheck + " minutes', checkiteration=1  WHERE travelid=($3)",
                        [(otimes.estimatedGateArrival?otimes.estimatedGateArrival.dateLocal:otimes.scheduledGateArrival.dateLocal),
                        (otimes.scheduledGateArrival?otimes.scheduledGateArrival.dateLocal:otimes.publishedArrival.dateLocal), 
                        travelid]);      
                } else if (otimes.estimatedRunwayArrival) {
                    client.query("UPDATE travelchecking SET status='ACTIVE',currentestimatetravelarrival=($1), initialtravelarrival=($2),nexttravelcheckdate=timestamp '" +
                        otimes.estimatedRunwayArrival.dateLocal + "' - interval ' " + config.limitCheck + " minutes', checkiteration=1 WHERE travelid=($3)",
                        [otimes.estimatedRunwayArrival.dateLocal,
                        otimes.estimatedRunwayArrival.dateLocal,
                        travelid]);
                }

            }
        }
        // We have some other details that allow us to estimate arrival
        else if (otimes.estimatedRunwayArrival || otimes.actualRunwayArrival) {
            debugger;
            if (checkstatus == 'UNCHECKED') {
                if (otimes.actualRunwayArrival != null)
                client.query("UPDATE travelchecking SET status='TERMINATED',initialtravelarrival=($1),currentestimatetravelarrival=($2) WHERE travelid=($3)",
                [otimes.actualRunwayArrival.dateLocal,otimes.actualRunwayArrival.dateLocal,travelid ]);                            
            }
            else if (checkstatus == 'CHECKED' || checkstatus == 'ACTIVE') {  

            if (otimes.actualRunwayArrival != null)
                client.query("UPDATE travelchecking SET status='TERMINATED',currentestimatetravelarrival=($1),nexttravelcheckdate=to_timestamp(($2)) WHERE travelid=($3)",
                [otimes.actualRunwayArrival.dateLocal,Math.floor(Date.now()/1000),travelid ]);
            else if (otimes.estimatedRunwayArrival != null)
                client.query("UPDATE travelchecking SET status='ACTIVE',initialtravelarrival=($1),currentestimatetravelarrival=($2),nexttravelcheckdate=to_timestamp(($3)) WHERE travelid=($4)",
                    [otimes.estimatedRunwayArrival.dateLocal,otimes.estimatedRunwayArrival.dateLocal,Math.floor(Date.now()/1000),travelid ]);
                        
            }
        }
        done();
        });
    }
    } else {  // Error response
        debugger;
        // query PG and update
        pg.connect(config.connectionString, function(err, client, done) {
            if (err) {
                done();
                console.log(err);
            }
            client.query("UPDATE travelchecking SET status='TRAVELID_ERROR' where travelid=($1)", [travelid]);
        });
    }
    });

    res.on('error', function(e){
        //console.log(e.message);
    });
    }.bind({travelid:travelid,checkstatus:checkstatus}));

    req.end();
    req.on('error', function(err){
    //console.log("Error: ", err);
    });
    
  },
  
  expirator: function() {
    console.log('Checking flights...');
    var results = [];
    pg.connect(config.connectionString, function(err, client, done) {
      if (err) {
        done();
        console.log(err);
      }
      var nowTime = Math.floor(Date.now()/1000);
      var query = client.query("SELECT *, to_char(currentestimatetravelarrival,'YYYY-MM-DD HH24:MM:ss') as current FROM travelchecking WHERE (checkiteration < 99 OR checkiteration = NULL) AND status != 'TRAVELID_ERROR' AND status != 'ARRIVED' AND status != 'TERMINATED';");
      query.on('row', function(row) {
        results.push(row);
      });
      query.on('end', function() {
        done();
        if (results) {
          results.forEach(function(f){
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
            //debugger;
            // UNCHECKED - record just added to the table. No query to the API yet
            // CHECKED - first check of arrival tiem retrieved. Won't be checked again until within configurable time of arrival
            // ACTIVE - flight that is being actively checked for status
            if ((checkstatus == 'UNCHECKED') || (checkstatus == 'ACTIVE' && time2arrival > 0) || (checkstatus == 'TRAVELID_ERROR') ||
                (checkstatus == 'CHECKED' && (time2arrival < config.firstCheck * 60) && (time2arrival > 0)))
            {
                switch (checkstatus) {
                    case 'UNCHECKED':
                        if (time2arrival < config.firstCheck * 60) {
                            console.log(new Date().toLocaleString() + " Initial API check - " + travelid);
                            flightcheck.flightStatsDoCheck(f, checkstatus);
                        }
                        break;
                    case 'ACTIVE':
                        // is it time to check again?
                        time2check = Math.floor(f.nexttravelcheckdate/1000) - Math.floor(Date.now()/1000);
                        if (time2check < 5 * 60) {
                            console.log(new Date().toLocaleString() + " Second API check - " + travelid);
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
              client.query("UPDATE travelchecking SET status='TERMINATED' WHERE travelid=($1)",
                [travelid]);
          }
        });
     }
   });
  });
 }
}

module.exports = flightcheck;
