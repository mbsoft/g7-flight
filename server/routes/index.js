var express = require('express');
var router = express();
var pg = require('pg');
var path = require('path');
var env = process.env.G7TRAVEL_ENV;
var connectionString = require(path.join(__dirname,  '../','../server/', 'config/'+env+'.js'));
var config = require(path.join(__dirname, '../','../server/', 'config/'+env+'.js'));
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
router.get('/travelboard', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../', '../', 'client', 'views', 'travelboard.html'));
});

router.get('/archives', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../', '../', 'client', 'views', 'index3.html'));
});

router.get('/viewTravelBoard', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../', '../', 'client', 'views', 'index.html'));
});
router.get('/expandRow',function(req, res, next){
  res.sendFile(path.join(__dirname, '../', '../', 'client', 'views', 'expandableRowTemplate.html'));
});
router.get('/headerRow',function(req, res, next){
  res.sendFile(path.join(__dirname, '../', '../', 'client', 'views', 'header-template.html'));
});

/* GET table showing all traveler records - just for debug/testing */
router.get('/viewTravelers', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../', '../', 'client', 'views', 'index1.html'));
});
router.get('/expandRow',function(req, res, next){
  res.sendFile(path.join(__dirname, '../', '../', 'client', 'views', 'expandableRowTemplate.html'));
});
router.get('/headerRow',function(req, res, next){
  res.sendFile(path.join(__dirname, '../', '../', 'client', 'views', 'header-template.html'));
});

module.exports = router;
