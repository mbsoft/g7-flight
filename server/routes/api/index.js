var express = require('express');
var _ = require('underscore');
//var router = express.Router();
var apirouter = express();
var pg = require('pg');
var path = require('path');
var env = process.env.G7TRAVEL_ENV;
var moment = require('moment');
var connectionString = require(path.join(__dirname,  '../','../', 'config/'+env+'.js'));
var config = require(path.join(__dirname, '../','..', 'config/'+env+'.js'));
var https = require('https');
var util = require('util');
var jsonQuery = require('json-query');
var airports = require('../../../server/classes/airport');
var randomstring = require('randomstring');
var logger = require(path.join(__dirname, '../..', 'classes','logging')).logger;

var options = {
  host: 'api.flightstats.com',
  method: 'GET'
}



var arrUnique = function(arr) {
    //deal with some duplicate results
    var cleaned = [];
    arr.forEach(function(itm) {
        var unique = true;
        cleaned.forEach(function(itm2) {
            if (_.isEqual(itm, itm2)) unique = false;
        });
        if (unique) cleaned.push(itm);
    });
    return cleaned;
};

var arrFuture = function(arr, row) {
    var cleaned = [];
    arr.forEach(function(itm) {
        if (itm.pickupday == row.pickupday) {

            if (itm.lastdueridetimestamp > 0 && (Math.abs(itm.lastdueridetimestamp - row.arrtime)) > 60)
                cleaned.push(itm);
            else if (itm.initialdueridetimestamp < row.arrtime && itm.lastdueridetimestamp == 0)
                cleaned.push(itm);
        }
    });
    return cleaned;
};

// GET - heartbeat
apirouter.get('/v1/heartbeat', function(req, res) {
  logger.info('/v1/heartbeat request');
  var results = [];
  pg.connect(config.connectionString, function(err, client, done) {
    if (err) {
      done();
      console.log(err);
      return res.status(500).json({ success: false, data: err});
    }

    var query = client.query("SELECT * FROM travelers ORDER BY initialdueridetimestamp");
      query.on('row', function(row) {
      results.push(row);
    });
    query.on('end', function() {
      done();
      return res.json(results);
    });
  });
});

