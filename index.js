'use strict';
const _merge = require('lodash.merge');
const request = require('request-promise-native');
const queryString = require('querystring');

const {CITIES, URLS, DEFAULT_FORM} = require('./constants');

/**
 * @typedef {Object} Options
 * @property {String} url
 * @property {String} method
 * @property {Headers} headers
 * @property {Form} [form]
 * @property {Object} [body]
 */

/**
 * @typedef {Object} Headers
 * @property {String} [content-type]
 * @property {String} [cache-control]
 * @property {String} [accept-language]
 * @property {String} [client_id]
 */

/**
 * @typedef {Object} Route
 * @property {String} entrance
 * @property {Array.<{AddressName: String, HouseNumber: String}>} routePoints
 * @property {String} [comment]
 */

/**
 * @typedef {Object} FormObj
 * @property {Route} route
 * @property {String} [CityId]
 * @property {String} [IsRouteUndefined]
 * @property {String} [TimeType]
 * @property {String} [CarType]
 * @property {String} [PaymentType]
 * @property {String} [PaymentInfo]
 * @property {String} [ClientName]
 * @property {String} [Phone]
 * @property {String} [RememberUser]
 * @property {String} [ExtraCost]
 */

/**
 * @typedef {Object} Form
 * @property {String} CityId
 * @property {String} route.routePoints[].AddressName
 * @property {String} route.routePoints[].HouseNumber
 * @property {String} route.entrance
 * @property {String} route.comment
 * @property {String} IsRouteUndefined
 * @property {String} TimeType
 * @property {String} CarType
 * @property {String} PaymentType
 * @property {String} PaymentInfo
 * @property {String} [ClientName]
 * @property {String} [Phone]
 * @property {String} [RememberUser]
 * @property {String} [ExtraCost]
 */

class Uklon {
  /**
   * @description An instance of UklonAPI.
   * @param {String} clientId
   * @param {String} [lang]
   * @param {String} [name]
   * @param {String} [phone]
   * @param {String} [city]
   */
  constructor({clientId, lang = 'en', name, phone, city = 'Kiev'}) {
    if (!clientId) {
      throw new Error('clientId is required.');
    }

    if (city && !CITIES[city]) {
      throw new Error('City not found.');
    }

    if (phone && phone.startsWith('+')) {
      throw new Error('Wrong phone format.');
    }

    this.clientId = clientId;
    this.lang = lang;
    this.name = name;
    this.city = CITIES[city];
    this.phone = phone;

    this.form = {...DEFAULT_FORM, ClientName: this.name, Phone: this.phone, CityId: this.city};
  }

  /**
   * @description Get addresses.
   * @method GET
   * @url https://www.uklon.com.ua/api/v1/addresses?q=raket&limit=5&timestamp=2162513
   * @param {String} address
   * @param {Number} limit
   * @param {Number} timestamp
   * @return {Promise}
   */
  fetchAddress(address, limit = 5, timestamp = Date.now()) {
    const qs = queryString.stringify({q: address, limit, timestamp});
    const options = this._getOptions(`${URLS.addresses}?${qs}`, 'GET');

    return this._makeRequest(options);
  }

  /**
   * @description Get server time.
   * @method GET
   * @url https://www.uklon.com.ua/api/time
   * @return {Promise}
   */
  fetchServerTime() {
    const options = this._getOptions(URLS.time);

    return this._makeRequest(options);
  }

  /**
   * @description Get cost of the order.
   * @method POST
   * @url https://www.uklon.com.ua/api/v1/orders/cost
   * @param {FormObj} form
   * @return {Promise}
   */
  fetchCost(form = {}) {
    const options = this._getOptions(URLS.cost, 'POST', this._getFormDataRequestOptions({...this.form, ...form}));

    return this._makeRequest(options);
  }

  /**
   * @description Create order.
   * @method POST
   * @url https://www.uklon.com.ua/api/v1/orders/
   * @param {FormObj} form
   * @return {Promise}
   */
  createOrder(form = {}) {
    const options = this._getOptions(URLS.orders, 'POST', this._getFormDataRequestOptions({...this.form, ...form}));

    return this._makeRequest(options);
  }

  /**
   * @description Get order info
   * @method GET
   * @url https://www.uklon.com.ua/api/v1/orders/:order_id
   * @param {String} orderUid
   * @return {Promise}
   */
  fetchOrder(orderUid) {
    const options = this._getOptions(`${URLS.orders}/${orderUid}`);

    return this._makeRequest(options);
  }

