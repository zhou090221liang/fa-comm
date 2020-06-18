require('./proto');
const req = require('request');
const verify = require('./verify');
const querystring = require('querystring');
const iconv = require('iconv-lite');
const cheerio = require('cheerio');
const convert = require('./convert');
const charset = require('superagent-charset');
const superagent = require('superagent');
charset(superagent);

/**
 * POST Form
 * @param {*} url
 * @param {*} form
 */
exports.postForm = (url, form, options) => {
    return new Promise(function (reslove, reject) {
        options = options || {};
        let formData = querystring.stringify(form);
        let contentLength = formData.length;
        //请求头
        options.headers = options.headers || {};
        if (!options.headers['Content-Length']) {
            options.headers['Content-Length'] = contentLength;
        }
        options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/x-www-form-urlencoded; encoding=utf-8';
        req({
            headers: options.headers,
            uri: url,
            body: formData,
            method: 'POST'
        }, function (err, res, body) {
            if (err) {
                reject(err);
            } else {
                reslove(body);
            }
        });
    });
};

/**
 * POST body
 * @param {String} url
 * @param {*} body
 */
exports.post = (url, body, options) => {
    return new Promise(function (reslove, reject) {
        options = options || {};
        const _body = body ? convert.toString(body) : "";
        let contentLength = _body.getByteLength;
        //请求头
        options.headers = options.headers || {};
        if (!options.headers['Content-Length']) {
            options.headers['Content-Length'] = contentLength;
        }
        if (options.headers['Content-Type']) {
            options.headers['Content-Type'] = options.headers['Content-Type'];
        } else {
            if (verify.isJsonOrJsonArray(body)) {
                options.headers['Content-Type'] = 'application/json;encoding=utf-8';
            } else {
                options.headers['Content-Type'] = 'application/x-www-form-urlencoded;encoding=utf-8';
            }
        }
        // options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/x-www-form-urlencoded; encoding=utf-8';
        req({
            headers: options.headers,
            uri: url,
            body: _body,
            method: 'POST'
        }, function (err, res, body) {
            if (err) {
                reject(err);
            } else {
                reslove(body);
            }
        });
    });
};

/**
 * 发送HTTP请求
 * @param {JSON} options headers,data,
 * @returns
 */
exports.request = (options) => {
    return new Promise(function (reslove, reject) {
        //请求头
        options.headers = options.headers || {};
        if (options.headers['Content-Type']) {
            options.headers['Content-Type'] = options.headers['Content-Type'];
        } else {
            if (verify.isJsonOrJsonArray(options.body || (options.data || ''))) {
                options.headers['Content-Type'] = 'application/json;encoding=utf-8';
            } else {
                options.headers['Content-Type'] = 'application/x-www-form-urlencoded;encoding=utf-8';
            }
        }
        //请求参数
        options.data = convert.toString(options.data || '');
        options.body = convert.toString(options.body || '');
        options.body = options.body || options.data;
        if (!options.headers['Content-Length']) {
            options.headers['Content-Length'] = options.body.getByteLength();
        }
        //其他参数默认值
        options.method = options.method || (options.type || 'GET');
        options.uri = options.url || (options.uri || 'http://');
        //发送请求
        req(options, function (err, response, body) {
            if (err) {
                reject(err);
            } else {
                reslove(response);
            }
        });
    });
};

/**
 * 发送GET请求
 * @param {*} url 请求地址
 * @returns
 */
exports.requesturl = (url) => {
    return new Promise(function (reslove, reject) {
        req({
            url: url,
            method: 'get',
            headers: {},
            timeout: 10000
        }, function (err, response, body) {
            if (err) {
                reslove();
            } else {
                reslove(body);
            }
        });
    });
};

// /**
//  * 发送微信POST请求
//  * @param {*} path 微信api接口路由地址
//  * @param {*} data 数据
//  * @returns
//  */
// exports.wechatPost = (path, data) => {
//     return new Promise(function (reslove, reject) {
//         const https = require('https');
//         const opt = {
//             host: 'api.weixin.qq.com',
//             port: 443,
//             path: path,
//             method: 'POST',
//             headers: {
//                 'Content-Length': Buffer.from(JSON.stringify(data)).length
//             }
//         };
//         var _req = https.request(opt, function (_res) {
//             if (_res.statusCode == 200) {
//                 let body = '';
//                 _res.setEncoding('utf8');
//                 _res.on('data', function (chunk) {
//                     body += chunk;
//                 });
//                 _res.on('end', function (chunk) {
//                     reslove(body);
//                 });
//                 _res.on('error', function (e) {
//                     console.error(e);
//                     reslove();
//                 });
//             } else {
//                 console.warn(`statusCode is not 200,${_res.statusCode.toString()}`);
//                 reslove();
//             }
//         });
//         // 将参数发出
//         _req.write(JSON.stringify(data) + "\n");
//         _req.end();
//     });
// };

/**
 * 获取地址栏参数
 * @param {*} name 参数名称
 * @param {*} url 地址 默认window.location.search
 * @returns
 */
function getUrlParams(name, url) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    if (!url) {
        if (window && window.location && window.location.search) {
            url = window.location.search;
        } else {
            url = '';
        }
    }
    var r = url.substr(url.indexOf("?") + 1).match(reg);
    if (r != null) return decodeURI(r[2]);
    return "";
}
exports.getUrlParams = getUrlParams;

/**
 * 获取query参数
 * @param {*} url
 * @returns
 */
function getQuery(url) {
    url = decodeURIComponent(url || '');
    url = url.split('&');
    let query = {};
    for (let _url of url) {
        let _u = _url.split('=');
        _u[0] && (query[_u[0]] = _u[1]);
    }
    return query;
}
exports.getQuery = getQuery;

/**
 * 获取网站源码
 * @param {*} url 网站地址
 * @returns
 */
exports.getHtml = (url) => {
    return new Promise(function (resolve, reject) {
        req.get({ url }, function (err, response, body) {
            if (err) {
                console.log('ERROR!!!!!!!!!!!!');
                reject(err);
            } else {
                try {
                    console.log('[OK]');
                    resolve(body);
                } catch (e) {
                    console.log('[ERROR]!!!!!!!!!!!!');
                    reject(e);
                }
            }
        });
    });
}

/**
 * 获取网站源码并转换成Jquery
 * @param {*} url 网站地址
 * @param {string} [encoding='utf-8'] 编码
 * @returns
 */
exports.getHtmlByJquery = (url, encoding = 'utf-8') => {
    return new Promise(function (resolve, reject) {
        req.get({ url, encoding: null }, function (err, response, body) {
            if (err) {
                reject(err);
            } else {
                try {
                    const buf = iconv.decode(body, encoding);
                    const $ = cheerio.load(buf);
                    resolve($);
                } catch (e) {
                    reject(e);
                }
            }
        });
    });
}

exports

exports.superagent = superagent;