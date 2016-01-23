var express = require('express');
//var router = express.Router();
var router = express();
var pg = require('pg');
var path = require('path');
var connectionString = require(path.join(__dirname, '../', '../', 'config'));
var config = require(path.join(__dirname, '../', '../', 'config'));
var https = require('https');
var util = require('util');
var jsonQuery = require('json-query');
var airports = require('../../server/classes/airport');
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

/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../', '../', 'client', 'views', 'index.html'));
});
router.get('/expandRow',function(req, res, next){
  res.sendFile(path.join(__dirname, '../', '../', 'client', 'views', 'expandableRowTemplate.html'));
});
router.get('/headerRow',function(req, res, next){
  res.sendFile(path.join(__dirname, '../', '../', 'client', 'views', 'header-template.html'));
});



// DELETE traveler reference - triggered by cancellation of the
// order in the TaxiPak dispatching system
router.delete('/api/v1/travelers/:orderid', function(req, res, err1) {
    var data = {status: true};
      
    var client = new pg.Client(config.connectionString);
    client.connect();

    var query = client.query("SELECT * FROM travelers WHERE ridenumber=" + req.params.orderid);
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
                    clientdelete.query("DELETE FROM travelers where ridenumber="+req.params.orderid);
                    console.log("Deleted from travelers -" + req.params.orderid);
               } else if (rowcount.count == 1) {
                    // if only 1 result, no need to continue monitoring
                    clientdelete.query("DELETE FROM travelchecking where travelid='"+row.travelid+"'");
                    console.log("Deleted from travelchecking -" + row.travelid);
                    clientdelete.query("DELETE FROM travelers where ridenumber="+req.params.orderid);
                    console.log("Deleted from travelers -" + req.params.orderid);
               }
           });
              
    });
    pg.end();
    return res.json(data);
});



router.get('/api/v1/travelers', function(req, res) {
  var results = [];
  pg.connect(config.connectionString, function(err, client, done) {
    if (err) {
      done();
      console.log(err);
      return res.status(500).json({ success: false, data: err});
    }

    var query = client.query("SELECT tc.travelid,tc.pickupday,tc.internationalname," +
      "tc.currentestimatetravelarrival,tc.initialtravelarrival,to_char(tc.currentestimatetravelarrival,'HH24HMI DD/MM') as arrtime," +
      "age(tc.currentestimatetravelarrival,tc.initialtravelarrival) as delay," +
      "json_agg(travelers.*) as travelers, travelers.g7pickupzone as zone from travelchecking tc inner join travelers using (travelid) " +
      "group by travelers.g7pickupzone,tc.pickupday,tc.travelid,tc.internationalname,tc.currentestimatetravelarrival,tc.initialtravelarrival,arrtime,delay order by arrtime");
 
     query.on('row', function(row) {

      row.status = 'ON TIME';
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

// Testing endpoints to create and clear data from tables
router.get('/api/v1/testclear', function(req, res, err1) {
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
router.get('/api/v1/testharness/:year/:month/:dayy/:hour/:airport', function(req, res, err1) {
    // Test harness will query flight stats API to get a collection
    // of 'n' flights and add a traveler record for each one
    var results = [];
    var data = {status: true};
    var day = req.params.dayy;var month=req.params.month;var year=req.params.year.substring(2,4);var hour=req.params.hour;

    options.path = config.airportstatsPath + req.params.airport
    + '/arr/' + req.params.year + '/' + month + '/' + day + '/'
    + hour +'?appId=' + config.flightstatsAppID + '&appKey=' + config.flightstatsAppKey + '&utc=false';
    
    var req = https.request(options, function(rest,options) {
      var body = '';

      rest.on('data', function(data){
            body += data;
      });
      rest.on('end', function(){
   
          var fd = JSON.parse(body);

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
                var date = new Date(f.operationalTimes.publishedArrival.dateLocal);
              else
                var date = new Date(f.operationalTimes.estimatedGateArrival.dateLocal);
              if (f.carrierFsCode != 'A5') {
                var zone = (f.arrivalAirportFsCode == 'CDG'?'TERMINAL ROISSY 3':'TERMINAL ORLY OUEST');
                  client.query("INSERT INTO travelers VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
                  [cl_nbr,f.carrierFsCode+f.flightNumber,day+'-'+month+'-'+year,acct_nbr,customer,customer,
                  zone,from_airport,'A',date.getTime()/1000,date.getTime()/1000,
                  'CREATED']);
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

module.exports = router;
