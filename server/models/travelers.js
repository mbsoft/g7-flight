var pg = require('pg')
var path = require('path');
var connectionString = require(path.join(__dirname, '../', '../', 'config'));
var config = require(path.join(__dirname, '../', '../', 'config'));

var client = new pg.Client(config.connectionString);

client.connect();

var query = client.query('CREATE TABLE travelers (ridenumber integer PRIMARY KEY NOT NULL, travelid varchar(10) NOT NULL, pickupday character varying(9) NOT NULL, subscriptioncode character varying(18), requestedby character varying(20), refclient character varying(20), g7pickupzone character varying(20), fromplace character varying(30), typeofplace character(1), initialdueridetimestamp integer, lastdueridetimestamp integer, ridestatus character varying(10), processed as boolean)');

query.on('end', function() { client.end(); });
