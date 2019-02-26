'use strict';
const assert = require('assert');
const Uklon = require('../index.js');
const {URLS} = require('../constants');

// Patch the make request method. We don't need to make real requests
Uklon.prototype._makeRequest = function (options) {
  return options;
};

const clientId  = 'cliend-id';
const name = 'Name';
const phone = '380';

const uklon = new Uklon({clientId, name, phone});

const FETCH_COST_FORM_PROPS = [
  'form.CityId',
  'form.route.routePoints[0].AddressName',
  'form.route.routePoints[0].HouseNumber',
  'form.route.entrance',
  'form.route.comment',
  'form.IsRouteUndefined',
  'form.route.routePoints[1].AddressName',
  'form.route.routePoints[1].HouseNumber',
  'form.TimeType',
  'form.CarType',
  'form.PaymentType',
  'form.PaymentInfo',
  'form.ClientName',
  'form.Phone',
  'form.RememberUser'
];
const DEFAULT_FORM_HEADERS = {
  client_id: clientId,
  "Cookie": "CultureUklon=en; City=1;"
};
const DEFAULT_HEADERS = {
  client_id: clientId,
  "Cookie": "CultureUklon=en; City=1;"
};

/*  Regular Steps for creating order
 1. /addresses?q=qs                   GET
 2. /cost                             POST
 3. /time                             GET
 4. /orders                           POST
 5. /orders/:uid                      GET
 6. /orders/:uid/traffic              GET

 To cancel order
 7. /orders/:uid/cancel               PUT

 If you get an error, like phone number is incorrect
 8. /phone/verification               POST
 9. /phone/verification/approve       POST
 */

