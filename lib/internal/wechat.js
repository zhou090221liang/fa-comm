const fac = require('../../index');
const p_wechat = require('./private/wechat');
const log = fac.createLog('fa-comm.wechat');

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
        this.sqlite3file = conf.sqlite3file;
        this.sqlite3 = new fac.sqlite3(conf.sqlite3file, false);
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
    const result = await options.sqlite3.all(`select * from wechat where account_id = '${options.account_info.account_id}' and access_token_expires_in >= '${new Date().Format('yyyy-MM-dd hh:mm:ss')}'`);
    if (result && result.length) {
        log.info("从缓存中拿到Token：", result[0].access_token);
        return result[0].access_token;
    }
    const access_token = await p_wechat.getAccesstoken(options.account_info.appid, options.account_info.appsecret);
    if (access_token && access_token.access_token) {
        log.info("从微信服务器拿到Token：", access_token.access_token);
        await options.sqlite3.run(`update wechat set access_token = '${access_token.access_token}',access_token_expires_in = '${new Date((new Date()).valueOf() + (access_token.expires_in * 1000) - 300000).Format('yyyy-MM-dd hh:mm:ss')}' where account_id = '${options.account.account_id}'`);
        return access_token.access_token;
    }
    log.info("拿Token失败!!!");
    return '';
}

/**
 * 获取Oauth2.0授权地址
 * @param {*} options
 * @returns
 */
async function getOauthUrl(options, url = '', type = 'snsapi_base') {
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
    let result = await p_wechat.getUserByCode(options.account_info,code);
    return result;
}

module.exports = Wechat;