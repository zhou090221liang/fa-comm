const setting = require('../../setting');
const comm = require('../../../index');
const mysql = comm.createMysqlConn(setting.mysql);

module.exports = {
    list: async (data) => {
        const sql = "select 1 id,'张三' name from dual limit 1;";
        const result = await mysql.query(sql);
        return new comm.sdk.UnifiedStyleMessage(result);
    }
};