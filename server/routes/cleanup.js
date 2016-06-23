var express = require('express');
var router = express.Router();
var pg = require('pg');
var path = require('path');
var env = process.env.G7TRAVEL_ENV;
var connectionString = require(path.join(__dirname,  '../', 'config/'+env+'.js'));
var config = require(path.join(__dirname, '../', 'config/'+env+'.js'));
var logger = require(path.join(__dirname, '../', 'classes','logging')).logger;

var cleanup = {
  init: function() {
    console.log('Started cleanup...');
    setInterval(this.expirator.bind(this), 3600 * 1000); //daily table cleanup
  },
  
  expirator: function() {
     console.log('Running daily cleanup...');
     pg.connect(config.connectionString, function(err, client, done) {
      if (err) {
        done();
        console.log(err);
      }
      var timeNow = Math.floor(Date.now()/1000);
      //console.log("DELETE FROM travelers where initialdueridetimestamp < (" + timeNow + "-86400)");
      client.query("DELETE FROM travelers where initialdueridetimestamp < (" + timeNow + "-86400)")
      done();
     });
  }
}

module.exports = cleanup;