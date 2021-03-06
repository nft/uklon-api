# uklon-api

The API is not official. Reverse-engineering, so be careful. 

## Example usage

```javascript
const Uklon = require('uklon-api');

const uklon = new Uklon({
  clientId: '6289de851fc726f887af8d5d7a56c635', 
  city: 'Kiev',
  name: 'Name',
  phone: '380', // format 380xxxxxxx
  lang: 'en' // lang of response and requests
});

uklon.fetchAddress('raket')
    .then(console.log) // [{"address_name":"Raketna street","is_place":false}]
    .catch(e => console.log('Something went wrong', e));
```

### Methods

#### Get list of addresses

```javascript
uklon.fetchAddress('Sikor');

// Response
[
    {
        "address_name": "Sikorskoho street",
        "is_place": false // Means name of organization or smth, like supermarket name
    }
]
```
#### Get order cost

```javascript
uklon.fetchCost({
  route: {
    entrance: '1',
    routePoints: [
      {addressName: "Sikorskoho street", houseNumber: '1'}, 
      {addressName: "Raketna street", houseNumber: '1'}
    ]
  }
});

// Response
{
    "cost": 110,
    "extra_cost": 0,
    "currency": "UAH",
    "cost_discount": 0,
    "available_bonuses": 0,
    "cost_multiplier": 1,
    "cost_low": 110,
    "cost_high": 221,
    "distance": 13.9,
    "suburban_distance": 0
}
```

### Create order

```javascript

uklon.createOrder({
  route: {
    entrance: '1',
    routePoints: [
      {addressName: "Сикорского улица", houseNumber: '1'}, 
      {addressName: "Ракетная улица", houseNumber: '1'}
     ]
  }
});

// Response 
{
    "uid": "orderUID",
    "pickup_time": "1513715169",
    "created_at": "1513714569",
    "riders": [],
    "status": "processing",
    "car_type": "Standart",
    "payment_type": "Cash",
    "uklon_driver_only": false,
    "is_chat_available": false,
    "idle": {
        "time": 0,
        "cost": 0,
        "is_active": false
    }
}
```

#### Get order info

```javascript
uklon.fetchOrder('orderUID');

// Response
{
    "uid": "uid",
    "pickup_time": "1513624705",
    "created_at": "1513624105",
    "riders": [
        {
            "first_name": "name"
        }
    ],
    "cost": {
        "cost": 179.0000,
        "currency": "UAH",
        "extra_cost": 0.0000,
        "cost_multiplier": 1.6100,
        "distance": 14.02
    },
    "status": "canceled",
    "cancel_reason": "client",
    "invalid_payment_reason": "none",
    "car_type": "Standart",
    "add_conditions": [],
    "payment_type": "Cash",
    "uklon_driver_only": false,
    "is_chat_available": false,
    "idle": {
        "time": 0,
        "cost": 0,
        "is_active": false
    }
}
```

#### Recreate order

```javascript
uklon.recreateOrder('orderUID', extra_cost = 0);
```

#### Cancel order

```javascript
uklon.destroyOrder('orderUID', 'cancel_comment', client_cancel_reason = 'timeout');

// Response 
{
    "status": "canceled",
    "cancel_reason": "client"
}
```

#### Get driver location

```javascript
uklon.fetchDriverLocation('orderUID');

// Response
{
    "lat": 50.4408483333333,
    "lng": 30.4999983333333
}
```

#### Get traffic info

```javascript
uklon.fetchTraffic('orderUID');

// Response
{
    "regionTraffic": "In city - Clear roads 1 point",
    "routeTraffic": "<b>Road traffic</b>  On route 10 points",
    "loadType": "red"
}
```

#### Verify phone number

*It won't create the order if your number is not verified*

```javascript
uklon.verifyPhone();
```

#### Confirm the code

```javascript
uklon.confirmCode(216212);
```

### Cities
  - Kiev
  - Odessa
  - Kharkiv
  - Dnipro
  - Lviv
  - Zaporizhia
  - IvanoFrankivsk
  - Zhytomyr
  - Symu
  - Poltava
  - Chernihiv
  - Tbilisi