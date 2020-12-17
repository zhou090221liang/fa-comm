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


module.exports = {
    getAccesstoken,
    checkSignature
};