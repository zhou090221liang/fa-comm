const comm = require('../../../../index');
const userModule = require('./user');
const cronModule = require('../../service/index');

module.exports = {
    /**
     * 列表
     * @param {*} req
     */
    list: async (req) => {
        const sqlite3 = new comm.sqlite3(req.db);
        let user = req.headers.authorization.split(' ');
        user = JSON.parse(decodeURIComponent(user[1]));
        const isLogin = await userModule.login({
            db: req.db,
            body: user
        });
        if (isLogin && isLogin.error_code == 0 && isLogin.data) {
            const sql = "select * from cron_config";
            const list = await sqlite3.all(sql);
            return new comm.sdk.UnifiedStyleMessage(list);
        }
        else {
            return new comm.sdk.UnifiedStyleErrorMessage('请先登录');
        }
    },
    /**
     * 操作
     * @param {*} req
     */
    oper: async (req) => {
        const sqlite3 = new comm.sqlite3(req.db);
        let user = req.headers.authorization.split(' ');
        user = JSON.parse(decodeURIComponent(user[1]));
        const isLogin = await userModule.login({
            db: req.db,
            body: user
        });
        if (isLogin && isLogin.error_code == 0 && isLogin.data) {
            return await cronModule[req.query.action](req.query.id);
        }
        else {
            return new comm.sdk.UnifiedStyleErrorMessage('请先登录');
        }
    },
};