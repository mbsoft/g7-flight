var express = require('express');
var router = express.Router();
var pg = require('pg');
var path = require('path');
var connectionString = require(path.join(__dirname, '../', '../', 'config'));
var config = require(path.join(__dirname, '../', '../', 'config'));
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
          results.forEach(function(f){
            console.log(f.travelid + ' ' + f.initialdueridetimestamp + ' ' + f.internationalcode);
            pg.connect(config.connectionString, function(err, client, done) {
              if (err) {
                  done();
                  console.log(err);
              }

              //debugger;
              client.query("INSERT INTO travelchecking VALUES (" +
                "DEFAULT,'INITIAL','" + f.travelid + "','" + f.pickupday + "','" +
                f.fromplace.toUpperCase() + "','" + f.internationalcode + "','A',to_timestamp(" + f.initialdueridetimestamp + ")," +
                "to_timestamp(" + f.initialdueridetimestamp + "),NULL)");
              done();
            });
          });
        } else {
          console.log("No rows to add");
        }
      });
    });
  }
}

module.exports = travel2check;