  /**
   * @description Get the Driver Location.
   * @method GET
   * @url https://www.uklon.com.ua/api/v1/orders/:order_id/driverLocation
   * @param {String} orderUid
   * @return {Promise}
   */
  fetchDriverLocation(orderUid) {
    const options = this._getOptions(`${URLS.orders}/${orderUid}/driverLocation`);

    return this._makeRequest(options);
  }

  /**
   * @description Get traffic.
   * @method GET
   * @url https://www.uklon.com.ua/api/v1/orders/:order_id/traffic
   * @param {String} orderUid
   * @return {Promise}
   */
  fetchTraffic(orderUid) {
    const options = this._getOptions(`${URLS.orders}/${orderUid}/traffic`);
    return this._makeRequest(options);
  }

  /**
   * @description Recreate the order.
   * @method POST
   * @url https://www.uklon.com.ua/api/v1/orders/:order_id/recreate
   * @request_payload {extra_cost: <Number>}
   * @param {String} orderUid
   * @param {Number} [extra_cost = 0]
   * @return {Promise}
   */
  recreateOrder(orderUid, extra_cost = 0) {
    const options = this._getOptions(`${URLS.orders}/${orderUid}/recreate`, 'POST', {
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({extra_cost})
    });

    return this._makeRequest(options);
  }

  /**
   * @description Cancel the order.
   * @method PUT
   * @url https://www.uklon.com.ua/api/v1/orders/:order_id/cancel
   * @request_payload {client_cancel_reason: "timeout", cancel_comment: ""}
   * @param {String} orderUid
   * @param {String} [cancel_comment = '']
   * @param {String} [client_cancel_reason = 'client']
   * @return {Promise}
   */
  destroyOrder(orderUid, cancel_comment = '', client_cancel_reason = 'client') {
    const options = this._getOptions(`${URLS.orders}/${orderUid}/cancel`, 'PUT', {
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({
        cancel_comment,
        client_cancel_reason
      })
    });

    return this._makeRequest(options);
  }

  /**
   * @description Verify the phone number.
   * @method POST
   * @url https://www.uklon.com.ua/api/v1/phone/verification
   * @param {String} [phone = this.phone]
   * @return {Promise}
   */
  verifyPhone(phone = this.phone) {
    const options = this._getOptions(URLS.verification, 'POST', this._getFormDataRequestOptions({phone}));

    return this._makeRequest(options);
  }

  /**
   * @description Confirm the verification code.
   * @method POST
   * @url https://www.uklon.com.ua/api/v1/phone/verification/approve
   * @param {String} code
   * @param {String} [phone = this.phone]
   * @return {Promise}
   */
  confirmCode(code, phone = this.phone) {
    const options = this._getOptions(URLS.confirmCode, 'POST', this._getFormDataRequestOptions({phone, code}));

    return this._makeRequest(options);
  }

  /**
   * @description Configure Options object.
   * @param {Object} data
   * @return {Form}
   */
  _getFormDataRequestOptions(data) {
    return {
      form: this._objectToFormData(data)
    };
  }

  /**
   * @description [Helper] Transforms nested object to PHP Form Data object.
   * @param {Object} obj
   * @param {Object} [form]
   * @param {String} [namespace]
   * @return {Form}
   */
  _objectToFormData(obj, form, namespace) {
    let fd = form || {};
    let formKey;

    for (let property in obj) {
      if (obj.hasOwnProperty(property)) {
        if (namespace) {
          formKey = !isNaN(+property) ? namespace + '[' + property + ']' : namespace + '.' + property;
        } else {
          formKey = property;
        }
        if (typeof obj[property] === 'object') {
          this._objectToFormData(obj[property], fd, formKey);
        } else {
          Object.assign(fd, {[formKey]: obj[property]});
        }
      }
    }

    return fd;
  };

  /**
   * @description Makes Options.
   * @param {String} url
   * @param {String} [method = GET]
   * @param {object} options
   * @return {Options}
   */
  _getOptions(url, method = 'GET', options = {}) {
    const optionsInit = {
      headers: {Cookie: `CultureUklon=${this.lang}; City=${this.city};`, client_id: this.clientId},
    };

    return _merge({url, method, ..._merge(optionsInit, options)});
  }

  /**
   * @description Makes Request.
   * @param {Options} [options]
   * @return {Promise}
   */
  _makeRequest(options) {
    return request(options);
  }
}

module.exports = Uklon;
