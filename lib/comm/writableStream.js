const util = require('util');
const { Writable } = require('stream');

function writableStream(options) {
    this._chunks = [];
    Writable.call(this, options);
}
util.inherits(writableStream, Writable)
writableStream.prototype._write = function (chunk, encoding, cb) {
    this._chunks.push(chunk);
    cb && cb();
};
writableStream.prototype.getBuffer = function () {
    let res = Buffer.concat(this._chunks);
    this._chunks.splice(0, this._chunks.length);
    return res;
};

module.exports = writableStream;