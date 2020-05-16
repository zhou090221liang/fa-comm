const verify = require('./verify');

module.exports = {
    /** 
     * 统一样式消息
    */
    UnifiedStyleMessage: class {
        /** 
         * 构造方法
         * @param {*} data 数据，可以是error对象，这样默认返回错误信息
         * @param {Number} error_code 错误代码，默认0
         * @param {String} error_message 错误消息，默认null
        */
        constructor(data, error_code, error_message) {
            if (verify.isError(data)) {
                this.data = null;
                this.error_code = data.code || (data.errcode || 500);
                this.error_message = data.stack || data.message;
            } else {
                this.data = data != undefined ? data : null;
                this.error_code = error_code || 0;
                this.error_message = error_message || null;
            }
        }
    },
    /** 
     * 统一样式错误消息
    */
    UnifiedStyleErrorMessage: class {
        /** 
         * 构造方法
         * @param {String} error_message 错误消息
         * @param {Number} error_code 错误代码，默认500
        */
        constructor(error_message = "ERROR", error_code = 500) {
            this.data = null;
            this.error_code = error_code || 500;
            this.error_message = error_message || 'ERROR';
        }
    }
};