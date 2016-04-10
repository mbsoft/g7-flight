var express = require('express');
var router = express.Router();
var pg = require('pg');
var path = require('path');
var env = process.env.G7TRAVEL_ENV;
var connectionString = require(path.join(__dirname,  '../', 'config/'+env+'.js'));
var config = require(path.join(__dirname, '../', 'config/'+env+'.js'));
var logger = require(path.join(__dirname, '../', 'classes','logging')).logger;

var travel2check = {
  init: function() {
    console.log('Started travel2check...');
    setInterval(this.expirator.bind(this), 10000); //check flight status every minute
  },
  expirator: function() {
    console.log('Querying travelers to move to travelchecking table');
    logger.info('Queryingtravelers to move to travelchecking table');
    var results = [];
    pg.connect(config.connectionString, function(err, client, done) {
      if (err) {
        done();
        console.log(err);
      }
      // Get rows in the travelers table that aren't represented in the travelchecking table
      var query = client.query("SELECT DISTINCT travelid,t.fromplace,tp.internationalcode, pickupday, initialdueridetimestamp " +
          "FROM travelers t, travelplaces tp WHERE NOT EXISTS(" +
          "SELECT 1 FROM travelchecking tc " +
          "WHERE t.travelid=tc.travelid) and t.g7pickupzone=tp.g7pickupzone");
      query.on('row', function(row) {
        results.push(row);
      });
      query.on('end', function() {
        done();
        if (results) {
          // Check whether it is time to insert the row for travelchecking
          var timeNow = Math.floor(Date.now()/1000);
          results.forEach(function(f){

            // transfer orders that are coming due in the next hour
            if (f.initialdueridetimestamp - (60+5)*60 <= timeNow) {
                console.log(f.travelid + ' ' + f.initialdueridetimestamp + ' ' + f.internationalcode);
                pg.connect(config.connectionString, function(err, client, done) {
                if (err) {
                    done();
                    console.log(err);
                }
              
                client.query("INSERT INTO travelchecking VALUES (" +
                    "DEFAULT,'UNCHECKED','" + f.travelid + "','" + f.pickupday + "','" +
                    f.fromplace.toUpperCase() + "','" + f.internationalcode + "','A',to_timestamp(" + f.initialdueridetimestamp + ")::timestamp WITH TIME ZONE AT TIME ZONE '" + config.tzDesc + "'," +
                    "to_timestamp(" + f.initialdueridetimestamp + ")::timestamp WITH TIME ZONE AT TIME ZONE '" + config.tzDesc + "',NULL,0)");
                done();
                });
            }
          });
        } else {
          console.log("No rows to add");
        }
      });
    });
  }
}

module.exports = travel2check;
