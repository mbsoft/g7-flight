var pg = require('pg')
var path = require('path');
var connectionString = require(path.join(__dirname, '../', '../', 'config'));
var config = require(path.join(__dirname, '../', '../', 'config'));

var client = new pg.Client(config.connectionString);

client.connect();

var query = client.query('CREATE TABLE travelchecking ( id serial PRIMARY KEY,status varchar(25),travelid varchar(10),pickupday varchar(10),internationalname varchar(30),internationalcode varchar(10),typeofplace char,initialtravelarrival timestamp,currentestimatetravelarrival timestamp,nexttravelcheckdate timestamp,checkiteration bigint)');

query.on('end', function() { client.end(); });
