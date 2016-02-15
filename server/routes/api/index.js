var express = require('express');
//var router = express.Router();
var apirouter = express();
var pg = require('pg');
var path = require('path');
var connectionString = require(path.join(__dirname,'../','../', '../', 'config'));
var config = require(path.join(__dirname,'../','../', '../', 'config'));
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


// POST - add a traveler record
apirouter.post('/v1/travelers/add', function(req, res, err1) {
    var reqBody = req.body;
    var data = {status: true};

    pg.connect(config.connectionString, function(err, client, done) {
       if (err) {
           console.log(err);
       } 
       client.query("INSERT INTO travelers VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
        [reqBody.ridenumber, reqBody.travelid,
         reqBody.pickupday, reqBody.subscriptioncode,
         reqBody.requestedby, reqBody.refclient,
         reqBody.g7pickupzone, reqBody.fromplace,
         reqBody.typeofplace, reqBody.initialdueridetimestamp,
         0, 'CREATED']);
    });
    
    pg.end();
    return res.json(data);
});



// DELETE traveler reference - triggered by cancellation of the
// order in the TaxiPak dispatching system
apirouter.post('/v1/travelers/delete', function(req, res, err1) {
    var data = {status: true};
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
    return res.json(data);
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

    var query = client.query("SELECT extract(epoch from tc.nexttravelcheckdate AT TIME ZONE '" + config.tzDesc + "') as checktime,tc.checkiteration,tc.status,tc.travelid,tc.pickupday,tc.internationalname," +
      "tc.currentestimatetravelarrival,tc.initialtravelarrival,extract(epoch from tc.currentestimatetravelarrival AT TIME ZONE '" + config.tzDesc + "' ) as arrtime," +
      "extract(epoch from tc.initialtravelarrival AT TIME ZONE '" + config.tzDesc + "' ) as origarrtime," +
      "age(tc.currentestimatetravelarrival,tc.initialtravelarrival) as delay," +
      "json_agg(travelers.*) as travelers, travelers.g7pickupzone as zone from travelchecking tc inner join travelers using (travelid) " +
      "group by travelers.g7pickupzone,checktime,tc.checkiteration,tc.pickupday,tc.travelid,tc.status,tc.internationalname,tc.currentestimatetravelarrival,tc.initialtravelarrival,arrtime,delay order by arrtime");
 
     query.on('row', function(row) {


      //row.status = 'ON TIME';
      if (row.delay.minutes)
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
