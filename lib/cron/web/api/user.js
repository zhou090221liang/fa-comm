const comm = require('../../../../index');

module.exports = {
    /**
     * 用户登录
     * @param {*} req req.body.loginid, req.body.loginpwd
     */
    login: async (req) => {
        const sqlite3 = new comm.sqlite3(req.db);
        const sql = "select * from cron_user where loginid = ? and loginpwd = ?";
        const user = await sqlite3.get(sql, [req.body.loginid, req.body.loginpwd]);
        if (user) {
            delete user.loginpwd;
        }
        return new comm.sdk.UnifiedStyleMessage(user || null);
    },
    /**
     * 修改密码
     * @param {*} req req.body.loginid, req.body.oldloginpwd, req.body.loginid, req.body.loginpwd
     * @returns
     */
    change_pwd: async (req) => {
        const sqlite3 = new comm.sqlite3(req.db);
        let sql = "select * from cron_user where loginid = ? and loginpwd = ?";
        const user = await sqlite3.get(sql, [req.body.loginid, req.body.oldloginpwd]);
        if (!user) {
            return new comm.sdk.UnifiedStyleErrorMessage('用户不存在或原始密码错误');
        }
        sql = "update cron_user set is_change = 1,loginpwd = ? where loginid = ?";
        await sqlite3.run(sql, [req.body.loginpwd, req.body.loginid]);
        return new comm.sdk.UnifiedStyleMessage();
    }
};