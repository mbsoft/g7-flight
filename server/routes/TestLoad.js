var express = require('express');
var router = express.Router();
var pg = require('pg');
var path = require('path');
var WS3Request = require('../../server/classes/WS3Request');
var Class = require('../../server/classes/Class');
var connectionString = require(path.join(__dirname, '../', '../', 'config'));
var config = require(path.join(__dirname, '../', '../', 'config'));
var https = require('https');
var util = require('util');
var jsonQuery = require('json-query');
var airports = require('../../server/classes/airport');

var options = {
  host: 'api.flightstats.com',
  method: 'GET'
}

var TestLoad = WS3Request.extend({

  type: 'TESTLOAD',

  init: function(){
    console.log('Hello init');
    var coder = jsonQuery('codes[Code=CMH].Name', {
      data: Airports
    });
    console.log(coder);
    return this._super();
  },

  route: function(req, res) {
    var data = {status: true};
    console.log('Hello route.');
    var results = [];
    options.path = config.airportstatsPath + req.params.airport
    + '/arr/' + req.params.year + '/' + req.params.month + '/' +
    req.params.day + '/' + req.params.hour
    +'?appId=' + config.flightstatsAppID + '&appKey=' + config.flightstatsAppKey + '&utc=false&numHours=6&maxFlights=12';

    console.log(options.path);
    var req = https.request(options, function(res,options) {
      var body = '';
      res.on('data', function(data){
        body += data;
      });

      res.on('end', function(){
        var fd = JSON.parse(body);
        console.log(fd.flightStatuses);
        res.send(data);
      });

    });

  }

});

module.exports = TestLoad;
