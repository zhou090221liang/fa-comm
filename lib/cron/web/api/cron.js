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
    oper: async function (req) {
        const sqlite3 = new comm.sqlite3(req.db);
        let user = req.headers.authorization.split(' ');
        user = JSON.parse(decodeURIComponent(user[1]));
        const isLogin = await userModule.login({
            db: req.db,
            body: user
        });
        if (isLogin && isLogin.error_code == 0 && isLogin.data) {
            if (req.query.action == 'del') {
                return await del(req);
            } else {
                return await cronModule[req.query.action](req.query.id);
            }
        }
        else {
            return new comm.sdk.UnifiedStyleErrorMessage('请先登录');
        }
    },
    /**
     * 详情
     * @param {*} req
     */
    detail: async (req) => {
        const sqlite3 = new comm.sqlite3(req.db);
        let user = req.headers.authorization.split(' ');
        user = JSON.parse(decodeURIComponent(user[1]));
        const isLogin = await userModule.login({
            db: req.db,
            body: user
        });
        if (isLogin && isLogin.error_code == 0 && isLogin.data) {
            const task = await sqlite3.get('select * from cron_config where id = ?', [req.query.id]);
            return new comm.sdk.UnifiedStyleMessage(task);
        }
        else {
            return new comm.sdk.UnifiedStyleErrorMessage('请先登录');
        }
    },
    /**
     * 保存
     * @param {*} req
     */
    save: async (req) => {
        const sqlite3 = new comm.sqlite3(req.db);
        let user = req.headers.authorization.split(' ');
        user = JSON.parse(decodeURIComponent(user[1]));
        const isLogin = await userModule.login({
            db: req.db,
            body: user
        });
        if (isLogin && isLogin.error_code == 0 && isLogin.data) {
            const task = await sqlite3.get('select * from cron_config where id = ?', [req.query.id]);
            if (task && task.status != 0) {
                return new comm.sdk.UnifiedStyleErrorMessage('运行中的任务无法修改');
            }
            let sql = "";
            let params = [];
            if (req.body.id) {
                sql = "update cron_config set name = ?,schedule = ?,exec_path = ?,exec_file = ? where id = ?";
                params = [req.body.name, req.body.schedule, req.body.exec_path, req.body.exec_file, req.body.id];
            } else {
                sql = `\
                    insert into cron_config(\
                        id,status,name,schedule,exec_path,exec_file,create_time\
                    )values(\
                        '${comm.guid.v22}',0,?,?,?,?,'${new Date().Format('yyyy-MM-dd hh:mm:ss')}'\
                    );\
                `;
                params = [req.body.name, req.body.schedule, req.body.exec_path, req.body.exec_file];
            }
            await sqlite3.run(sql, params);
            return new comm.sdk.UnifiedStyleMessage();
        }
        else {
            return new comm.sdk.UnifiedStyleErrorMessage('请先登录');
        }
    },
    /**
     * 运行详情
     * @param {*} req
     */
    run: async (req) => {
        const sqlite3 = new comm.sqlite3(req.db);
        let user = req.headers.authorization.split(' ');
        user = JSON.parse(decodeURIComponent(user[1]));
        const isLogin = await userModule.login({
            db: req.db,
            body: user
        });
        if (isLogin && isLogin.error_code == 0 && isLogin.data) {
            const task = await sqlite3.all('select * from cron_instance where cron_id = ? order by start_time desc limit 20', [req.query.id]);
            return new comm.sdk.UnifiedStyleMessage(task);
        }
        else {
            return new comm.sdk.UnifiedStyleErrorMessage('请先登录');
        }
    },
};

/**
 * 删除
 * @param {*} req
 */
const del = async (req) => {
    const sqlite3 = new comm.sqlite3(req.db);
    let user = req.headers.authorization.split(' ');
    user = JSON.parse(decodeURIComponent(user[1]));
    const isLogin = await userModule.login({
        db: req.db,
        body: user
    });
    if (isLogin && isLogin.error_code == 0 && isLogin.data) {
        const task = await sqlite3.get('select * from cron_config where id = ?', [req.query.id]);
        if (task && task.status != 0) {
            return new comm.sdk.UnifiedStyleErrorMessage('运行中的任务无法删除');
        }
        await sqlite3.run("delete from cron_config where id = ?", [req.query.id]);
        return new comm.sdk.UnifiedStyleMessage();
    }
    else {
        return new comm.sdk.UnifiedStyleErrorMessage('请先登录');
    }
}