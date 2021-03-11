require('./proto');
const verify = require('./verify');
const fs = require('fs');
const iconv = require('iconv-lite');
const cheerio = require('cheerio');
const xml2json = require('xml2json');

/**
 * 转JSON对象
 * @param {*} obj
 */
const toJson = (obj) => {
    if (!obj) {
        return {};
    }
    if (verify.isJsonOrJsonArray(obj)) {
        return obj;
    }
    let result = {};
    try {
        result = JSON.parse(obj);
    } catch (ex) {
        result = obj;
    }
    return result;
};
exports.toJson = toJson;

/**
 * 将Api请求包尝试转成JSON格式
 * @param {*} data
 * @returns
 */
const requestData2Json = function (data) {
    let body;
    try {
        body = xml2json.toJson(data);
        body = JSON.parse(body).xml;
    } catch (e) { }
    try {
        body = JSON.parse(data);
    } catch (e) { }
    return body || "";
}
exports.requestData2Json = requestData2Json;

/**
 * 将JSON对象的key从驼峰转换成下划线命名
 * @param {*} json
 * @returns
 */
const toLineJsonKey = (json) => {
    if (!verify.isJson(json)) {
        return json;
    }
    let tmp = {};
    for (let key in json) {
        if (!verify.isJson(json[key])) {
            tmp[key.toLine()] = json[key];
        } else {
            tmp[key.toLine()] = toLineJsonKey(json[key]);
        }
    }
    return tmp;
}
exports.toLineJsonKey = toLineJsonKey;

/**
 * 将JSON对象的key从下划线转换成驼峰命名
 * @param {*} json
 * @returns
 */
const toHumpJsonKey = (json) => {
    if (!verify.isJson(json)) {
        return json;
    }
    let tmp = {};
    for (let key in json) {
        if (!verify.isJson(json[key])) {
            tmp[key.toHump()] = json[key];
        } else {
            tmp[key.toHump()] = toHumpJsonKey(json[key]);
        }
    }
    return tmp;
}
exports.toHumpJsonKey = toHumpJsonKey;

/**
 * 将秒数转换成00:00:00格式
 * @param {*} s
 * @returns
 */
const arrive_timer_format = function (s) {
    var t;
    if (s > -1) {
        hour = Math.floor(s / 3600);
        min = Math.floor(s / 60) % 60;
        sec = s % 60;
        day = parseInt(hour / 24);
        if (day > 0) {
            hour = hour - 24 * day;
            t = day + "day " + hour + ":";
        }
        else t = hour + ":";
        if (min < 10) { t += "0"; }
        t += min + ":";
        sec = parseInt(sec.toFixed(0));
        if (sec < 10) { t += "0"; }
        t += sec;
    }
    return t;
}
exports.arrive_timer_format = arrive_timer_format;

/**
 * Callback 接口变成 Promise 接口
 * var readFilePromise = promisify(fs.readFile, fs);
 * @param {*} fn
 * @param {*} receiver
 * @returns
 */
const promisify = (fn, receiver) => {
    return (...args) => {
        return new Promise((resolve, reject) => {
            fn.apply(receiver, [...args, (err, res) => {
                return err ? reject(err) : resolve(res);
            }]);
        });
    };
};
exports.promisify = promisify;

/**
 * 合并JSON对象
 * @param {JSON} json
 */
const combineJson = (...json) => {
    if (json.length < 2) {
        return json[0];
    }
    let result = {};
    for (let i = 0; i < json.length; i++) {
        // if (json[i]) {
        // if (verify.isJson(json[i])) {
        //     combineJson(result, json[i]);
        // } else {

        // }
        // }
        for (const key in json[i]) {
            if (result[key]) {
                if (verify.isJson(json[i][key])) {
                    result[key] = combineJson(result[key], json[i][key]);
                } else {
                    result[key] = json[i][key];
                }
            } else {
                result[key] = json[i][key];
            }
        }
    }
    return result;
};
exports.combineJson = combineJson;

/**
 * 扩展toString
 * @param {*} obj
 * @returns
 */
const toString = (obj) => {
    if (obj == void 0 || verify.isString(obj)) {
        return obj || '';
    } if (verify.isError(obj)) {
        return obj.stack || (obj.message || '');
    } else if (verify.isJsonOrJsonArray(obj)) {
        let r;
        try {
            r = JSON.stringify(obj);
        } catch (e) {
            r = obj.toString();
        }
        return r;
    }
    else if (verify.isArray(obj)) {
        return '[' + obj.join(',') + ']';
    }
    else if (verify.isDate(obj))
        return obj.format('yyyy-MM-dd hh:mm:ss');
    else {
        return obj.toString();
    }
}
exports.toString = toString;

/** 
 * 将字节大小转换成直观的单位显示
*/
const sizeFormat = (bytes, minKB = true) => {
    if (isNaN(bytes)) {
        return '';
    }
    var symbols = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var exp = Math.floor(Math.log(bytes) / Math.log(2));
    if (exp < 1) {
        exp = 0;
    }
    var i = Math.floor(exp / 10);
    if (i < symbols.length) {
        bytes = bytes / Math.pow(2, 10 * i);
        if (bytes.toString().length > bytes.toFixed(2).toString().length) {
            bytes = bytes.toFixed(2);
        }
        if (bytes >= 1000) {
            bytes = parseFloat(bytes / 1024).toFixed(2);
            i += 1;
        }
        if (i == 0 && minKB) {
            i += 1;
            bytes = parseFloat(bytes / 1024).toFixed(2);
            bytes = bytes != '0.00' ? bytes : '0.01';
        }
        return bytes + symbols[i];
    } else {
        i = symbols.length - 1;
        bytes = bytes / Math.pow(2, 10 * i);
        if (bytes.toString().length > bytes.toFixed(2).toString().length) {
            bytes = bytes.toFixed(2);
        }
        return bytes + symbols[i];
    }
}
exports.sizeFormat = sizeFormat;

/**
 * 图片转Base64
 * @param {*} picturePath
 * @returns
 */
const pictureToBase64 = (picturePath) => {
    let bitmap = fs.readFileSync(picturePath);
    let base64str = Buffer.from(bitmap, 'binary').toString('base64');
    return base64str;
}
exports.pictureToBase64 = pictureToBase64;

/**
 * 将HTML文本转换成Jquery对象
 * @param {*} html
 * @param {string} [encoding='utf-8']
 * @returns
 */
const toJquery = (html, encoding = 'utf-8') => {
    const buf = iconv.decode(html, encoding);
    return cheerio.load(buf);
}
exports.toJQ = toJquery;
exports.toJquery = toJquery;