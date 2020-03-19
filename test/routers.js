/** 
 * 路由定义文件
*/
const comm = require('../index');

module.exports = {
    get: {
        '/': function (req) {
            return 'OK';
        }
    },
    post: {
    }
};