// I did an extra field "response", just to make things clearer.
const REQUESTS = {
// Server Time GET
  FETCH_SERVER_TIME: {
    name: 'fetchServerTime',
    response: {"serverTime": "19-08-2017 00:53:05"},
    compare: {
      url: URLS.time,
      method: 'GET',
      headers: {...DEFAULT_HEADERS}
    }
  },
// Fetch Address GET
  FETCH_ADDRESS: {
    name: 'fetchAddress',
    args: ['sikor', 5, 2723671],
    response: [
      {"address_name":"Sikorskoho street","is_place":false},
      {"address_name":"Supermarket Bdzhilka (Sikorskoho street, 1A)","is_place":true},
      {"address_name":"Business Center Flora Park (Sikorskoho street, 8)","is_place":true},
      {"address_name":"Embassy of the United States of America in Ukraine (Sikorskoho street, 4)","is_place":true}
    ],
    compare: {
      url: `${URLS.addresses}?q=sikor&limit=5&timestamp=2723671`,
      method: 'GET',
      headers: {...DEFAULT_HEADERS}
    }
  },
// Fetch Cost POST
  FETCH_COST: {
    name: 'fetchCost',
    validator: ['url', 'headers.method', 'headers.client_id', ...FETCH_COST_FORM_PROPS],
    response: {
      "cost": 107,
      "extra_cost": 0,
      "currency": "UAH",
      "cost_discount": 0,
      "available_bonuses": 0,
      "cost_multiplier": 1,
      "cost_low": 105,
      "cost_high": 215,
      "distance": 12.78,
      "suburban_distance": 0
    },
    args: [{
      "route": {
        "comment": "",
        "entrance": "1",
        "routePoints": [
          {"addressName": "Sikorskoho street", "houseNumber": "78"},
          {"addressName": "Vladislava Zaremby lane", "houseNumber": "33"}
        ]
      }
    }],
    compare: {
      url: URLS.cost,
      method: 'POST',
      headers: {...DEFAULT_FORM_HEADERS},
      form: {
        CityId: 1,
        ClientName: name,
        Phone: phone,
        IsRouteUndefined: 'false',
        TimeType: 'now',
        CarType: 'Standart',
        PaymentType: 'Cash',
        PaymentInfo: 'Наличными',
        RememberUser: 'false',
        ExtraCost: '0',
        'route.comment': '',
        'route.entrance': '1',
        'route.routePoints[0].addressName': 'Sikorskoho street',
        'route.routePoints[0].houseNumber': '78',
        'route.routePoints[1].addressName': 'Vladislava Zaremby lane',
        'route.routePoints[1].houseNumber': '33'
      }
    }
  },
// Create Order POST
  CREATE_ORDER: {
    name: 'createOrder',
    validator: ['url', 'headers.method', 'headers.client_id', ...FETCH_COST_FORM_PROPS, 'form.ExtraCost'],
    args: [{
      comment: '',
      Phone: phone,
      entrance: '1',
      route: {
        routePoints: [
          {addressName: 'Sikorskoho street', houseNumber: '78'},
          {addressName: 'Vladislava Zaremby lane', houseNumber: '33'}]
      }
    }],
    response: {
      "uid": "2a2444f7f7a848628bc5ca2a70ab0502n",
      "pickup_time": "1503683090",
      "created_at": "1503682490",
      "status": "processing",
      "car_type": "Standart",
      "payment_type": "Cash",
      "uklon_driver_only": false,
      "is_chat_available": false
    },
    compare: {
      url: URLS.orders,
      method: 'POST',
      headers: {...DEFAULT_FORM_HEADERS},
      form: {
        CityId: 1,
        ClientName: 'Name',
        IsRouteUndefined: 'false',
        TimeType: 'now',
        CarType: 'Standart',
        PaymentType: 'Cash',
        PaymentInfo: 'Наличными',
        RememberUser: 'false',
        ExtraCost: '0',
        comment: '',
        entrance: '1',
        'route.routePoints[0].addressName': 'Sikorskoho street',
        'route.routePoints[0].houseNumber': '78',
        'route.routePoints[1].addressName': 'Vladislava Zaremby lane',
        'route.routePoints[1].houseNumber': '33',
        Phone: phone
      }
    }
  },
// Fetch Order [GET]
  FETCH_ORDER: {
    name: 'fetchOrder',
    args: ['order-uid'],
    response: {
      "uid": "2a2444f7f7a848628bc5ca2a70ab0502n",
      "pickup_time": "1503683090",
      "created_at": "1503682490",
      "status": "processing",
      "car_type": "Standart",
      "payment_type": "Cash",
      "uklon_driver_only": false,
      "is_chat_available": false
    },
    compare: {
      url: `${URLS.orders}/order-uid`,
      method: 'GET',
      headers: {...DEFAULT_HEADERS}
    }
  },
// Fetch Driver Location [GET]
  FETCH_DRIVER_LOCATION: {
    name: 'fetchDriverLocation',
    args: ['order-uid'],
    response: {"lat": 50.4408483333333, "lng": 30.4999983333333},
    compare: {
      url: `${URLS.orders}/order-uid/driverLocation`,
      method: 'GET',
      headers: {...DEFAULT_HEADERS}
    }
  },
// Fetch Traffic [GET]
  FETCH_TRAFFIC: {
    name: 'fetchTraffic',
    args: ['order-uid'],
    response: {
      "regionTraffic": "In city - Clear roads 1 point",
      "routeTraffic": "<b>Road traffic</b>  On route 10 points",
      "loadType": "red"
    },
    compare: {
      url: `${URLS.orders}/order-uid/traffic`,
      method: 'GET',
      headers: {...DEFAULT_HEADERS}
    }
  },
// Recreate Order [POST]
  RECREATE_ORDER: {
    name: 'recreateOrder',
    args: ['order-uid', '5'],
    response: {},
    compare: {
      url: `${URLS.orders}/order-uid/recreate`,
      method: 'POST',
      headers: {...DEFAULT_HEADERS, 'content-type': 'application/json'},
      body: JSON.stringify({extra_cost: '5'})
    }
  },
// Destroy Order [PUT]
  DESTROY_ORDER: {
    name: 'destroyOrder',
    args: ['order-uid'],
    response: {"status": "canceled", "cancel_reason": "client"},
    compare: {
      url: `${URLS.orders}/order-uid/cancel`,
      method: 'PUT',
      headers: {...DEFAULT_HEADERS, 'content-type': 'application/json'},
      body: JSON.stringify({cancel_comment: '', client_cancel_reason: 'client'})
    }
  },
  VERIFY_PHONE: {
    name: 'verifyPhone',
    args: [],
    response: {},
    compare: {
      url: URLS.verification,
      method: 'POST',
      headers: {...DEFAULT_HEADERS},
      form: {phone}
    }
  },
  CONFIRM_CODE: {
    name: 'confirmCode',
    args: ['code'],
    response: {},
    compare: {
      url: URLS.confirmCode,
      method: 'POST',
      headers: {...DEFAULT_HEADERS},
      form: {code: 'code', phone}
    }
  },
};

const REQUEST_NAMES = Object.keys(REQUESTS);

describe('Check options', () => {
  for (let requestName of REQUEST_NAMES) {
    it(`It should make correct options for ${requestName}`, () => {
      let {compare, name, args = []} = REQUESTS[requestName];
      assert.deepEqual(compare, uklon[name](...args));
    });
  }
});