// POST - update a traveler record
apirouter.post('/v1/travelers/update', function(req, res, err1) {

    logger.info('/v1/travelers/update request ' + JSON.stringify(req.body));
    var reqBody = req.body;

    // validate the travel ID parameter
    var travelid = reqBody.travelid;
    // No need to store short travelid's
    if (travelid.length < 3)
        return res.json();
    var strLen = travelid.length;
    travelid = travelid.replace(/\s/g, "");
    // No need to store travelid's with non-ASCII chars?
    for (var i = 0, strLen = travelid.length; i < strLen; ++i) {
        if (travelid.charCodeAt(i) > 127)
            return res.json();
    }

    travelid = travelid.replace(/\s/g, "");
    pg.connect(config.connectionString, function(err, client, done) {
        if (err) {
            console.log(err);
        }
        var query = client.query("SELECT * FROM travelers WHERE ridenumber=" + reqBody.ridenumber);
        debugger;
        query.on('row', function(row) {
           // record exists...update it
           if (row.travelid == travelid) {
               // no change in travelid so just udpate traveler record
               var updateQuery = client.query("UPDATE travelers SET travelid=($1)," +
                "pickupday=($2),subscriptioncode=($3),requestedby=($4),refclient=($5),g7pickupzone=($6)," +
                "fromplace=($7),typeofplace=($8),lastdueridetimestamp=($9)," +
                "ridestatus=($10) WHERE ridenumber=($11)",
                [travelid,
                 reqBody.pickupday, reqBody.subscriptioncode,
                 reqBody.refclient, reqBody.requestedby,
                 reqBody.g7pickupzone, reqBody.fromplace,
                 reqBody.typeofplace,
                 reqBody.initialdueridetimestamp, row.ridestatus, reqBody.ridenumber]);

           } else {
               // changed flights so need to see if there's any need to
               // continue doing travel checking on the saved flight
               var rowquery = client.query("SELECT COUNT(*) FROM travelchecking WHERE travelid='"+
                                            row.travelid+"' and pickupday='" + reqBody.pickupday + "'");
               rowquery.on('row', function(rowcount) {
                   debugger;
                   if (rowcount.count == 0) {
                       // not currently travel checking this flight - no change to travelchecking required
                       // just update traveler record with new content
                      var updateQuery = client.query("UPDATE travelers SET travelid=($1)," +
                            "pickupday=($2),subscriptioncode=($3),requestedby=($4),refclient=($5),g7pickupzone=($6)," +
                            "fromplace=($7),typeofplace=($8),initialdueridetimestamp=($9),lastdueridetimestamp=($10)," +
                            "ridestatus=($11) WHERE ridenumber=($12)",
                            [travelid,
                            reqBody.pickupday, reqBody.subscriptioncode,
                            reqBody.refclient, reqBody.requestedby,
                            reqBody.g7pickupzone, reqBody.fromplace,
                            reqBody.typeofplace, reqBody.initialdueridetimestamp,
                            row.lastdueridetimestamp, row.ridestatus, reqBody.ridenumber]);
                    } else if (rowcount.count == 1) {
                        // this was the only traveler for an entry in travelchecking...delete
                        // ...and then update traveler record
                        client.query("DELETE FROM travelchecking WHERE travelid='"+row.travelid+"' and pickupday='" + reqBody.pickupday + "'");
                        var updateQuery = client.query("UPDATE travelers SET travelid=($1)," +
                            "pickupday=($2),subscriptioncode=($3),requestedby=($4),refclient=($5),g7pickupzone=($6)," +
                            "fromplace=($7),typeofplace=($8),initialdueridetimestamp=($9),lastdueridetimestamp=($10)," +
                            "ridestatus=($11) WHERE ridenumber=($12)",
                            [travelid,
                            reqBody.pickupday, reqBody.subscriptioncode,
                            reqBody.refclient, reqBody.requestedby,
                            reqBody.g7pickupzone, reqBody.fromplace,
                            reqBody.typeofplace, reqBody.initialdueridetimestamp,
                            row.lastdueridetimestamp, row.ridestatus, reqBody.ridenumber]);
                    }
               });
           }
           done();
           return res.json();
        });
    });
});

// POST - add a traveler record
apirouter.post('/v1/travelers/add', function(req, res, err1) {
    var reqBody = req.body;
    logger.info('/v1/travelers/add request ' + reqBody.ridenumber);
    // validate the travel ID parameter
    var travelid = reqBody.travelid;

    debugger;
    // No need to store short travelid's
    if (travelid.length < 3)
        return res.json();

    var strLen = travelid.length;
    travelid = travelid.replace(/\s/g, "");

    // No need to store travelid's with non-ASCII chars?
    for (var i = 0, strLen = travelid.length; i < strLen; ++i) {
        if (travelid.charCodeAt(i) > 127)
            return res.json();
    }
    pg.connect(config.connectionString, function(err, client, done) {
       if (err) {
           console.log(err);
       }
       client.query("INSERT INTO travelers VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)",
        [reqBody.ridenumber, travelid,
         reqBody.pickupday, reqBody.subscriptioncode,
         reqBody.refclient, reqBody.requestedby,
         reqBody.g7pickupzone, reqBody.fromplace,
         reqBody.typeofplace, reqBody.initialdueridetimestamp,
         0, 'CREATED',false]);

         done();
    });

    return res.json();
});



