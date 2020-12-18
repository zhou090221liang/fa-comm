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


module.exports = {
    checkSignature,
    getAccesstoken,
    getShorturl,
};