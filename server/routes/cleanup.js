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
     pg.connect(config.connectionString, function(err, client, done) {
      if (err) {
        done();
        console.log(err);
      }
      var timeNow = Math.floor(Date.now()/1000);

      console.log("UPDATE travelers set processed=true where initialdueridetimestamp < (" + timeNow + "-86400)");
      client.query("UPDATE travelers set processed=true where initialdueridetimestamp < (" + timeNow + "-86400)");
      //client.query("DELETE FROM travelers where initialdueridetimestamp < (" + timeNow + "-86400)")
      done();
     });
    setInterval(this.expirator.bind(this), 3600 * 1000); //hourly table cleanup
  },

  expirator: function() {
     console.log('Running daily cleanup...');

     pg.connect(config.connectionString, function(err, client, done) {
      if (err) {
        done();
        console.log(err);
      }
      var timeNow = Math.floor(Date.now()/1000);
      console.log("UPDATE travelers set processed=true where initialdueridetimestamp < (" + timeNow + "-86400)");
      //client.query("DELETE FROM travelers where initialdueridetimestamp < (" + timeNow + "-86400)")
      client.query("UPDATE travelers set processed=true where initialdueridetimestamp < (" + timeNow + "-86400)");
      done();
     });
  }
}

module.exports = cleanup;
