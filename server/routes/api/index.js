var express = require('express');
//var router = express.Router();
var apirouter = express();
var pg = require('pg');
var path = require('path');
var env = process.env.G7TRAVEL_ENV;
var connectionString = require(path.join(__dirname,  '../','../', 'config/'+env+'.js'));
var config = require(path.join(__dirname, '../','..', 'config/'+env+'.js'));
var https = require('https');
var util = require('util');
var jsonQuery = require('json-query');
var airports = require('../../../server/classes/airport');
var randomstring = require('randomstring');

var options = {
  host: 'api.flightstats.com',
  method: 'GET'
}

var G7Router = function(routeType) {
    return function(req, res) {
        (new routeType()).route(req, res);
    };
};


// POST - update a traveler record
apirouter.post('/v1/travelers/update', function(req, res, err1) {
    
    var reqBody = req.body;
    
    pg.connect(config.connectionString, function(err, client, done) {
        if (err) {
            console.log(err);
        } 
        var query = client.query("SELECT * FROM travelers WHERE ridenumber=" + reqBody.ridenumber);
        query.on('row', function(row) {
           // record exists...update it
           if (row.travelid == reqBody.travelid) {
               // no change in travelid so just udpate traveler record
               var updateQuery = client.query("UPDATE travelers SET travelid=($1)," +
                "pickupday=($2),subscriptioncode=($3),requestedby=($4),refclient=($5),g7pickupzone=($6)," +
                "fromplace=($7),typeofplace=($8),initialdueridetimestamp=($9),lastdueridetimestamp=($10)," +
                "ridestatus=($11) WHERE ridenumber=($12)",
                [reqBody.travelid,
                 reqBody.pickupday, reqBody.subscriptioncode,
                 reqBody.refclient, reqBody.requestedby,
                 reqBody.g7pickupzone, reqBody.fromplace,
                 reqBody.typeofplace, reqBody.initialdueridetimestamp,
                 row.lastdueridetimestamp, row.ridestatus, reqBody.ridenumber]);
           } else {
               // changed flights so need to see if there's any need to 
               // continue doing travel checking on the saved flight
               var rowquery = client.query("SELECT COUNT(*) FROM travelchecking WHERE travelid='"+row.travelid+"'");
               rowquery.on('row', function(rowcount) {
                   if (rowcount.count == 0) {
                       // not currently travel checking this flight - no change to travelchecking required
                       // just update traveler record with new content
                      var updateQuery = client.query("UPDATE travelers SET travelid=($1)," +
                            "pickupday=($2),subscriptioncode=($3),requestedby=($4),refclient=($5),g7pickupzone=($6)," +
                            "fromplace=($7),typeofplace=($8),initialdueridetimestamp=($9),lastdueridetimestamp=($10)," +
                            "ridestatus=($11) WHERE ridenumber=($12)",
                            [reqBody.travelid,
                            reqBody.pickupday, reqBody.subscriptioncode,
                            reqBody.refclient, reqBody.requestedby,
                            reqBody.g7pickupzone, reqBody.fromplace,
                            reqBody.typeofplace, reqBody.initialdueridetimestamp,
                            row.lastdueridetimestamp, row.ridestatus, reqBody.ridenumber]);
                    } else if (rowcount.count == 1) {
                        // this was the only traveler for an entry in travelchecking...delete
                        // ...and then update traveler record
                        client.query("DELETE FROM travelchecking WHERE travelid='"+row.travelid+"'");
                        var updateQuery = client.query("UPDATE travelers SET travelid=($1)," +
                            "pickupday=($2),subscriptioncode=($3),requestedby=($4),refclient=($5),g7pickupzone=($6)," +
                            "fromplace=($7),typeofplace=($8),initialdueridetimestamp=($9),lastdueridetimestamp=($10)," +
                            "ridestatus=($11) WHERE ridenumber=($12)",
                            [reqBody.travelid,
                            reqBody.pickupday, reqBody.subscriptioncode,
                            reqBody.refclient, reqBody.requestedby,
                            reqBody.g7pickupzone, reqBody.fromplace,
                            reqBody.typeofplace, reqBody.initialdueridetimestamp,
                            row.lastdueridetimestamp, row.ridestatus, reqBody.ridenumber]);
                    }
               });
           }
           pg.end();
           return res.json();   
        });
    });  
});

// POST - add a traveler record
apirouter.post('/v1/travelers/add', function(req, res, err1) {
    var reqBody = req.body;

    pg.connect(config.connectionString, function(err, client, done) {
       if (err) {
           console.log(err);
       } 
       client.query("INSERT INTO travelers VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
        [reqBody.ridenumber, reqBody.travelid,
         reqBody.pickupday, reqBody.subscriptioncode,
         reqBody.refclient, reqBody.requestedby,
         reqBody.g7pickupzone, reqBody.fromplace,
         reqBody.typeofplace, reqBody.initialdueridetimestamp,
         0, 'CREATED']);
    });
    
    pg.end();
    return res.json();
});



// DELETE traveler reference - triggered by cancellation of the
// order in the TaxiPak dispatching system
apirouter.post('/v1/travelers/delete', function(req, res, err1) {
    var reqBody = req.body;
    
    var client = new pg.Client(config.connectionString);
    client.connect();

    var query = client.query("SELECT * FROM travelers WHERE ridenumber=" + reqBody.ridenumber);
    query.on('row', function(row) {
           //Found the order - see if we are currently checking the flight
           // and determine whether we need to continue
           var clientdelete = new pg.Client(config.connectionString);
           clientdelete.connect();
           var delquery = clientdelete.query("SELECT COUNT(*) FROM travelchecking WHERE travelid='"+row.travelid+"'");
           delquery.on('row', function(rowcount) {
               if (rowcount.count == 0) {
                   console.log("Not found in travelchecking");
                    // remove record from travelers table
                    clientdelete.query("DELETE FROM travelers WHERE ridenumber="+reqBody.ridenumber);
                    console.log("Deleted from travelers -" + reqBody.ridenumber);
               } else if (rowcount.count == 1) {
                    // if only 1 result, no need to continue monitoring
                    clientdelete.query("DELETE FROM travelchecking WHERE travelid='"+row.travelid+"'");
                    console.log("Deleted from travelchecking -" + row.travelid);
                    clientdelete.query("DELETE FROM travelers WHERE ridenumber="+reqBody.ridenumber);
                    console.log("Deleted from travelers -" + reqBody.ridenumber);
               }
           });
              
    });
    pg.end();
    return res.json();
});


apirouter.get('/v1/travelers', function(req, res) {
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
  var results = [];
  pg.connect(config.connectionString, function(err, client, done) {
    if (err) {
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
            "json_agg(travelers.*) AS travelers, travelers.g7pickupzone AS zone FROM travelchecking tc INNER JOIN travelers USING (travelid) " +
            "WHERE tc.status != 'ARRIVED' AND tc.status != 'TERMINATED' AND tc.status != 'TRAVELID_ERROR' " +
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
        results.push(row);
    });
    query.on('end', function() {
      done();
      return res.json(results);
    });
  });
});

module.exports = apirouter;
