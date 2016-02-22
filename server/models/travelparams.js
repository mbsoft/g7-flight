var pg = require('pg')
var path = require('path');
var connectionString = require(path.join(__dirname, '../', '../', 'config'));

var client = new pg.Client(connectionString);

client.connect();

var query = client.query('CREATE TABLE travelparams (initialCheckFlight int,limitCheckFlight int,timeToCheck int,estimateDelayFlight int,apiTravelTimeoutFlight int');

query.on('end', function() { client.end(); });
