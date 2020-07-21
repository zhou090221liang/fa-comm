const ocr = require('./lib/ocr');

module.exports = class {
    constructor(conf) {
        this.ocr = new ocr(conf);
    }
};