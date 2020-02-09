const verify = require('./verify');

module.exports = {
    /** 
     * 统一样式消息
    */
    UnifiedStyleMessage: class {
        /** 
         * 构造方法
         * @param {*} data 数据
         * @param {Number} error_code 数据
         * @param {String} error_message 数据
        */
        constructor(data, error_code, error_message) {
            if (verify.isError(data)) {
                this.data = null;
                this.error_code = e.code || (e.errcode || 500);
                this.error_message = e.stack || e.message;
            } else {
                this.data = data || null;
                this.error_code = error_code || 0;
                this.error_message = error_message || null;
            }
        }
    }
};