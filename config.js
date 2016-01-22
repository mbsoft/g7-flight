
var Config = {
  connectionString : 'postgres://localhost/nouvel_ui',
  flightstatsPath :'/flex/flightstatus/rest/v2/json/flight/status/',
  airportstatsPath: '/flex/flightstatus/rest/v2/json/airport/status/',
  // Flight Stats API production key API values provided by Ludovic
  // from Taxis G7
  //flightstatsAppID :'9e542dda',
  //flightstatsAppKey :'d91bc4b068a0ff9fc585b8cefca108a8',
  // Developer keys
  flightstatsAppID: '4be16a5f',
  flightstatsAppKey : '9d22bfb7f120c06a2451fa16bd388552',
  firstCheckTime: 48400,
  tzOffset: 6
}

module.exports = Config;
