// const setting = require('../../setting');
const comm = require('../../../index');
// const mysql = comm.createMysqlConn(setting.mysql);

module.exports = {
    list: async (req) => {
        // const sql = "select 1 id,'张三' name from dual limit 1;";
        // const result = await mysql.query(sql);
        // return new comm.sdk.UnifiedStyleMessage(result);
        return new comm.sdk.UnifiedStyleMessage([]);
    },
    detail: async (req) => {
        // const id = req.params.id;
        // const sql = "select 1 id,'张三' name from dual limit 1;";
        // const result = await mysql.query(sql);
        // return new comm.sdk.UnifiedStyleMessage(result[0]);

        return new comm.sdk.UnifiedStyleMessage({});
    },
    add: async (req) => {
        const user = req.body;
        user.id = comm.guid.v22;
        return new comm.sdk.UnifiedStyleMessage(user.id);
    },
};