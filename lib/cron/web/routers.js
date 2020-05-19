/** 
 * 路由定义文件
*/
const comm = require('../../../index');
const path = require('path');
const api = comm.service.analyzing(path.join(__dirname, './api'));

module.exports = {
    get: {
        '/api/cron/list': api.cron.list,
        '/api/cron/oper': api.cron.oper,
        '/api/cron/detail': api.cron.detail,
        '/api/cron/run/info': api.cron.run,
    },
    post: {
        '/api/user/login': api.user.login,
        '/api/user/change/password': api.user.change_pwd,
        '/api/cron/save': api.cron.save,
    }
};