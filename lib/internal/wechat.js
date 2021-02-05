const fac = require('../../index');
const p_wechat = require('./private/wechat');
const log = fac.createLog('wechat');
const path = require('path');
const fs = require('fs');

/** 
 * Wechat操作类
*/
let Wechat = class {
    /** 
     * Wechat对象构造函数
     * @param {JSON} account 账号
     * @param {String} conf 配置项
     */
    constructor(account, conf) {
        this.account_info = account;
        this.basic = {
            accesstoken: async (body) => { const result = await getAccessToken(this); return result; }
        };
        this.account = {
            shorturl: async (body) => { const result = await getShorturl(this, body.url); return result; }
        };
        this.oauth = {
            url: async (body) => { const result = await getOauthUrl(this, body.url, body.type); return result; },
            user: async (body) => { const result = await getUserByCode(this, body.code); return result; },
        };
    };
};

/**
 * 获取AccessToken
 * @param {*} options
 * @returns
 */
async function getAccessToken(options) {
    //读取文件获取
    let accesstoken;
    const file = path.join(__filename, '../' + options.account_info.account_id + '.at');
    if (fs.existsSync(file)) {
        accesstoken = JSON.parse(fs.readFileSync(file).toString().decrypt());
        if (new Date(accesstoken.access_token_expires_in).valueOf() < new Date().valueOf()) {
            fs.unlinkSync(file);
            accesstoken = null;
        }
    }
    if (!accesstoken) {
        const access_token = await p_wechat.getAccesstoken(options.account_info.appid, options.account_info.appsecret);
        if (access_token && access_token.access_token) {
            log.info("从微信服务器拿到Token：", access_token.access_token);
            accesstoken = {
                access_token: access_token.access_token,
                access_token_expires_in: new Date((new Date()).valueOf() + (access_token.expires_in * 1000) - 300000).Format('yyyy-MM-dd hh:mm:ss')
            };
            fs.writeFileSync(file, JSON.stringify(accesstoken).encrypt());
        } else {
            log.info("从微信服务器拿到Token：", access_token.access_token);
            accesstoken = {
                access_token: ''
            };
        }
    }
    return accesstoken.access_token;
}

/**
 * 获取Oauth2.0授权地址
 * @param {*} options
 * @returns
 */
async function getOauthUrl(options, url = '', type = 'snsapi_base') {
    log.info(`需要Oauth授权的地址：${url}`);
    url = url.encrypt();
    let serverUrl = `http://${options.account_info.oauth_url}/oauth/redirect?base_url=${encodeURIComponent(url)}`;
    log.info(`oauth解析地址：${serverUrl}`);
    const long_url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${options.account_info.appid}&redirect_uri=${encodeURIComponent(serverUrl)}&response_type=code&scope=${type || "snsapi_base"}&state=${options.account_info.account_id}#wechat_redirect`;
    log.info(`获取Oauth2.0授权地址:`, long_url);
    const short_url = await getShorturl(options, long_url);
    log.info(`获取Oauth2.0授权短地址:`, short_url);
    return short_url;
}

/**
 * 长地址转短地址
 * @param {*} options
 * @returns
 */
async function getShorturl(options, long_url) {
    const accesstoken = await options.basic.accesstoken();
    const short_url = await p_wechat.getShorturl(accesstoken, long_url);
    log.info(`长地址转短地址:`, short_url);
    return short_url && short_url.short_url ? short_url.short_url : "";
}

/**
 * 根据code获取user
 * @param {*} options
 * @returns
 */
async function getUserByCode(options, code) {
    let result = await p_wechat.getUserByCode(options.account_info, code);
    return result;
}

module.exports = Wechat;