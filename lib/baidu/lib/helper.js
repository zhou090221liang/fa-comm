const fs = require('fs');
const path = require('path');
const req = require('../../comm/req');
require('../../comm/proto/string');

module.exports = {
    /**
     * 读取Access Token
     * @param {boolean} [refresh=false] 是否强制刷新，用于AccessToken过期的情况
     * @returns
     */
    getAccessToken: async function (conf, refresh = false) {
        try {
            const fpath = path.join(__dirname, '../' + encodeURIComponent(conf.client_id) + '.accesstoken');
            if (!fs.existsSync(fpath) || refresh) {
                let access_token = await req.request({
                    url: 'https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=' + conf.client_id + '&client_secret=' + conf.client_secret
                });
                fs.writeFileSync(fpath, JSON.parse(access_token.body).access_token.encrypt());
            }
            return fs.readFileSync(fpath).toString().decrypt();
        } catch (e) {
            console.error("获取百度AccessToken异常：", e);
            return "";
        }
    }
};