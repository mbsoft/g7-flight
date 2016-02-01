var express = require('express');

var testrouter = express();
var pg = require('pg');
var path = require('path');
var connectionString = require(path.join(__dirname, '../', '../', '../', 'config'));
var config = require(path.join(__dirname, '../', '../', '../', 'config'));
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


// Testing endpoints to create and clear data from tables
testrouter.get('/clear', function(req, res, err1) {
  debugger;
  var data = {status: true};
  pg.connect(config.connectionString, function(err, client, done) {
    if (err) {
      done();
    }
    client.query("DELETE FROM travelers");
    client.query("DELETE FROM travelchecking");
    done();
    return res.json(data);
  });
});

// Create some test data and populate tables
testrouter.get('/harness/:year/:month/:dayy/:hour/:airport', function(req, res, err1) {
    // Test harness will query flight stats API to get a collection
    // of 'n' flights and add a traveler record for each one
    
    var results = [];
    var data = {status: true};
    var day = req.params.dayy;var month=req.params.month;var year=req.params.year.substring(2,4);var hour=req.params.hour;

    options.path = config.airportstatsPath + req.params.airport
    + '/arr/' + req.params.year + '/' + month + '/' + day + '/'
    + hour +'?appId=' + config.flightstatsAppID + '&appKey=' + config.flightstatsAppKey + '&utc=false&maxFlights=5&codeType=IATA';
    
    var req = https.request(options, function(rest,options) {
      var body = '';

      rest.on('data', function(data){
            body += data;
      });
      rest.on('end', function(){
   
          var fd = JSON.parse(body);
          var count = 0;
          
          if (fd.error) {
            data = {status: false,
                    error: JSON.stringify(fd.error)
                    }
          }
          

          console.log(fd.flightStatuses);
          var fs = fd.flightStatuses;
          pg.connect(config.connectionString, function(err, client, done) {

            if (err) {
              done();
              console.log(err);
            }
            fs.forEach(function(f){
              if (++count < 6) {
                
              
              
              var cl_nbr = Math.floor(Math.random() * 3500000 + 100000);
              var acct_nbr = Math.floor(Math.random() * 3000 + 1500);
              var from_airport = f.departureAirportFsCode;

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

              var customer = "MR " + randomstring.generate({
                length: 12,
                charset: 'alphabetic'
              });
              customer = customer.toUpperCase();


              if (f.operationalTimes.publishedArrival != null)
                var date = new Date(f.operationalTimes.publishedArrival.dateUtc);
              else if (f.operationalTimes.estimateGateArrival != null)
                var date = new Date(f.operationalTimes.estimatedGateArrival.dateUtc);
              else if (f.operationalTimes.flightPlanPlannedArrival)
                var date = new Date(f.operationalTimes.flightPlanPlannedArrival.dateUtc);
              if (f.carrierFsCode != 'A5') {
                var zone = (f.arrivalAirportFsCode == 'CDG'?'TERMINAL ROISSY 3':'TERMINAL ORLY OUEST');
                  client.query("INSERT INTO travelers VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
                  [cl_nbr,f.carrierFsCode+f.flightNumber,day+'-'+month+'-'+year,acct_nbr,customer,customer,
                  zone,from_airport,'A',date.getTime()/1000,date.getTime()/1000,
                  'CREATED']);
              }
              }
              });
              done();

              return res.json(data);
            });
      });

      res.on('error', function(e){

        console.log(e.message);
      });

  });

  req.end();
  req.on('error', function(err){
    //console.log("Error: ", err);
  });
  req.on('end', function(){

  });
});

module.exports = testrouter;
