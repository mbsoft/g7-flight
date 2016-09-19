var pg = require('pg');

var Config = {
  connectionString : 'postgres://localhost/nouvel_ui',
  //connectionString : 'postgres://jwelch:JWELCH@psql-dev1/db_checkt',
  flightstatsPath :'/flex/flightstatus/rest/v2/json/flight/status/',
  airportstatsPath: '/flex/flightstatus/rest/v2/json/airport/status/',
  trainPath: '/v1/coverage/sncf/vehicle_journeys',
  trainUserKey: '66ecc2fe-1fe6-43ae-ad6d-f30b3ea4f79a',
  // Flight Stats API production key API values provided by Ludovic
  // from Taxis G7
  //flightstatsAppID :'9e542dda',
  //flightstatsAppKey :'d91bc4b068a0ff9fc585b8cefca108a8',
  // Developer keys
  flightstatsAppID: '9e542dda',
  flightstatsAppKey : '52b0919821212f0df01a112f842e99df',
  tzDesc: 'CEST',

  //Logging
  logDirectory: './logs',
  logLevel: 'debug',

  // Listen port
  port: '3000',

  //Development
  debug: false,

  // DB Params
  firstCheck: 0,
  secondCheck: 0,
  timeToCheck: 0,
  estimateDelay: 0,
  apiTimeout: 0,
  limitCheck: 0,
  firstCheckTrain: 0,
  secondCheckTrain: 0,
  estimateDelayTrain: 0,
  apiTimeoutTrain: 0,

  init: function() {
    console.log('DB init of params');
    pg.connect(Config.connectionString, function(err, client, done) {
        if (err) {
            done();
            console.log(err);
        }
        var query = client.query("SELECT DISTINCT * FROM travelparams");

        query.on('row', function(row) {
            Config.firstCheck = row.initialcheckflight;
            Config.secondCheck = row.limitcheckflight;
            Config.timeToCheck = row.timetocheck;
            Config.estimateDelay = row.estimatedelayflight;
            Config.apiTimeout = row.apitraveltimeoutflight;
            Config.limitCheck = row.limitcheckflight;
            Config.firstCheckTrain = row.initialchecktrain;
            Config.secondCheckTrain = row.limitchecktrain;
            Config.estimateDelayTrain = row.estimatedelaytrain;
            Config.apiTimeoutTrain = row.apitraveltimeouttrain;
        });
        query.on('end', function() {
        done();
        return;
        });
    });
  }
}


module.exports = Config;
