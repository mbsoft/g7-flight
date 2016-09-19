# G7 Flight Stats Integration

Create PSQL database named 'nouvel_ui (not needed unless testing locally)'

Create schema and restore some test data
```
psql  nouvel_ui < nouvel_ui.sql
```
---
Production start (on jws-test1 server):
```
# service g7-travel start
```
Debug start:
```
$ node debug bin/www
```
Production stop (on jws-test1 server):
```
# service g7-travel stop
```

---
###  Query for flights/customer table
GET
[http://jws-test1/api/v1/travelboard](http://jws-test1/api/v1/travelboard)

Returns JSON array of flights being actively checked for status. Each flight contains an array of
travelers who are on the flight and have requested a taxi
```
[
    {
        "arrtime": "08H00 24/01",
        "currentestimatetravelarrival": "2016-01-24T13:00:00.000Z",
        "delay": 0,
        "initialtravelarrival": "2016-01-24T13:00:00.000Z",
        "internationalname": "LONDON, UK - HEATHROW",
        "nbrtravelers": 2,
        "pickupday": "24-01-16",
        "status": "ON TIME",
        "travelers": [
            {
                "fromplace": "LONDON, UK - HEATHROW",
                "g7pickupzone": "TERMINAL ROISSY 3",
                "initialdueridetimestamp": 1453640400,
                "lastdueridetimestamp": 0,
                "pickupday": "24-01-16",
                "refclient": "DONALD DUCK",
                "requestedby": "MICKEY MOUSE",
                "ridenumber": 31456,
                "ridestatus": "CREATED",
                "subscriptioncode": "2491",
                "travelid": "BA334",
                "typeofplace": "A"
            },
            {
                "fromplace": "LONDON, UK - HEATHROW",
                "g7pickupzone": "TERMINAL ROISSY 3",
                "initialdueridetimestamp": 1453640400,
                "lastdueridetimestamp": 0,
                "pickupday": "24-01-16",
                "refclient": "DONALD DUCK",
                "requestedby": "MINNIE MOUSE",
                "ridenumber": 31457,
                "ridestatus": "CREATED",
                "subscriptioncode": "2491",
                "travelid": "BA334",
                "typeofplace": "A"
            }
        ],
        "travelid": "BA334",
        "zone": "TERMINAL ROISSY 3"
    }
]
```
---
###  Query for traveler table
GET
[http://jws-test1/v1/travelers](http://jws-test1/api/v1/travelers)

Returns JSON array of travelers-order in TaxiPak that require pickup at airport or trainstation. 
```
[
    {
        "travelers": [
            {
                "fromplace": "Tokyo, Japan - Haneda ",
                "g7pickupzone": "TERMINAL ROISSY 3",
                "initialdueridetimestamp": 1454164800,
                "lastdueridetimestamp": 1454164800,
                "pickupday": "30-01-16",
                "refclient": "MR GHZONDROHTSU",
                "requestedby": "MR GHZONDROHTSU",
                "ridenumber": 324681,
                "ridestatus": "CREATED",
                "subscriptioncode": "1676",
                "travelid": "JL45",
                "typeofplace": "A"
            },
            {
                "fromplace": "Casablanca, Morocco - Mohamed ",
                "g7pickupzone": "TERMINAL ROISSY 3",
                "initialdueridetimestamp": 1454165100,
                "lastdueridetimestamp": 1454165100,
                "pickupday": "30-01-16",
                "refclient": "MR ITWJPOUKHRWA",
                "requestedby": "MR ITWJPOUKHRWA",
                "ridenumber": 3277830,
                "ridestatus": "CREATED",
                "subscriptioncode": "2284",
                "travelid": "AT788",
                "typeofplace": "A"
            }
        ]
    }
]
```
---
### Add a traveler record
#### (gets called when a customer orders a taxi with a destination at an airport or train station)
POST
[http://jws-test1/api/travelers/add](http://jws-test1/api/travelers)

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
---
### Delete a record from the travelers table using the order ID from TaxiPak
POST
[http://jws-test1/api/travelers/delete](http://jws-test1/api/travelers/delete)

Body contains
```
{
    "ridenumber": 31457
}
```
---
### Update an existing traveler record
POST
[http://jws-test1/api/travelers/update](http://jws-test1/api/travelers/update)

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
---
### View of 'Travel Board' - flights and passengers

[http://jws-test1/viewTravelBoard](http://jws-test1/viewTravelBoard)

### View of Travelers - just pending passengers
[http://jws-test1/viewTravelers](http://jws-test1/viewTravelers)

---
### Clear database tables for testing
[http://jws-test1/test/clear](http://jws-test1/test/clear)

### Populate database tables with data for testing
[http://jws-test1/test/harness/2016/01/16/22/CDG](http://jws-test1/test/harness/2016/01/16/22/CDG)

where:
```
    /{YYYY}/{MM}/{DD}/{HH}/{IATA_AIRPORT_CODE}  
 ```
