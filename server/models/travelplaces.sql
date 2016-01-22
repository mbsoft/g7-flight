var pg = require('pg')
var path = require('path');
var connectionString = require(path.join(__dirname, '../', '../', 'config'));

var client = new pg.Client(connectionString);

client.connect();

var query = client.query('CREATE TABLE travelplaces ( id serial PRIMARY KEY,g7pickupzone varchar(30),fromplace char,internationalname varchar(30),internationalcode varchar(10),typeofplace char)');

query.on('end', function() { client.end(); });
