const __url = require('url');
const protocol = {
    http: require('http'),
    https: require('https'),
};
const fs = require('fs');
const path = require('path');
const _fs = require('../comm/fs');
const guid = require('../comm/guid');
const writableStream = require('../comm/writableStream');

/**
 * 获取地址栏参数
 * @param {*} name 参数名称
 * @param {*} url 地址 默认window.location.search
 * @returns
 */
function getParams(name, url) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    if (!url) {
        if (window && window.location && window.location.search) {
            url = window.location.search;
        } else {
            url = '';
        }
    }
    var r = url.substr(url.indexOf("?") + 1).match(reg);
    if (r != null) return decodeURI(r[2]);
    return "";
}
exports.getParams = getParams;

/**
 * 获取query参数
 * @param {*} url 默认window.location.search
 * @returns
 */
function convert(url) {
    url = decodeURIComponent(url || window.location.href);
    return parse(url, true).query;
}
exports.convert = convert;

/**
 * 将Url字符串转换成Url对象
 * @param {String} urlStr
 * @param {Boolean} parseQueryString Pass true as the second argument to also parse the query string using the querystring module. Defaults to false.
 * @param {Boolean} slashesDenoteHost Pass true as the third argument to treat //foo/bar as { host: 'foo', pathname: '/bar' } rather than { pathname: '//foo/bar' }. Defaults to false.
 * @returns
 */
function parse(urlStr, parseQueryString, slashesDenoteHost) {
    const uri = __url.parse(urlStr, parseQueryString, slashesDenoteHost);
    uri.request = _sendRequest;
    uri.download = _download;
    return uri;
};
exports.parse = parse;

/**
 * Take a base URL, and a href URL, and resolve them as a browser would for an anchor tag.
 * @param {*} from
 * @param {*} to
 * @returns
 */
exports.resolve = function (from, to) {
    return __url.resolve(from, to);
}

/**
 * 向目标地址发送一个请求
 * @param {String} data 请求的数据
 * @param {String} method 请求方式，默认GET
 * @param {JSON} headers 请求头
 * @returns
 */
function _sendRequest(data, method, headers) {
    const self = this;
    return new Promise(function (resolve, reject) {
        try {
            const options = {};
            options.host = self.host;
            options.port = self.port;
            options.path = self.path;
            options.method = method || 'GET';
            options.headers = headers;

            // const util = require('util');
            // const { Writable } = require('stream');
            // function CacheWritable(options) {
            //     this._chunks = [];
            //     Writable.call(this, options);
            // }
            // util.inherits(CacheWritable, Writable)
            // CacheWritable.prototype._write = function (chunk, encoding, cb) {
            //     this._chunks.push(chunk);
            //     cb && cb();
            // };
            // CacheWritable.prototype.getBuffer = function () {
            //     let res = Buffer.concat(this._chunks);
            //     this._chunks.splice(0, this._chunks.length);
            //     return res;
            // };

            const request = protocol[self.protocol.replace(':', '')].request(options, (res) => {
                // let resMessage = "";
                // res.on('data', function (chunk) {
                //     resMessage += chunk;
                // });
                // res.on('end', function () {
                //     const buffer = Buffer.from(resMessage);
                //     resolve(buffer);
                // });

                let write = new writableStream({ emitClose: true });
                write.on('finish', () => {
                    resolve(write.getBuffer());
                });
                res.pipe(write);

            });
            request.on('error', (e) => {
                reject(e);
            });
            data && request.write(data);
            request.end();
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * 向目标地址发送一个下载文件的请求
 * @param {String} filepath 下载保存路径
 * @returns
 */
function _download(filepath) {
    const self = this;
    return new Promise(function (resolve, reject) {
        try {
            const options = {};
            options.host = self.host;
            options.port = self.port;
            options.path = self.path;
            options.method = 'GET';

            const request = protocol[self.protocol.replace(':', '')].request(options, (res) => {
                if (!fs.existsSync(filepath)) {
                    _fs.mkdirSync(filepath);
                }
                filepath = path.join(filepath, guid.v22);
                const ws = fs.createWriteStream(filepath);
                res.pipe(ws);
                ws.on('finish', function () {
                    resolve({
                        headers: res.headers,
                        filepath
                    });
                });
            });
            request.on('error', (e) => {
                reject(e);
            });
            request.end();
        } catch (e) {
            reject(e);
        }
    });
}