# G7 Flight Stats Integration

Create PSQL database named 'nouvel_ui'

Create schema and restore some test data
```
psql  nouvel_ui < nouvel_ui.sql
```
---
Production start:
```
$ npm start
```
Debug start:
```
$ node debug bin/www
```
---
###  Query for flights/customer table
GET
[http://localhost:3000/api/v1/travelboard](http://localhost:3000/api/v1/travelboard)

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
[http://localhost:3000/api/v1/travelers](http://localhost:3000/api/v1/travelers)

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
[http://localhost:3000/api/travelers](http://localhost:3000/api/travelers)

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
### Add a traveler record from legacy TaxiPak system
#### this system only supports HTTP GET
GET
[http://localhost:3000/api/travelers/:orderid?params](http://localhost:3000/api/travelers/:orderid?params)

Parameters must include:
```
?travelid={flight or train number}
&pickupday={DD-MM-YY}
&subscriptioncode={account code}
&requestedby={who made order request}
&refclient={customer name}
&g7pickupzone={internal description of TaxiPak zone}
&fromplace={location of origin of travel}
&typeofplace={A|G}
&initialduetime={UNIX datetime stamp}
```

---
### Delete a record from the travelers table using the order ID from TaxiPak
DELETE
[http://localhost:3000/api/travelers/:orderid](http://localhost:3000/api/travelers/:orderid)

---
### View of 'Travel Board' - flights and passengers

[http://localhost:3000/viewTravelBoard](http://localhost:3000/viewTravelBoard)

### View of Travelers - just pending passengers
[http://localhost:3000/viewTravelers](http://localhost:3000/viewTravelers)

---
### Clear database tables for testing
[http://localhost:3000/api/v1/testclear](http://localhost:3000/api/v1/testclear)

### Populate database tables with data for testing 
[http://localhost:3000/api/v1/testharness/2016/01/16/22/CDG](http://localhost:3000/api/v1/testharness/2016/01/16/22/CDG)

where: 
```
    /{YYYY}/{MM}/{DD}/{HH}/{IATA_AIRPORT_CODE}  
 ```
