require('./proto');
const verify = require('./verify');

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
    if (result.toStr && typeof result.toStr === 'function') {
        delete result.toStr;
    }
    if (result.toText && typeof result.toText === 'function') {
        delete result.toText;
    }
    return result;
};
exports.combineJson = combineJson;