// DELETE traveler reference - triggered by cancellation of the
// order in the TaxiPak dispatching system
apirouter.post('/v1/travelers/delete', function(req, res, err1) {

    var reqBody = req.body;
    var timeNow = Math.floor(Date.now()/1000);
    logger.info('/v1/travelers/delete request ' + reqBody.ridenumber);
    pg.connect(config.connectionString, function(err, client, done) {
        if (err) {
            done();
            console.log(err);
            return res.status(500).json({ success: false, data: err});
        }
        var query = client.query("SELECT * FROM travelers WHERE ridenumber=" + reqBody.ridenumber);
        query.on('row', function(row) {
           //Found the order - see if we are currently checking the flight
           // and determine whether we need to continue
           pg.connect(config.connectionString, function(err, clientdelete, done) {
                var delquery = clientdelete.query("SELECT COUNT(*) FROM travelers WHERE travelid='"+row.travelid+
                              "' AND initialdueridetimestamp >" + timeNow);
                delquery.on('row', function(rowcount) {
                    debugger;
                    if (parseInt(rowcount.count) == 1) {
                        logger.info("Only one record for this travelID - delete from travelers and travelchecking");
                            // remove record from travelers table
                            debugger;
                            clientdelete.query("DELETE FROM travelers WHERE ridenumber="+reqBody.ridenumber);
                            logger.info("Deleted from travelers -" + reqBody.ridenumber);
                            clientdelete.query("DELETE FROM travelchecking WHERE travelid='" + row.travelid+"' AND extract(epoch from currentestimatetravelarrival AT TIME ZONE '" + config.tzDesc + "') > extract(epoch from now())");
                    } else {
                            clientdelete.query("DELETE FROM travelers WHERE ridenumber="+reqBody.ridenumber);
                            logger.info("Deleted from travelers -" + reqBody.ridenumber);
                    }
                });
                done();
           });

        });
        query.on('end', function() {
            done();
            return res.json();
        });
    });
    return res.json();
});


apirouter.get('/v1/travelers', function(req, res) {
  logger.info('/v1/travelers request');
  var results = [];
  pg.connect(config.connectionString, function(err, client, done) {
    if (err) {
      done();
      console.log(err);
      return res.status(500).json({ success: false, data: err});
    }

    var query = client.query("SELECT * FROM travelers ORDER BY initialdueridetimestamp");

     query.on('row', function(row) {

      results.push(row);
    });
    query.on('end', function() {
      done();
      return res.json(results);
    });
  });
});


