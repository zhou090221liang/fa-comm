const comm = require('../../../index');

module.exports = async (req) => {
    if (req.path.startWith('/admin/')) {
        if (!req.headers['token']) {
            return new comm.sdk.UnifiedStyleMessage(null, 100, '请先登录');
        }
    }
};