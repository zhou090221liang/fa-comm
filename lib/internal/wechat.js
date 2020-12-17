const fac = require('../../index');
const p_wechat = require('./private/wechat');

/** 
 * Wechat操作类
*/
let Wechat = class {
    /** 
     * Wechat对象构造函数
     * @param {JSON} account 账号
     * @param {String} sqlite3file 数据存储位置
     */
    constructor(account, sqlite3file) {
        this.account = account;
        this.sqlite3file = sqlite3file;
        this.sqlite3 = new fac.sqlite3(sqlite3file, false);
        /**
         * 获取AccessToken
         * @returns
         */
        this.getAccessToken = async () => { const result = await getAccessToken(this); return result };
    };
};

/**
 * 获取AccessToken
 * @param {*} options
 * @returns
 */
async function getAccessToken(options) {
    const result = await options.sqlite3.all(`select * from wechat where account_id = '${options.account.account_id}' and access_token_expires_in >= datetime(CURRENT_TIMESTAMP,'localtime')`);
    if (result && result.length) {
        return result.length[0].access_token;
    }
    const access_token = await p_wechat.getAccesstoken(options.account.appid, options.account.appsecret);
    if (access_token && access_token.access_token) {
        await options.sqlite3.run(`update wechat set access_token = '${access_token.access_token}',access_token_expires_in = '${new Date((new Date()).valueOf() + (access_token.expires_in * 1000) - 300000).Format('yyyy-MM-dd hh:mm:ss')}' where account_id = '${options.account.account_id}'`);
        return access_token.access_token;
    }
    return '';
}

module.exports = Wechat;