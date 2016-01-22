# G7 Flight Stats Integration

Create PSQL database named 'nouvel_ui'

Create schema and restore some test data

psql  nouvel_ui < nouvel_ui.sql

Production start:
$ npm start

Debug start:
$ node debug bin/www

Clear database tables for testing
http://localhost:3000/api/v1/testclear

Populate database tables with data for testing 
http://localhost:3000/api/v1/testharness/2016/01/16/22/CDG

where: 
    /{YYYY}/{MM}/{DD}/{HH}/{IATA_AIRPORT_CODE}  
 
View table of results

http://localhost:3000