apirouter.get('/v1/travelboard', function(req, res) {
  logger.info('/v1/travelboard request');
  var results = [];
  pg.connect(config.connectionString, function(err, client, done) {
    if (err) {
      logger.info('Error performing travelboard query - ' + err);
      done();
      console.log(err);
      return res.status(500).json({ success: false, data: err});
    }

    if (config.debug)
        var query = client.query("SELECT extract(epoch FROM tc.nexttravelcheckdate AT TIME ZONE '" + config.tzDesc + "') AS checktime," +
            "tc.checkiteration,tc.status,tc.travelid,tc.pickupday,tc.internationalname," +
            "tc.currentestimatetravelarrival,tc.initialtravelarrival," +
            "extract(epoch from tc.currentestimatetravelarrival AT TIME ZONE '" + config.tzDesc + "' ) AS arrtime," +
            "extract(epoch from tc.initialtravelarrival AT TIME ZONE '" + config.tzDesc + "' ) AS origarrtime," +
            "age(tc.currentestimatetravelarrival,tc.initialtravelarrival) AS delay," +
            "json_agg(travelers.*) AS travelers, travelers.g7pickupzone AS zone FROM travelchecking tc INNER JOIN travelers USING (travelid) " +
            "GROUP BY travelers.g7pickupzone,checktime,tc.checkiteration,tc.pickupday,tc.travelid,tc.status,tc.internationalname,tc.initialtravelarrival,tc.currentestimatetravelarrival,arrtime,delay order by origarrtime");
     else
     var query = client.query("SELECT extract(epoch FROM tc.nexttravelcheckdate AT TIME ZONE '" + config.tzDesc + "') AS checktime," +
         "tc.checkiteration,tc.status,tc.travelid,tc.pickupday,tc.internationalname," +
         "tc.currentestimatetravelarrival,tc.initialtravelarrival," +
         "extract(epoch from tc.currentestimatetravelarrival AT TIME ZONE '" + config.tzDesc + "' ) AS arrtime," +
         "extract(epoch from tc.initialtravelarrival AT TIME ZONE '" + config.tzDesc + "' ) AS origarrtime," +
         "age(tc.currentestimatetravelarrival,tc.initialtravelarrival) AS delay," +
         "json_agg(travelers.*) AS travelers, travelers.g7pickupzone AS zone " +
         "FROM travelchecking tc INNER JOIN travelers USING (travelid)  WHERE status != 'TRAVELID_ERROR' and status !='TERMINATED' and " +
         "(extract(epoch from tc.currentestimatetravelarrival at time zone '" + config.tzDesc + "') - extract(epoch FROM now() AT TIME ZONE '" + config.tzDesc + "')) > -30000 AND tc.pickupday='" + moment().format('DD-MM-YY') +"' " +
         "GROUP BY travelers.g7pickupzone,checktime,tc.checkiteration,tc.pickupday,tc.travelid,tc.status,tc.internationalname,tc.initialtravelarrival,tc.currentestimatetravelarrival,arrtime,delay order by origarrtime");

      logger.info("SELECT extract(epoch FROM tc.nexttravelcheckdate AT TIME ZONE '" + config.tzDesc + "') AS checktime," +
         "tc.checkiteration,tc.status,tc.travelid,tc.pickupday,tc.internationalname," +
         "tc.currentestimatetravelarrival,tc.initialtravelarrival," +
         "extract(epoch from tc.currentestimatetravelarrival AT TIME ZONE '" + config.tzDesc + "' ) AS arrtime," +
         "extract(epoch from tc.initialtravelarrival AT TIME ZONE '" + config.tzDesc + "' ) AS origarrtime," +
         "age(tc.currentestimatetravelarrival,tc.initialtravelarrival) AS delay," +
         "json_agg(travelers.*) AS travelers, travelers.g7pickupzone AS zone " +
         "FROM travelchecking tc INNER JOIN travelers USING (travelid)  WHERE status != 'TRAVELID_ERROR' and status !='TERMINATED' and " +
         "(extract(epoch from tc.currentestimatetravelarrival at time zone '" + config.tzDesc + "') - extract(epoch FROM now() AT TIME ZONE '" + config.tzDesc + "')) > -30000 AND tc.pickupday='" + moment().format('DD-MM-YY') +"' " +
         "GROUP BY travelers.g7pickupzone,checktime,tc.checkiteration,tc.pickupday,tc.travelid,tc.status,tc.internationalname,tc.initialtravelarrival,tc.currentestimatetravelarrival,arrtime,delay order by origarrtime");

     query.on('row', function(row) {

        if (row.delay.hours)
            row.delay = parseInt(row.delay.minutes) + parseInt(row.delay.hours)*60;
        else if (row.delay.minutes)
            row.delay = parseInt(row.delay.minutes);
        else {
            row.delay = 0;
        }
        row.nbrtravelers = row.travelers.length;
        var currentTime = Math.floor(Date.now() / 1000);

        row.color = 'green';

        if ((row.origarrtime - currentTime <= 30*60) && row.delay > 15)
            row.color = 'red';
        else if ((row.origarrtime - currentTime <= 60*60) && row.delay > 15)
            row.color = 'orange';
        //if (row.checkiteration == 1 && row.delay > 15)
        //    row.color = 'orange';
        //if (row.checkiteration == 2 && row.delay > 15)
        //    row.color = 'red';

        if (row.status != 'TRAVELID_ERROR' && row.status != 'TERMINATED' && row.delay > 15 && row.arrtime > (currentTime + 5*60)) {
            row.travelers = arrUnique(row.travelers);
            row.travelers = arrFuture(row.travelers, row);
            if (row.travelers.length > 0) {
                row.nbrtravelers = row.travelers.length;
                results.push(row);
            }
        }
    });
    query.on('end', function() {
	     logger.info(results);
       done();
      return res.json(results);
    });
  });
});

module.exports = apirouter;
