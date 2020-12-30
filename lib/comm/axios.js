require('./proto');
const verify = require('./verify');
const convert = require('./convert');
const querystring = require('querystring');
const axios = require('axios');
const FormData = require('form-data');
const https = require('https');

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