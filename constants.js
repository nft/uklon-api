'use strict';

const URLS = {
  addresses: 'https://www.uklon.com.ua/api/v1/addresses',                   // GET
  cost: 'https://www.uklon.com.ua/api/v1/orders/cost',                      // POST
  time: 'https://www.uklon.com.ua/api/time',                                // GET
  orders: 'https://www.uklon.com.ua/api/v1/orders',                         // GET|POST|PUT,
  verification: 'https://www.uklon.com.ua/api/v1/phone/verification',       // POST
  confirmCode: 'https://www.uklon.com.ua/api/v1/phone/verification/approve' // POST
};

const CITIES = {
  Kiev: 1,
  Odessa: 2,
  Kharkiv: 3,
  Dnipro: 4,
  Lviv: 5,
  Zaporizhia: 6,
  IvanoFrankivsk: 7,
  Zhytomyr: 8,
  Symu: 12,
  Poltava: 13,
  Chernihiv: 17,
  Tbilisi: 50
};

const DEFAULT_FORM = {
  CityId: CITIES.Kiev,
  IsRouteUndefined: 'false',
  TimeType: 'now',
  CarType: 'Standart',
  PaymentType: 'Cash',
  PaymentInfo: 'Наличными',
  RememberUser: 'false',
  ExtraCost: '0'
};

module.exports = {
  CITIES,
  URLS,
  DEFAULT_FORM
};
