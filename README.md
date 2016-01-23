# G7 Flight Stats Integration

Create PSQL database named 'nouvel_ui'

Create schema and restore some test data
```
psql  nouvel_ui < nouvel_ui.sql
```

Production start:
```
$ npm start
```
Debug start:
```
$ node debug bin/www
```

###  Query for flights/customer table
GET
[http://localhost:3000/api/v1/travelers](http://localhost:3000/api/v1/travelers)

Returns JSON array of flights being actively checked for status. Each flight contains an array of 
travelers who are on the flight and have requested a taxi
<br>
### Add a traveler record 
#### (gets called when a customer orders a taxi with a destination at an airport or train station)
POST
[http://localhost:3000/api/travelers]

Body contains
```
{
    "ridenumber": 31457,
    "travelid": "BA334",
    "pickupday": "24-01-16",
    "subscriptioncode": "2491",
    "requestedby": "MINNIE MOUSE",
    "refclient": "DONALD DUCK",
    "g7pickupzone": "TERMINAL ROISSY 3",
    "fromplace": "LONDON, UK - HEATHROW",
    "typeofplace": "A",
    "initialdueridetimestamp": 1453640400
}
```

### Delete a record from the travelers table using the order ID from TaxiPak
DELETE
[http://localhost:3000/api/travelers/:orderid](http://localhost:3000/api/travelers/:orderid)


### View table of results 

[http://localhost:3000](http://localhost:3000)


### Clear database tables for testing
[http://localhost:3000/api/v1/testclear](http://localhost:3000/api/v1/testclear)

### Populate database tables with data for testing 
[http://localhost:3000/api/v1/testharness/2016/01/16/22/CDG](http://localhost:3000/api/v1/testharness/2016/01/16/22/CDG)

where: 
```
    /{YYYY}/{MM}/{DD}/{HH}/{IATA_AIRPORT_CODE}  
 ```

