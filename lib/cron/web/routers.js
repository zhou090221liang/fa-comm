/** 
 * 路由定义文件
*/
const comm = require('../../../index');
const path = require('path');
const api = comm.service.analyzing(path.join(__dirname, './api'));

module.exports = {
    get: {
        '/api/cron/list': api.cron.list,
        //操作 参数 ?action=start/stop/once&id=xxx
        '/api/cron/oper': api.cron.oper,
    },
    post: {
        '/api/user/login': api.user.login,
        '/api/user/change/password': api.user.change_pwd,
        //新增/修改
        '/api/cron/save': api.cron.save,
    }
};