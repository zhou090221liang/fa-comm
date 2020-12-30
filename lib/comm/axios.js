require('./proto');
const verify = require('./verify');
const convert = require('./convert');
const querystring = require('querystring');
const axios = require('axios');
const FormData = require('form-data');
const https = require('https');

/*
const get = function (url, data) {
    return new Promise(function (resolve, reject) {
        url = url || "http://localhost";
        const ts = new Date().valueOf();
        if (verify.isJson(data)) {
            url += url.indexOf('?') > -1 ? `${querystring(data)}&fc_ts=${ts}` : `fc_ts=${ts}${querystring(data)}`;
        } else {
            url = url.split('?');
            let tmp = `${url[0]}/${encodeURIComponent(convert.toString(data))}?fc_ts=${ts}`;
            if (url.length > 1) {
                tmp += `&${url[1]}`;
            }
            url = tmp;
        }
        let request = axios;
        if (url.startWith('https://')) {
            request = axios.create({
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                })
            });
        }
        request.get(url).then(function (data) {
            if (data.status == 200) {
                resolve(data.data);
            } else {
                reject(new Error(data.statusText));
            }
            var d = 1;
        }).catch(function (e) {
            reject(new Error(e));
        });
    });
}

const post = function (url, data) {
    return new Promise(function (resolve, reject) {
        data = data || "";
        url = url || "http://localhost";
        const ts = new Date().valueOf();
        if (url.indexOf('?') > -1) {
            url += `&fc_ts=${ts}`;
        } else {
            url += `?fc_ts=${ts}`;
        }
        let fdHeader = null;
        if (data && data.getHeaders && typeof data.getHeaders == 'function') {
            fdHeader = data.getHeaders();
            if (fdHeader['content-type']) {
                fdHeader = { headers: fdHeader };
            }
        }
        let request = axios;
        if (url.startWith('https://')) {
            request = axios.create({
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                })
            });
        }
        request.post(url, data, fdHeader).then(function (data) {
            if (data.status == 200) {
                resolve(data.data);
            } else {
                reject(new Error(data.statusText));
            }
            var d = 1;
        }).catch(function (e) {
            reject(e);
        });
    });
}

module.exports = {
    FormData,
    get,
    post,
};
*/

const request = class {
    constructor(baseUrl = "http://127.0.0.1", headers = null, timeout = 60000) {
        this.FormData = FormData;
        this._baseUrl = baseUrl;
        this._headers = headers;
        this._timeout = timeout;
        if (baseUrl.startWith('https://')) {
            this.instance = axios.create({
                baseUrl,
                timeout,
                headers,
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                })
            });
        } else {
            this.instance = axios.create({
                baseUrl,
                timeout,
                headers
            });
        }
        this.get = function (url = '/', data) {
            const self = this;
            return new Promise(function (resolve, reject) {
                if (data) {
                    url += url.indexOf('?') > -1 ? `${querystring(data)}` : `?${querystring(data).replace('&', '')}`;
                }
                self.instance.get(`${self._baseUrl}${url}`).then(function (data) {
                    if (data.status == 200) {
                        resolve(data.data);
                    } else {
                        reject(new Error(data.statusText));
                    }
                }).catch(function (e) {
                    reject(e);
                });
            });
        };
        this.post = function (url = '/', data) {
            const self = this;
            return new Promise(function (resolve, reject) {
                data = data || "";
                let header = self._headers || {};
                if (data && data.getHeaders && typeof data.getHeaders == 'function') {
                    let fdHeader = data.getHeaders();
                    header['content-type'] = fdHeader['content-type'];
                }
                self.instance.post(`${self._baseUrl}${url}`, data, { headers: header }).then(function (data) {
                    if (data.status == 200) {
                        resolve(data.data);
                    } else {
                        reject(new Error(data.statusText));
                    }
                }).catch(function (e) {
                    reject(e);
                });
            });
        };
    }
};

module.exports = request;