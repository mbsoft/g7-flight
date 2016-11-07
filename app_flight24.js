var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require(path.join(__dirname, 'server', 'classes','logging')).logger;
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var https = require('https');
var pg = require('pg');
var moment = require('moment');
var app = express();
var env = process.env.G7TRAVEL_ENV;
var config = require(path.join(__dirname, './','server', 'config/'+env+'.js'));
//var connectionString = require(path.join(__dirname,  '../','../', 'config/'+env+'.js'));

//console.log("Starting Flight24 monitoring");

//var flight_data = require('./flight_data.json');
var data = {};
var flight_data = {};
debugger;

var g7Flights = {
  init: function() {
    console.log('Started g7 flight checker...');
    this.expirator();
    setInterval(this.expirator.bind(this), 60000);
  },

  expirator: function() {
    console.log('Checking active G7 flights.');
    var results = [];

    pg.connect(config.connectionString, function(err, client, done) {
      if (err) {
        console.log('Error connecting to psql ' + err);
      }
      var query = client.query("SELECT extract(epoch FROM tc.nexttravelcheckdate AT TIME ZONE '" + config.tzDesc + "') AS checktime," +
          "tc.checkiteration,tc.status,tc.travelid,tc.pickupday,tc.internationalname," +
          "tc.currentestimatetravelarrival,tc.initialtravelarrival," +
          "extract(epoch from tc.currentestimatetravelarrival AT TIME ZONE '" + config.tzDesc + "' ) AS arrtime," +
          "extract(epoch from tc.initialtravelarrival AT TIME ZONE '" + config.tzDesc + "' ) AS origarrtime," +
          "age(tc.currentestimatetravelarrival,tc.initialtravelarrival) AS delay," +
          "json_agg(travelers.*) AS travelers, travelers.g7pickupzone AS zone " +
          "FROM travelchecking tc INNER JOIN travelers USING (travelid)  WHERE status != 'TRAVELID_ERROR' and status !='TERMINATED' and " +
          "(extract(epoch from tc.currentestimatetravelarrival at time zone '" + config.tzDesc + "') - extract(epoch FROM now() AT TIME ZONE '" + config.tzDesc + "')) > -86400" +
          "GROUP BY travelers.g7pickupzone,checktime,tc.checkiteration,tc.pickupday,tc.travelid,tc.status,tc.internationalname,tc.initialtravelarrival,tc.currentestimatetravelarrival,arrtime,delay order by origarrtime");
      query.on('row', function(row) {
        results.push(row);
      });
      query.on('end', function() {
        console.log('Done performing travel query');
        done();
        for (var i=0; i < results.length; i++) {
          //console.log(results[i].travelid.toUpperCase());
          for (var fID in flight_data) {

            if (flight_data[fID][13] == results[i].travelid.toUpperCase()) {
              console.log('Found match ' + results[i].travelid.toUpperCase() + ' ' + fID);
              // Query flight 24 with fID
              g7Flights.flightRadar24OneFlightQuery(results[i], fID);
            }
          }
        }
      });
    });


  },

  flightRadar24OneFlightQuery: function(theRow, fID) {
    var theFlight = '';
    var logit = false;
    https.get({
      host: 'data-live.flightradar24.com',
      port: 443,
      path: '/planedata?f=' + fID,
      method: 'GET'
    }, function(res) {
      if (res.statusCode == 402)
        logit = true;
      res.on('data', function(chunk) {
        theFlight += chunk;
      });
      res.on('end', function(e) {
        if (logit == true) {
          //console.log(theFlight);
          logit = false;
          return;
        }
        theFlight = JSON.parse(theFlight);
        console.log(theRow.checkiteration + ' ' + theRow.travelid.toUpperCase() + ' ' + theFlight.from_iata + ' ' + theFlight.to_iata + ' ' + moment.unix(theRow.origarrtime).format("HH:mm:ss") + ' '  + moment.unix(theRow.arrtime).format("HH:mm:ss") + ' ' +  moment.unix(theFlight.eta).format("HH:mm:ss") );
        theFlight = '';
      })
    });
  }
};


var flightcheck = {
  init: function() {
    console.log('Started flight check...');
    this.retrieve();
    setInterval(this.expirator.bind(this), 150000); //check for flights to check every 15 seconds - NOT checking the API every 15 seconds
  },

  expirator: function() {
    debugger;
    console.log('Updating flight data from flightradar24');
    this.retrieve();
  },

  retrieve: function() {
    data = '';
    https.get({
      host: 'data-live.flightradar24.com',
      port: 443,
      path: '/zones/fcgi/feed.js?bounds=54.56,41.90,-18.13,17.82&faa=1&mlat=1&flarm=1&adsb=1&gnd=1&air=1&vehicles=1&estimated=1&maxage=7200&gliders=1&stats=1',
      method: 'GET'
    }, function(res) {
      res.on('data', function(chunk) {
        data += chunk;
      });
      res.on('end', function(e) {
        flight_data = JSON.parse(data);
      })
    });
  }
};

g7Flights.init();
flightcheck.init();




//fs.readFile('./flight_data.json', 'utf8', function(err,data){
//    this.data = JSON.parse(data);
//    for (var fID in this.data) {
//      debugger;
//      console.log(fID);
//      console.log(this.data[fID][16]);
//    }
//});
