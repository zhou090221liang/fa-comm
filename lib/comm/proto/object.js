require('../proto');
const verify = require('../verify');

Object.prototype.toText = Object.prototype.toStr = function () {
    if (this == void 0 || verify.isString(this)) {
        return this || '';
    }
    if (verify.isJsonOrJsonArray(this))
        return JSON.stringify(this);
    else if (verify.isError(this))
        return this.stack || (this.message || '');
    else if (verify.isArray(this)) {
        let arr = new Array();
        for (var i in this) {
            arr.push(toString(i));
        }
        return '[' + arr.join(',') + ']';
    }
    else if (verify.isDate(this))
        return this.format('yyyy-MM-dd hh:mm:ss');
    else {
        return this.toString();
    }
}