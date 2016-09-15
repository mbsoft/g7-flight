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
  host: 'api.sncf.com',
  auth: config.trainUserKey + ':' + '',
  method: 'GET'
}

var apiRowID = 0;

var traincheck = {
  init: function() {
    console.log('Started train check...');
    config.init();
    setInterval(this.expirator.bind(this), 25000); //check for flights to check every 15 seconds - NOT checking the API every 15 seconds
  },
  
  trainError: function(travelid) {
    pg.connect(config.connectionString, function(err, client, done) {
        if (err) {
        done();
        console.log(err);
        }
        debugger;
        client.query("UPDATE travelchecking SET status='TRAVELID_ERROR' where travelid=($1)", [travelid]);
        done();
    });       
  },
  
  trainLogApi: function(f, call) {
        pg.connect(config.connectionString, function(err, client, done) {
            if (err) {
                done();
                console.log(err);
            }
            client.query("INSERT INTO travelapi VALUES (now(),'" + f.travelid + "','"+call+"') RETURNING id",
                function(err, result) {
		    debugger;
                    if (err) {

                    } else {
                        apiRowID = result.rows[0].id;
                    }
                });
            done();
        });     
  },
  
  trainDoCheck: function(f, status) {
    console.log(Date.now().toLocaleString() + " API check");
    var travid = f.travelid.match(/(\d+|[^\d]+)/g).join(',').split(',');
    if (travid.length == 1) {
        travid.push(travid[0]);
    }
    var travelid = f.travelid.substring(0,2) + f.travelid.substring(2,f.travelid.length);
    var checkstatus = f.status;
    var station = f.station;
    var currentestimate = f.currentestimatetravelarrival;
    var datestring = '&since='+moment().format('YYYYMMDD')+'T000100'+'&until='+moment().format('YYYYMMDD')+'T235900';
    var results = [];
    options.path = config.trainPath + '?headsign=' + travid[0].trim().toUpperCase() +datestring;
    
    // Log the check in the API call table
    traincheck.trainLogApi(f, options.path);
    
    //var auth = 'Basic ' + new Buffer(config.trainUserKey + ':' + '').toString('base64');
      debugger;
    var req = https.request(options, function(res,options) {
        var body = '';
        res.on('data', function(d){
            body += d;
        });
        
        res.on('end', function(e){
	    debugger;
           var fd;
           try {
            fd = JSON.parse(body);
           } catch (err) {
	       console.log(err);
	       logger.info(err);
               traincheck.trainError(travelid);
           }
           if (fd.error == null) {
               if (fd.vehicle_journeys.length == 0) {
                   traincheck.trainError(travelid);
               }
           }
           var ts;
           var i = 0;
           pg.connect(config.connectionString, function(err, client, done) {
              if (err) {
                  done();
                  console.log(err);
              } 
              var query = client.query("SELECT * FROM travelplaces WHERE g7pickupzone=($1)", [station]);
              query.on('row', function(row) {
                  results.push(row);
              });
              query.on('end', function() {
                if (fd.error != null) {
                    debugger;
                    traincheck.trainError(travelid);
                } else {
                    var stops = fd.vehicle_journeys[0].stop_times;
                    var disrupts = fd.disruptions;
                    var stopFound = false;
                    debugger;
                    for (var k=0; k < stops.length; k++) {
                        if (results.length > 0 && stops[k].stop_point.name == results[0].internationalname) {
                            //found the stop, now get the arrival time
                            stopFound = true;
                            var sArrive = moment().format('YYYY-MM-DD') + stops[k].arrival_time;
                            var sUpdateArrive = sArrive;
                            var arrivalTime = parseInt(moment(sArrive, 'YYYY-MM-DDHHmmSS').format('X'));
                            if (checkstatus == 'UNCHECKED') {  //initial API check 
                                debugger;
                                if (disrupts.length) {
                                    //...check validity
                                    for (var j=0; j < disrupts.length; j++) {
                                        var period1 = parseInt(moment(disrupts[j].application_periods[0].end,'YYYYMMDD\THHmmss').format('X'));
                                        var period2 = parseInt(moment().format('X'));
                                        if (period1-period2-3600 > 0 && (period1-period2 <86400)) {
                                            console.log('Found disruption...' + disrupts[j].application_periods[0]);
                                            // check if our stop is affected
                                            if (disrupts[j].impacted_objects.length) {
                                                var disruptStops = disrupts[j].impacted_objects[0].impacted_stops;
                                                for (var m=0; m < disruptStops.length; m++) {
                                                    if (disruptStops[m].stop_point.name == results[0].internationalname) {
                                                        sUpdateArrive = moment().format('YYYY-MM-DD') + disruptStops[m].amended_arrival_time;
                                                        arrivalTime = parseInt(moment(sArrive, 'YYYY-MM-DDHHmmSS').format('X'));
                                                        break;
                                                    }
                                                }
                                            }
                                            break;
                                        } 
                                    }
                                }
                                var query2 = client.query("UPDATE travelchecking SET status='ACTIVE',initialtravelarrival=to_timestamp($1,'YYYY-MM-DDHH24MISS'), " + 
                                    " currentestimatetravelarrival=to_timestamp($2,'YYYY-MM-DDHH24MISS')," + 
                                    " nexttravelcheckdate=to_timestamp($3,'YYYY-MM-DDHH24MISS') - interval  '" + config.secondCheckTrain + " minutes', checkiteration=1 " +
                                    " WHERE travelid=($4)",
                                    [sArrive, sUpdateArrive, sArrive, travelid]);
                            } else if (checkstatus == 'ACTIVE') {  //second API check
                                if (disrupts.length) {
                                    //...check validity
                                    for (var j=0; j < disrupts.length; j++) {
                                        var period1 = parseInt(moment(disrupts[j].application_periods[0].end,'YYYYMMDD\THHmmss').format('X'));
                                        var period2 = parseInt(moment().format('X'));
                                        if (period1-period2 > 0 && (period1-period2 <86400)) {
                                            console.log('Found disruption...' + disrupts[j].application_periods[0]);
                                            // check if our stop is affected
                                            if (disrupts[j].impacted_objects.length) {
                                                var disruptStops = disrupts[j].impacted_objects[0].impacted_stops;
                                                for (var m=0; m < disruptStops.length; m++) {
                                                    if (disruptStops[m].stop_point.name == results[0].internationalname) {
                                                        //debugger;
                                                        sUpdateArrive = moment().format('YYYY-MM-DD') + disruptStops[m].amended_arrival_time;
                                                        arrivalTime = parseInt(moment(sArrive, 'YYYY-MM-DDHHmmSS').format('X'));
                                                        break;
                                                    }
                                                }
                                            }
                                            break;
                                        } 
                                    }
                                }
                                var query2 = client.query("UPDATE travelchecking SET status='TERMINATED',initialtravelarrival=to_timestamp($1,'YYYY-MM-DDHH24MISS'), " + 
                                    " currentestimatetravelarrival=to_timestamp($2,'YYYY-MM-DDHH24MISS')," + 
                                    " nexttravelcheckdate=to_timestamp($3,'YYYY-MM-DDHH24MISS') - interval  '" + config.secondCheckTrain + " minutes', checkiteration=99 " +
                                    " WHERE travelid=($4)",
                                    [sArrive, sUpdateArrive, sArrive, travelid]);
                                    
                                var calcDelay = parseInt(moment(sUpdateArrive, 'YYYY-MM-DDHHmmSS').format('X')) - 
                                                parseInt(moment(sArrive, 'YYYY-MM-DDHHmmSS').format('X'));
                                client.query("UPDATE travelapi SET delay=($1), estimatedarrival=($2) where id=($3)",
                                    [calcDelay, sUpdateArrive, apiRowID])
                            }
                            break;
                        }

                    } 
                }
                if (stopFound === false) {
                    debugger;
                    traincheck.trainError(travelid);
                 }
              });
              done();
           });
           console.log(travelid + ' ' + station + ' ' + checkstatus);
        });
        
        res.on('error', function(e){
            debugger;
            console.log(e.message);
        });

    }.bind({travelid:travelid,checkstatus:checkstatus,station:station})); 
    
    req.end();
    req.on('error', function(err){
        pg.connect(config.connectionString, function(err, client, done) {
            if (err) {
                done();
                console.log(err);
            }
            client.query("UPDATE travelchecking SET status='TRAVELID_ERROR' where travelid=($1)", [travelid]);
            done();
        });
    });


  },
  
  expirator: function() {
    console.log('Checking trains...');
    var results = [];
    pg.connect(config.connectionString, function(err, client, done) {
      if (err) {
        done();
        console.log(err);
      }
      var nowTime = Math.floor(Date.now()/1000);
      var query = client.query("SELECT *, to_char(currentestimatetravelarrival,'YYYY-MM-DD HH24:MM:ss') as current FROM travelchecking WHERE (checkiteration < 99 OR checkiteration = NULL) AND typeofplace ='G' AND status != 'TRAVELID_ERROR' AND status != 'ARRIVED' AND status != 'TERMINATED';");
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
                (checkstatus == 'CHECKED' && (time2arrival < config.firstCheckTrain * 60) && (time2arrival > 0)))
            {
                switch (checkstatus) {
                    case 'UNCHECKED':
                        if (time2arrival < config.firstCheckTrain * 60) {
                            console.log(new Date().toLocaleString() + " Initial API check - " + travelid);
                            f.station = f.internationalcode;
                            traincheck.trainDoCheck(f, checkstatus);
                        }
                        break;
                    case 'ACTIVE':
                        // is it time to check again?
                        //debugger;
                        time2check = Math.floor(f.nexttravelcheckdate/1000) - Math.floor(Date.now()/1000);
                        if (time2check < 5 * 60) {
                            console.log(new Date().toLocaleString() + " Second API check - " + travelid);
                            f.station = f.internationalcode;
                            traincheck.trainDoCheck(f, checkstatus);
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

module.exports = traincheck;
