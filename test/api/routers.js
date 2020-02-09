/** 
 * 路由定义文件
*/
const comm = require('../../index');
const path = require('path');
const admin = comm.service.analyzing(path.join(__dirname, './admin'));

module.exports = {
    get: {
        '/admin/user/list': admin.user.list,
        '/admin/user/detail/:id': admin.user.detail,
    },
    post: {
        '/admin/user/add': admin.user.add
    }
};