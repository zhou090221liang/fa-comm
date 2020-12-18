const req = require('../../comm/req');
const crypto = require('crypto');

const host = 'https://api.weixin.qq.com';

/**
 * 验证微信签名
 * @param {*} signature
 * @param {*} timestamp
 * @param {*} nonce
 * @param {*} token
 * @returns
 */
const checkSignature = (signature, timestamp, nonce, token) => {
    let shasum = crypto.createHash('sha1');
    let arr = [token, timestamp, nonce].sort();
    shasum.update(arr.join(''));
    return shasum.digest('hex') === signature;
}

/**
 * 获取accessToken
 * @param {*} appid
 * @param {*} appsecret
 */
const getAccesstoken = async (appid, appsecret) => {
    let result = await req.requesturl(`${host}/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${appsecret}`);
    if (typeof result == 'string') {
        result = JSON.parse(result);
    }
    return result;
};

/**
 * 长地址转短地址
 * @param {*} accesstoken
 * @param {*} long_url
 */
const getShorturl = async (accesstoken, long_url) => {
    let result = await req.request({
        method: 'post',
        url: `${host}/cgi-bin/shorturl?access_token=${accesstoken}`,
        data: {
            action: 'long2short',
            long_url
        }
    });
    if (typeof result.body == 'string') {
        return JSON.parse(result.body);
    }
    return result.body;
};

/**
 * 根据code获取用户信息
 * @param {*} account
 * @param {*} long_url
 */
const getUserByCode = async (account, code) => {
    let result = await req.request({
        method: 'get',
        url: `${host}/sns/oauth2/access_token?appid=${account.appid}&secret=${account.appsecret}&code=${code}&grant_type=authorization_code`
    });
    if (typeof result.body == 'string') {
        result = JSON.parse(result.body);
    }
    /*{
        "access_token":"",
        "expires_in":7200,
        "refresh_token":"",
        "openid":"oai-rt55PEUJf7tLjojhfB1Gz0YU",
        "scope":"snsapi_base"
    }*/
    /*{
        "access_token":"-",
        "expires_in":7200,
        "refresh_token":"40_-",
        "openid":"oai-rt55PEUJf7tLjojhfB1Gz0YU",
        "scope":"snsapi_userinfo",
        "unionid":"oEc8Ywc44lsemfb0os2qgIAHsvJg"
    }*/
    if (result.access_token && result.scope == "snsapi_base") {
        return {
            "openid": result.openid
        };
    }
    if (result.access_token && result.scope == "snsapi_userinfo") {
        result = await req.request({
            method: 'get',
            url: `${host}/sns/userinfo?access_token=${result.access_token}&openid=${result.openid}&lang=zh_CN`
        });
        if (typeof result.body == 'string') {
            result = JSON.parse(result.body);
        }
        if (result && result.openid) {
            return result;
        } else {
            return {
                "openid": ""
            };
        }
    }
    return {
        "openid": ""
    };
};

module.exports = {
    checkSignature,
    getAccesstoken,
    getShorturl,
    getUserByCode,
};