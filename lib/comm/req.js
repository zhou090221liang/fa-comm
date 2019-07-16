require('./proto');
const req = require('request');
const verify = require('./verify');
const querystring = require('querystring');

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
 * 发送HTTP请求
 * @param {JSON} options headers,data,
 * @returns
 */
exports.request = (options) => {
    return new Promise(function (reslove, reject) {
        //请求参数
        options.data = options.data || "";
        if (verify.isJson(options.data) || verify.isJsonArray(options.data)) {
            options.data = JSON.stringify(options.data);
        } else if (typeof options.data != 'string') {
            options.data = options.data.toString();
        }
        //请求头
        options.headers = options.headers || {};
        if (!options.headers['Content-Length']) {
            options.headers['Content-Length'] = options.data.byteLength();
        }
        options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json; encoding=utf-8';

        //发送请求
        req(options, function (err, response, body) {
            if (err) {
                reject(err);
            } else {
                reslove(body);
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

let wechat = {
    option: {
        //获取access_token
        access_token: {
            url: '/cgi-bin/token?grant_type=client_credential&appid={appid}&secret={appsecret}',
            method: 'GET'
        },
        //添加客服账号
        customservice_kfaccount_add: {
            url: '/customservice/kfaccount/add?access_token={access_token}',
            method: 'POST'
        },
        //修改客服帐号
        customservice_kfaccount_update: {
            url: '/customservice/kfaccount/update?access_token={access_token}',
            method: 'POST'
        },
        //删除客服帐号
        customservice_kfaccount_del: {
            url: '/customservice/kfaccount/del?access_token={access_token}',
            method: 'POST'
        },
        //设置客服帐号的头像(POST一个FORM表单)
        customservice_kfaccount_uploadheadimg: {
            url: '/customservice/kfaccount/uploadheadimg?access_token={access_token}&kf_account={kf_account}',
            method: 'POST'
        },
        //获取所有客服账号
        customservice_getkflist: {
            url: '/cgi-bin/customservice/getkflist?access_token={access_token}',
            method: 'GET'
        },
        //发送客服消息
        message_custom_send: {
            url: '/cgi-bin/message/custom/send?access_token={access_token}',
            method: 'POST'
        },
        //客服输入状态
        message__custom_typing: {
            url: '/cgi-bin/message/custom/typing?access_token={access_token}',
            method: 'POST'
        }
    }
};

wechat.send = (option, query, body) => {
    query = query || {};
    return new Promise(function (reslove, reject) {
        const https = require('https');
        let opt = {
            host: 'api.weixin.qq.com',
            port: 443,
            path: option.url.replace('{appid}', query.appid || '').replace('{appsecret}', query.appsecret || ''),
            method: 'GET'
        };
        if (option.method.toUpperCase() === 'POST') {
            opt.method = 'POST';
            opt.headers = {
                'Content-Length': Buffer.from(JSON.stringify(body)).length
            };
        }
        var _req = https.request(opt, function (_res) {
            if (_res.statusCode == 200) {
                let responseData = '';
                _res.setEncoding('utf8');
                _res.on('data', function (chunk) {
                    responseData += chunk;
                });
                _res.on('end', function (chunk) {
                    reslove(responseData);
                });
                _res.on('error', function (e) {
                    console.error(e.toText().toError());
                    reslove();
                });
            } else {
                console.warn(`statusCode is not 200,${_res.statusCode.toString()}`.toWarn());
                reslove();
            }
        });
        if (option.method.toUpperCase() === 'POST') {
            // 将参数发出
            _req.write(JSON.stringify(body) + "\n");
        }
        _req.end();
    });
};
exports.wechat = wechat;