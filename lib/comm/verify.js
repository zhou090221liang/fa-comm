require('./proto');

/**
 * 是否首层JSON
 * @param {*} obj
 * @returns
 */
const isFirstJson = (obj) => {
    return typeof (obj) == "object" && Object.prototype.toString.call(obj).toLowerCase() == "[object object]" && !obj.length;
}
exports.isFirstJson = isFirstJson;

/**
 * 是否JSON对象
 * @returns
 */
const isJson = (json) => {
    // let r = isFirstJson(json);
    // if (!r)
    //     return false;
    // for (let key in json) {
    //     r = isJsonOrJsonArray(json[key]) || isString(json[key]);
    //     if (!r)
    //         return false;
    // }
    // return true;

    // if (typeof json == 'object') {
    //     try {
    //         json = JSON.stringify(json);
    //         return true;
    //     } catch (e) {
    //         return false;
    //     }
    // }
    // return false;

    // return typeof (json) == "object" && Object.prototype.toString.call(json).toLowerCase() == "[object object]" && !json.length;

    try {
        const obj = Object.assign({}, json, {});
        if (typeof (obj) == "object" && Object.prototype.toString.call(obj).toLowerCase() == "[object object]") {
            const keys = Object.keys(obj);
            if (keys.find(item => item == 'length')) {
                delete obj.length;
            }
            if (!obj.length) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    } catch (e) {
        return false;
    }
};
exports.isJson = isJson;

/**
 * 是否数组对象
 * @returns
 */
const isArray = (obj) => {
    return obj instanceof Array;
};
exports.isArray = isArray;

/**
 * 是否JSON对象数组
 * @returns
 */
const isJsonArray = (obj) => {
    if (isArray(obj)) {
        for (let o of obj) {
            if (!isJson(o) && !isJsonArray(o)) {
                return false;
            }
        }
        return true;
    } else {
        return false;
    }
};
exports.isJsonArray = isJsonArray;

/** 
 * 是否JSON对象或JSON对象数组
 * @returns
*/
const isJsonOrJsonArray = (obj) => {
    return isJson(obj) || isJsonArray(obj);
};
exports.isJsonOrJsonArray = isJsonOrJsonArray;

/**
 * 是否Object对象
 * @returns
 */
const isObject = (obj) => {
    return obj instanceof Object;
};
exports.isObject = isObject;

/**
 * 是否是Error对象
 * @returns
 */
const isError = (obj) => {
    return obj instanceof Error;
};
exports.isError = isError;

/**
 * 是否是字符串
 * @returns
 */
const isString = (obj) => {
    return typeof obj == 'string';
};
exports.isString = isString;

/**
 * 是否是数字
 * @returns
 */
const isNumber = (obj) => {
    return !isNaN(obj.toString());
};
exports.isNumber = isNumber;

/**
 * 是否Date类型
 * @returns
 */
const isDate = (obj) => {
    return obj instanceof Date;
};
exports.isDate = isDate;

/**
 * 校验中国公民身份证号码
 * @param {*} idcard
 * @returns
 */
function isChineseCitizenIdCardNumber(idcard) {
    if (!idcard) {
        return { errcode: 1, errmsg: '身份证号码位数不对' };
    }
    var area = {
        11: "北京",
        12: "天津",
        13: "河北",
        14: "山西",
        15: "内蒙古",
        21: "辽宁",
        22: "吉林",
        23: "黑龙江",
        31: "上海",
        32: "江苏",
        33: "浙江",
        34: "安徽",
        35: "福建",
        36: "江西",
        37: "山东",
        41: "河南",
        42: "湖北",
        43: "湖南",
        44: "广东",
        45: "广西",
        46: "海南",
        50: "重庆",
        51: "四川",
        52: "贵州",
        53: "云南",
        54: "西藏",
        61: "陕西",
        62: "甘肃",
        63: "青海",
        64: "宁夏",
        65: "xingjiang",
        71: "台湾",
        81: "香港",
        82: "澳门",
        91: "国外"
    }
    var Y, JYM, ereg;
    var S, M;
    var idcard_array = new Array();
    idcard_array = idcard.split("");
    //地区检验
    if (area[parseInt(idcard.substr(0, 2))] == null)
        return { errcode: 4, errmsg: '身份证地区非法' };
    //身份号码位数及格式检验
    switch (idcard.length) {
        case 15:
            if ((parseInt(idcard.substr(6, 2)) + 1900) % 4 == 0 || ((parseInt(idcard.substr(6, 2)) + 1900) % 100 == 0 && (parseInt(idcard.substr(6, 2)) + 1900) % 4 == 0)) {
                ereg = /^[1-9][0-9]{5}[0-9]{2}((01|03|05|07|08|10|12)(0[1-9]|[1-2][0-9]|3[0-1])|(04|06|09|11)(0[1-9]|[1-2][0-9]|30)|02(0[1-9]|[1-2][0-9]))[0-9]{3}$/; //测试出生日期的合法性
            } else {
                ereg = /^[1-9][0-9]{5}[0-9]{2}((01|03|05|07|08|10|12)(0[1-9]|[1-2][0-9]|3[0-1])|(04|06|09|11)(0[1-9]|[1-2][0-9]|30)|02(0[1-9]|1[0-9]|2[0-8]))[0-9]{3}$/; //测试出生日期的合法性
            }
            if (ereg.test(idcard))
                return { errcode: 0, errmsg: '成功' };
            else
                return { errcode: 2, errmsg: '身份证号码出生日期超出范围或含有非法字符' };
        case 18:
            //18位身份号码检测
            //出生日期的合法性检查
            //闰年月日:((01|03|05|07|08|10|12)(0[1-9]|[1-2][0-9]|3[0-1])|(04|06|09|11)(0[1-9]|[1-2][0-9]|30)|02(0[1-9]|[1-2][0-9]))
            //平年月日:((01|03|05|07|08|10|12)(0[1-9]|[1-2][0-9]|3[0-1])|(04|06|09|11)(0[1-9]|[1-2][0-9]|30)|02(0[1-9]|1[0-9]|2[0-8]))
            if (parseInt(idcard.substr(6, 4)) % 4 == 0 || (parseInt(idcard.substr(6, 4)) % 100 == 0 && parseInt(idcard.substr(6, 4)) % 4 == 0)) {
                ereg = /^[1-9][0-9]{5}19[0-9]{2}((01|03|05|07|08|10|12)(0[1-9]|[1-2][0-9]|3[0-1])|(04|06|09|11)(0[1-9]|[1-2][0-9]|30)|02(0[1-9]|[1-2][0-9]))[0-9]{3}[0-9Xx]$/; //闰年出生日期的合法性正则表达式
            } else {
                ereg = /^[1-9][0-9]{5}19[0-9]{2}((01|03|05|07|08|10|12)(0[1-9]|[1-2][0-9]|3[0-1])|(04|06|09|11)(0[1-9]|[1-2][0-9]|30)|02(0[1-9]|1[0-9]|2[0-8]))[0-9]{3}[0-9Xx]$/; //平年出生日期的合法性正则表达式
            }
            if (ereg.test(idcard)) { //测试出生日期的合法性
                //计算校验位
                S = (parseInt(idcard_array[0]) + parseInt(idcard_array[10])) * 7 +
                    (parseInt(idcard_array[1]) + parseInt(idcard_array[11])) * 9 +
                    (parseInt(idcard_array[2]) + parseInt(idcard_array[12])) * 10 +
                    (parseInt(idcard_array[3]) + parseInt(idcard_array[13])) * 5 +
                    (parseInt(idcard_array[4]) + parseInt(idcard_array[14])) * 8 +
                    (parseInt(idcard_array[5]) + parseInt(idcard_array[15])) * 4 +
                    (parseInt(idcard_array[6]) + parseInt(idcard_array[16])) * 2 +
                    parseInt(idcard_array[7]) * 1 +
                    parseInt(idcard_array[8]) * 6 +
                    parseInt(idcard_array[9]) * 3;
                Y = S % 11;
                M = "F";
                JYM = "10X98765432";
                M = JYM.substr(Y, 1); //判断校验位
                if (M == idcard_array[17])
                    return { errcode: 0, errmsg: '成功' }; //检测ID的校验位
                else
                    return { errcode: 3, errmsg: '身份证号码校验位错误' };
            } else
                return { errcode: 2, errmsg: '身份证号码出生日期超出范围或含有非法字符' };
        default:
            return { errcode: 1, errmsg: '身份证号码位数不对' };
    }
}
exports.isChineseCitizenIdCardNumber = isChineseCitizenIdCardNumber;

const verificationWui = function (wui) {
    const result = wui.decrypt();
    //[expire_wui]60[/expire_wui][data]{"nickname":"zhou","sex":0}[/data][ts]12345678[/ts]'
    if (
        result.indexOf('[expire_wui]') > -1 && result.indexOf('[/expire_wui]') > -1 &&
        result.indexOf('[ts]') > -1 && result.indexOf('[/ts]') > -1 &&
        result.indexOf('[data]') > -1 && result.indexOf('[/data]') > -1
    ) {
        //微信用户信息有效期校验
        let expire_wui = result.substr(result.indexOf('[expire_wui]') + 12);
        expire_wui = expire_wui.substr(0, expire_wui.indexOf('[/expire_wui]'));
        let ts = result.substr(result.indexOf('[ts]') + 4);
        ts = ts.substr(0, ts.indexOf('[/ts]'));
        let data = result.substr(result.indexOf('[data]') + 6);
        data = data.substr(0, data.indexOf('[/data]'));
        if (new Date().valueOf() - parseInt(ts) > parseInt(expire_wui) * 1000) {
            return false;
        } else {
            return data;
        }
    } else {
       return result;
    }
}
exports.verificationWui = verificationWui;