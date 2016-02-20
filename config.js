
var Config = {
  //connectionString : 'postgres://homestead:secret@localhost/nouvel_ui',
  connectionString : 'postgres://localhost/nouvel_ui',
  //connectionString : 'postgres://jwelch:JWELCH@psql-dev1/db_checkt',
  flightstatsPath :'/flex/flightstatus/rest/v2/json/flight/status/',
  airportstatsPath: '/flex/flightstatus/rest/v2/json/airport/status/',
  // Flight Stats API production key API values provided by Ludovic
  // from Taxis G7
  //flightstatsAppID :'9e542dda',
  //flightstatsAppKey :'d91bc4b068a0ff9fc585b8cefca108a8',
  // Developer keys
  flightstatsAppID: '9e542dda',
  flightstatsAppKey : '52b0919821212f0df01a112f842e99df',
  firstCheckTime: 848400,
  tzDesc: 'CET',

  //Logging
  logDirectory: './logs',
  logLevel: 'debug',
  
  // Listen port
  port: '3000',
  
  //Development
  debug: true
}

module.exports = Config;

