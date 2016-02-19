var express = require('express');
var router = express.Router();
var pg = require('pg');
var path = require('path');
var connectionString = require(path.join(__dirname, '../', '../', 'config'));
var config = require(path.join(__dirname, '../', '../', 'config'));
var https = require('https');
var jsonQuery = require('json-query');
var airports = require('../../server/classes/airport');

var options = {
  host: 'api.flightstats.com',
  method: 'GET'
}

var flightcheck = {
  init: function() {
    console.log('Started flight check...');
    setInterval(this.expirator.bind(this), 60000); //check flight status every minute
  },
  expirator: function() {
    console.log('Checking flights...');
    var results = [];
    pg.connect(config.connectionString, function(err, client, done) {
      if (err) {
        done();
        console.log(err);
      }
      var query = client.query("SELECT * FROM travelchecking WHERE status != 'TRAVELID_ERROR' AND status != 'ARRIVED';");
      //var query = client.query("SELECT * FROM travelchecking WHERE status != 'ARRIVED';");
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
            var time2arrival = Math.floor(f.initialtravelarrival/1000) - Math.floor(Date.now() / 1000 +
                                config.tzOffset *3600);  //tz diffs

            //debugger;
            // INITIAL - record just added to the table. No query to the API yet
            // CHECKED - first check of arrival tiem retrieved. Won't be checked again until within configurable time of arrival
            // ACTIVE - flight that is being actively checked for status
            if ((checkstatus == 'INITIAL') || (checkstatus == 'ACTIVE') || (checkstatus == 'TRAVELID_ERROR') ||
                (checkstatus == 'CHECKED' && (time2arrival < config.firstCheckTime)))
            {
              options.path = config.flightstatsPath + f.travelid.substring(0,2) +'/'
                + f.travelid.substring(2,f.travelid.length)
                + '/arr/20' + f.pickupday.substring(6,8) + '/' + f.pickupday.substring(3,5) + '/' + f.pickupday.substring(0,2)
                +'?appId=' + config.flightstatsAppID + '&appKey=' + config.flightstatsAppKey + '&utc=false';

              var req = https.request(options, function(res,options) {
                res.on('data', function(data){
                  var fd = JSON.parse(data);
                  //debugger;
                  console.log(travelid + ' ' + checkstatus);
                  if (fd.error == null) {
                    if (fd.flightStatuses.length == 0) {
                       pg.connect(config.connectionString, function(err, client, done) {
                        if (err) {
                            done();
                            console.log(err);
                            }
                        client.query("UPDATE travelchecking SET status='TRAVELID_ERROR' where travelid=($1)", [travelid]);
                        done();
                      });
                    }
                    
                    var fs = fd.flightStatuses[0];
                    if (fs == null || (fs.arrivalAirportFsCode != 'ORY' && fs.arrivalAirportFsCode != 'CDG')) {
                       pg.connect(config.connectionString, function(err, client, done) {
                        if (err) {
                            done();
                            console.log(err);
                            }

                        client.query("UPDATE travelchecking SET status='TRAVELID_ERROR' where travelid=($1)", [travelid]);
                        done();
                      });                        
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

                        from_airport = coder.value;
                        if (from_airport == null) {
                          from_airport = "UNK";
                        }
                        if (from_airport.length > 30) {
                          from_airport = from_airport.substring(0,30);
                        }

                        // is the API reporting an estimated gate arrival time?
                        if (otimes.estimatedGateArrival||otimes.scheduledGateArrival) {
                          if (checkstatus == 'CHECKED')
                            client.query("UPDATE travelchecking SET status='ACTIVE',currentestimatetravelarrival=($1) WHERE travelid=($2)",
                              [(otimes.estimatedGateArrival?otimes.estimatedGateArrival.dateLocal:otimes.scheduledGateArrival.dateLocal),travelid ]);
                          else if (checkstatus == 'ACTIVE') {
                            if (otimes.actualGateArrival) {
                                client.query("UPDATE travelchecking SET status='ARRIVED',currentestimatetravelarrival=($1),nexttravelcheckdate=to_timestamp(($2)) WHERE travelid=($3)",
                                    [otimes.actualGateArrival.dateLocal,Math.floor(Date.now()/1000),travelid ]);
                            } else 
                                client.query("UPDATE travelchecking SET status='ACTIVE',currentestimatetravelarrival=($1),nexttravelcheckdate=to_timestamp(($2)) WHERE travelid=($3)",
                                    [(otimes.estimatedGateArrival?otimes.estimatedGateArrival.dateLocal:otimes.scheduledGateArrival.dateLocal),
                                        Math.floor(Date.now()/1000),
                                        travelid ]);
                          }
                          else if (checkstatus == 'INITIAL')
                            client.query("UPDATE travelchecking SET status='ACTIVE',initialtravelarrival=($1),nexttravelcheckdate=to_timestamp(($2)) WHERE travelid=($3)",
                              [otimes.scheduledGateArrival.dateLocal,Math.floor(Date.now()/1000),travelid ]);
                        }
                        else if (otimes.estimatedRunwayArrival) {
                          if (checkstatus == 'INITIAL') {
                              if (otimes.actualRunwayArrival != null)
                                client.query("UPDATE travelchecking SET status='ARRIVED',initialtravelarrival=($1),currentestimatetravelarrival=($2) WHERE travelid=($3)",
                                [otimes.actualRunwayArrival.dateLocal,otimes.actualRunwayArrival.dateLocal,travelid ]);                            
                          }
                          else if (checkstatus == 'CHECKED' || checkstatus == 'ACTIVE') {  

                            if (otimes.actualRunwayArrival != null)
                                client.query("UPDATE travelchecking SET status='ARRIVED',currentestimatetravelarrival=($1),nexttravelcheckdate=to_timestamp(($2)) WHERE travelid=($3)",
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

          }
          });
        }

      });
    });
  }
}

module.exports = flightcheck;
