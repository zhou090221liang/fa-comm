require('./proto');
const req = require('./req');
const ip = require('./ip');
const convert = require('./convert');
module.exports = live = {};

/**
 * 获取天气
 * @param {*} city 城市名称 默认当前城市(根据公网IP判断)
 * @returns
 */
live.getWeater = function (city) {
    return new Promise(function (resolve, reject) {
        if (city) {
            req.requesturl('http://apis.juhe.cn/simpleWeather/query?key=87205efa1588c4e5ec8bfc9a26bd4ada&city=' + encodeURIComponent(city)).then(function (data) {
                data = convert.toJson(data);
                data && data.error_code === 0 ? resolve(data.result) : reject(data.reason);
            }).catch(err => reject(err));
        }
        else {
            ip.info().then(function (city) {
                city = city.public.area.City.substr(0, city.public.area.City.lastIndexOf('市'));
                req.requesturl('http://apis.juhe.cn/simpleWeather/query?key=87205efa1588c4e5ec8bfc9a26bd4ada&city=' + encodeURIComponent(city)).then(function (data) {
                    data = convert.toJson(data);
                    data && data.error_code === 0 ? resolve(data.result) : reject(data.reason);
                }).catch(err => reject(err));
            }).catch(err => reject(err));
        }
    });
}

/**
 * 获取黄历
 * @param {String} date 日期 默认当天 yyyy-MM-dd
 * @returns
 */
live.getHuangLi = function (date) {
    date = date || new Date().Format('yyyy-MM-dd');
    return new Promise(function (resolve, reject) {
        req.requesturl("http://v.juhe.cn/laohuangli/d?date=" + date + "&key=f2d6b099eef5ab9040c1ab78dc1d66cc").then(function (data) {
            data = convert.toJson(data);
            data && data.error_code === 0 ? resolve(data.result) : reject(data.reason);
        }).catch(err => reject(err));
    });
}