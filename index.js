'use strict';
const _merge = require('lodash.merge');
const request = require('request-promise-native');
const queryString = require('querystring');
const {ADDRESSES_ROUTE, COST_ROUTE, TIME_ROUTE, ORDER_ROUTE} = require('./constants');

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
 * @property {String} client_id
 * @property {String} [content-type]
 * @property {String} [cache-control]
 * @property {String} [accept-language]
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
 * @property {String} ClientName
 * @property {String} Phone
 * @property {String} RememberUser
 * @property {String} [ExtraCost]
 */

const DEFAULT_FORM = {
    CityId: '1',
    IsRouteUndefined: 'false',
    TimeType: 'now',
    CarType: 'Standart',
    PaymentType: 'Cash',
    PaymentInfo: 'Наличными',
    RememberUser: 'false',
    ExtraCost: '0'
};

class Uklon {
    /**
     * @description Create an instance of UklonAPI.
     * @param {String} client_id
     */
    constructor({client_id}) {
        this._client_id = client_id;
    }

    /**
     * @description Configure Options object.
     * @param {Object} data
     * @return {Options}
     */

    _makeFormDataRequestOptions(data) {
        return {
            headers: {
                client_id: this._client_id,
                'content-type': 'application/x-www-form-urlencoded',
                'cache-control': 'no-cache',
                'accept-language': 'en,ru;q=0.8,uk;q=0.6'
            },
            form: {...DEFAULT_FORM, ...this._objectToFormData(data)}
        };
    }

    /**
     * @description Get addresses.
     * @method GET
     * @url http://uklon.com.ua/api/v1/addresses?q=Octy&limit=5&timestamp=2162513
     * @param {String} address
     * @param {Number} limit
     * @param {Number} timestamp
     * @return {Promise} - [{"address_name": "Окты улица","is_place": false}] || ''
     */
    fetchAddress(address, limit = 5, timestamp = Date.now()) {
        let qs = queryString.stringify({q: address, limit, timestamp});
        let options = this._makeOptions(ADDRESSES_ROUTE + qs, 'GET');
        return this._makeRequest(options);
    }

    /**
     * @description Get the server time.
     * @method GET
     * @url http://uklon.com.ua/api/time
     * @return {Promise} - {"serverTime": "19-08-2017 00:53:05"}
     */
    fetchServerTime() {
        let options = this._makeOptions(TIME_ROUTE);
        return this._makeRequest(options);
    }

    /**
     * @description Get Cost of the order
     * @method POST
     * @url http://uklon.com.ua/api/v1/orders/cost
     * @param {Form} form
     * @return {Promise}
     */
    fetchCost(form) {
        let options = this._makeOptions(COST_ROUTE, 'POST', this._makeFormDataRequestOptions(form));
        return this._makeRequest(options);
    }

    /**
     * @description Create the order.
     * @method POST
     * @url http://uklon.com.ua/api/v1/orders/
     * @param {Object} data
     * @return {Promise}
     */
    createOrder(data) {
        let form = this._makeFormDataRequestOptions(data);
        let options = this._makeOptions(ORDER_ROUTE, 'POST', form);
        return this._makeRequest(options);
    }

    /**
     * @description Get order info
     * @method GET
     * @url http://uklon.com.ua/api/v1/orders/:order_id
     * @param {String} orderUid
     * @return {Promise}
     */
    fetchOrder(orderUid) {
        let options = this._makeOptions(`${ORDER_ROUTE}/${orderUid}`);
        return this._makeRequest(options);
    }

    /**
     * @description Get the Driver Location.
     * @method GET
     * @url http://uklon.com.ua/api/v1/orders/:order_id/driverLocation
     * @payload {lat: 50.4408483333333, lng: 30.4999983333333}
     * @param {String} orderUid
     * @return {Promise}
     */
    fetchDriverLocation(orderUid) {
        let options = this._makeOptions(`${ORDER_ROUTE}/${orderUid}/driverLocation`);
        return this._makeRequest(options);
    }

    /**
     * @description Get Traffic.
     * @method GET
     * @url http://uklon.com.ua/api/v1/orders/:order_id/traffic
     * @param {String} orderUid
     * @return {Promise} - {"regionTraffic":"In city - Clear roads 1 point","routeTraffic":"<b>Road traffic</b>  On route 10 points","loadType":"red"}
     */
    fetchTraffic(orderUid) {
        let options = this._makeOptions(`${ORDER_ROUTE}/${orderUid}/traffic`);
        return this._makeRequest(options);
    }

    /**
     * @description Recreate the order.
     * @method POST
     * @url http://uklon.com.ua/api/v1/orders/:order_id/recreate
     * @request_payload {extra_cost: <Number>}
     * @param {String} orderUid
     * @param {Number} [extra_cost]
     * @return {Promise}
     */
    recreateOrder(orderUid, extra_cost = 0) {
        let options = this._makeOptions(`${ORDER_ROUTE}/${orderUid}/recreate`, 'POST', {body: {extra_cost}});
        return this._makeRequest(options);
    }

    /**
     * @description Cancel the order.
     * @method PUT
     * @url http://uklon.com.ua/api/v1/orders/:order_id/cancel
     * @request_payload {client_cancel_reason: "timeout", cancel_comment: ""}
     * @param {String} orderUid
     * @param {String} [cancel_comment]
     * @param {String} [client_cancel_reason]
     * @return {Promise} - {"status":"canceled","cancel_reason":"client"}
     */
    destroyOrder(orderUid, cancel_comment = '', client_cancel_reason = 'timeout') {
        let options = this._makeOptions(`${ORDER_ROUTE}/${orderUid}/cancel`, 'PUT', {body: {
            cancel_comment,
            client_cancel_reason
        }});
        return this._makeRequest(options);
    }

    /**
     * @description [Helper] Transforms nested object to PHP Form Data object.
     * @param {Object} obj
     * @param {Object} [form]
     * @param {String} [namespace]
     * @return {Object}
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
   * @param {Object} [options]
   * @return {Options}
   */
  _makeOptions(url, method = 'GET', options = {}) {
    return _merge({url, method, headers: {client_id: this._client_id}, ...options});
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
