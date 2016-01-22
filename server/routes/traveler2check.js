var express = require('express');
var router = express.Router();
var pg = require('pg');
var path = require('path');
var connectionString = require(path.join(__dirname, '../', '../', 'config'));
var config = require(path.join(__dirname, '../', '../', 'config'));

var travel2check = {
  init: function() {
    console.log('Started travel2check...');
    setInterval(this.expirator.bind(this), 10000); //check flight status every minute
  },
  expirator: function() {
    console.log('Querying travelers to move to travelchecking table');
    //SELECT to_timestamp()
    var results = [];
    pg.connect(config.connectionString, function(err, client, done) {
      if (err) {
        done();
        console.log(err);
      }
      var query = client.query("SELECT DISTINCT travelid,tp.internationalcode, pickupday, initialdueridetimestamp " +
          "FROM travelers t, travelplaces tp WHERE NOT EXISTS(" +
          "SELECT 1 FROM travelchecking tc " +
          "WHERE t.travelid=tc.travelid) and t.g7pickupzone=tp.g7pickupzone");
      query.on('row', function(row) {
        results.push(row);
        //debugger;
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
              //client.query("INSERT INTO travelchecking VALUES (DEFAULT,'INITIAL'," +
              //  "($1),($2),($3),'A',to_timestamp(($4)),to_timestamp(($5)),NULL)",
              //  [f.travelid, f.pickupday,f.internationalcode,f.initialdueridetimestamp,f.initialdueridetimestamp]);
              debugger;
              client.query("INSERT INTO travelchecking VALUES (" +
                "DEFAULT,'INITIAL','" + f.travelid + "','" + f.pickupday + "'," +
                "'','" + f.internationalcode + "','A',to_timestamp(" + f.initialdueridetimestamp + ")," +
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
