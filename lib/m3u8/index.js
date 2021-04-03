/*
M3U8文件解析、下载等
参考文献：https://www.jianshu.com/p/e97f6555a070
下载ts片段，目前最大使用16进程比较好
*/
require('../comm/proto');
const _axios = require('../comm/axios');
const _url = require('../comm/url');
const _convert = require('../comm/convert');
const _fs = require('../comm/fs');
const fs = require('fs');
const path = require('path');
const _process = require('../comm/process');
const _requestModule = require('request');
const { execSync } = require("child_process");
const events = require('events');
let request;

module.exports = class {
    constructor(uri) {
        this.uri = uri;
        this.parse = _parse;
        this.cache = _cache;
        this._cacheOnceEventEmitter = new events.EventEmitter();
        this.cacheTaskProcess = new events.EventEmitter();
    }
};

/**
 * 将一个m3u8地址转换成m3u8对象
 * @param {*} uri
 * @returns
 */
const _parse = async function (uri) {
    let m3u8Obj = [];
    //转换地址
    uri = _url.parse(uri || this.uri);
    //获取内容
    request = new _axios(uri.protocol + '//' + uri.host);
    let text = await request.get(uri.path);
    if (text && text.startWith('#EXTM3U')) {
        if (text.indexOf('#EXT-X-STREAM-INF:') > -1) {
            //是否主播放列表，分片进行解析
            text = text.split('\n');
            for (let i = 0; i < text.length; i++) {
                if (text[i].startWith('#EXT-X-STREAM-INF:')) {
                    const info = {
                        BANDWIDTH: '',
                        RESOLUTION: ''
                    };
                    //解析资源信息
                    text[i].replace('#EXT-X-STREAM-INF:', '').split(',').map(item => {
                        if (item.startWith('BANDWIDTH')) {
                            info.BANDWIDTH = item.split('=')[1];
                        }
                        if (item.startWith('RESOLUTION')) {
                            info.RESOLUTION = item.split('=')[1];
                        }
                    });
                    let _text = "", result;
                    if (text[i + 1].startWith("http://") || text[i + 1].startWith("https://")) {
                        let tmp = _url.parse(text[i + 1]);
                        let _request = new _axios(tmp.protocol + '//' + tmp.host);
                        _text = await _request.get(tmp.path);
                        result = await _read(_text, info, tmp.protocol + '//' + tmp.host);
                    } else {
                        _text = await request.get(text[i + 1]);
                        result = await _read(_text, info, uri.protocol + '//' + uri.host);
                    }
                    result && m3u8Obj.push(result);
                    i++;
                }
            }
        } else {
            //非主播放列表，直接解析
            m3u8Obj[0] = await _read(text, {
                BANDWIDTH: '默认',
                'RESOLUTION': '默认',
            }, uri.protocol + '//' + uri.host);
        }
        return m3u8Obj;
    } else {
        throw new Error('非标准M3U8文件');
    }
}

const _read = async function (text, info, uri) {
    text = text.split('\n');
    info.list = [];
    info.DISCONTINUITY = [];
    let encrypted = {
        METHOD: 'NONE'
    };
    for (let i = 0; i < text.length; i++) {
        if (text[i].startWith("#EXT-X-VERSION:")) {
            info.VERSION = text[i].replace("#EXT-X-VERSION:", '');
        }
        if (text[i].startWith("#EXT-X-TARGETDURATION:")) {
            info.TARGETDURATION = text[i].replace("#EXT-X-TARGETDURATION:", '');
        }
        if (text[i].startWith("#EXT-X-PLAYLIST-TYPE:")) {
            info.TYPE = text[i].replace("#EXT-X-PLAYLIST-TYPE:", '');
        }
        if (text[i].startWith("#EXT-X-MEDIA-SEQUENCE:")) {
            info.SEQUENCE = text[i].replace("#EXT-X-MEDIA-SEQUENCE:", '');
        }
        if (text[i].startWith("#EXT-X-DISCONTINUITY")) {
            let tmpUrl = text[i - 1];
            if (!tmpUrl.startWith('http://') && !tmpUrl.startWith('https://')) {
                list.URI += uri;
            }
            tmpUrl = _url.parse(tmpUrl);
            tmpUrl = path.basename(tmpUrl.pathname);
            info.DISCONTINUITY.push(tmpUrl);
        }
        if (text[i].startWith("#EXT-X-KEY:")) {
            encrypted = {};
            text[i].replace("#EXT-X-KEY:", '').split(',').map(item => {
                let tmp = item.split('=');
                encrypted[tmp[0]] = tmp[1];
            });
            if (encrypted.METHOD != "NONE") {
                //处理URI
                if (encrypted.URI) {
                    encrypted.URI = encrypted.URI.replace(/"/g, "").replace(/'/g, "");
                    if (!encrypted.URI.startWith('http://') && !encrypted.URI.startWith('https://')) {
                        encrypted.URI += uri;
                    }
                    let tmp = _url.parse(encrypted.URI);
                    let _tmp = new _axios(tmp.protocol + '//' + tmp.host);
                    encrypted.KEY = await _tmp.get(tmp.path);
                    if (encrypted.KEY.length == 16) {
                        encrypted.KEY = _convert.to16Text(encrypted.KEY);
                    }
                }
                //处理向量 IV=0xaa3dcf6a7acb92ff4fb08d9b3b3d6f51
                if (encrypted.IV) {
                    if (encrypted.IV.startWith('0x') && encrypted.IV.length == 34) {
                        encrypted.IV = encrypted.IV.replace('0x', '');
                    }
                    if (encrypted.IV.length == 16) {
                        encrypted.IV = _convert.to16Text(encrypted.IV);
                    }
                } else {
                    let _iv = info.SEQUENCE.toString();
                    //如果未出现，则默认使用媒体片段序列号（即 EXT-X-MEDIA-SEQUENCE）作为其 IV 值，使用大端字节序，往左填充 0 直到序列号满足 16 字节（128 位）。
                    while (_iv.length < 32) {
                        _iv += '0';
                    }
                    encrypted.IV = _iv;
                }
            }
        }
        if (text[i].startWith("#EXTINF:")) {
            let list = {
                EXTINF: text[i].replace("#EXTINF:", '').replace(',', ''),
                URI: text[i + 1]
            };
            if (!list.URI.startWith('http://') && !list.URI.startWith('https://')) {
                list.URI += uri;
            }
            list.ENCRYPTED = encrypted;
            info.list.push(list);
        }
    }
    return info;
}

/**
 * 缓存m3u8文件
 * @param {String} uri m3u8地址
 * @param {Number} procNum 同时下载进程数
 * @param {String} procNum 缓存路径
 */
const _cache = async function (filepath, procNum) {
    let self = this;
    _fs.mkdirSync(filepath);
    const m3u8Obj = await _parse(this.uri);
    // let originProto = Object.getPrototypeOf(m3u8Obj[0]);
    // let obj = Object.assign(Object.create(originProto), m3u8Obj[0]);
    // obj.BANDWIDTH = 1;
    // m3u8Obj.push(obj);
    // originProto = Object.getPrototypeOf(m3u8Obj[0]);
    // obj = Object.assign(Object.create(originProto), m3u8Obj[0]);
    // obj.BANDWIDTH = 2;
    // m3u8Obj.push(obj);
    // originProto = Object.getPrototypeOf(m3u8Obj[0]);
    // obj = Object.assign(Object.create(originProto), m3u8Obj[0]);
    // obj.BANDWIDTH = 3;
    // m3u8Obj.push(obj);
    if (m3u8Obj.length > 1) {
        //多个m3u8
        let m3u8FileText = ["#EXTM3U"];
        let index = 0;
        self._cacheOnceEventEmitter.on("progress", function (data) {
            let completed = index / m3u8Obj.length * 100;
            // let nowCompleted = data.progress * ((index + 1) / m3u8Obj.length) * 0.5;
            let nowCompleted = data.progress / m3u8Obj.length;
            let progress = Math.round((completed + nowCompleted) * 100) / 100;
            self.cacheTaskProcess.emit("progress", {
                current: index + 1,
                total: m3u8Obj.length,
                detail: data,
                progress
            });
        });
        for (index = 0; index < m3u8Obj.length; index++) {
            let _filepath = filepath + m3u8Obj[index].BANDWIDTH + '/';
            _fs.mkdirSync(_filepath);
            await cacheOnce(m3u8Obj[index], _filepath, procNum, self);
            m3u8FileText.push(`#EXT-X-STREAM-INF:BANDWIDTH=${m3u8Obj[index].BANDWIDTH}${m3u8Obj[index].RESOLUTION ? `,RESOLUTION=${m3u8Obj[index].RESOLUTION}` : ""}`);
            m3u8FileText.push(`${m3u8Obj[index].BANDWIDTH}/index.m3u8`);
        }
        fs.writeFileSync(filepath + 'index.m3u8', m3u8FileText.join('\n'));
    } else {
        //单个m3u8
        self._cacheOnceEventEmitter.on("progress", function (data) {
            self.cacheTaskProcess.emit("progress", {
                progress: data.progress,
                current: 1,
                total: 1,
                detail: data
            });
        });
        await cacheOnce(m3u8Obj[0], filepath, procNum, self);
    }
}

const cacheOnce = async function (m3u8, filepath, procNum, parent) {
    let m3u8FileText = ["#EXTM3U"];
    m3u8.VERSION && m3u8FileText.push(`#EXT-X-VERSION:${m3u8.VERSION}`);
    m3u8.TARGETDURATION && m3u8FileText.push(`#EXT-X-TARGETDURATION:${m3u8.TARGETDURATION}`);
    m3u8.TYPE && m3u8FileText.push(`#EXT-X-PLAYLIST-TYPE:${m3u8.TYPE}`);
    m3u8.SEQUENCE && m3u8FileText.push(`#EXT-X-MEDIA-SEQUENCE:${m3u8.SEQUENCE}`);
    let j = 0, t = procNum;
    if (m3u8.list.length < t) {
        t = m3u8.list.length;
    }
    let success = 0, error = 0;
    while (true) {
        if (j < t) {
            try {
                m3u8FileText.push(`#EXTINF:${m3u8.list[j].EXTINF}`);
                let ts = _url.parse(m3u8.list[j].URI);
                let fname = path.basename(ts.pathname);
                m3u8FileText.push(fname);
                if (m3u8.DISCONTINUITY && m3u8.DISCONTINUITY.length && m3u8.DISCONTINUITY.find(item => item == fname)) {
                    m3u8FileText.push("#EXT-X-DISCONTINUITY");
                }
                downLoad(filepath + fname, m3u8.list[j].URI).then(function () {
                    success++;
                    if (t < m3u8.list.length) {
                        t++;
                    }
                    let progress = Math.round((((success + error) / m3u8.list.length) * 100 * 0.5) * 100) / 100;
                    parent._cacheOnceEventEmitter.emit("progress", {
                        total: m3u8.list.length,
                        current: success + error,
                        progress
                    });
                }).error(function () {
                    error++;
                    if (t < m3u8.list.length) {
                        t++;
                    }
                    let progress = Math.round((((success + error) / m3u8.list.length) * 100 * 0.5) * 100) / 100;
                    parent._cacheOnceEventEmitter.emit("progress", {
                        total: m3u8.list.length,
                        current: success + error,
                        progress
                    });
                });
            } catch (e) { }
            j++;
        }
        if (success + error == m3u8.list.length) {
            break;
        }
        await _process.sleep(100);
    }
    //解密
    for (let j = 0; j < m3u8.list.length; j++) {
        if (m3u8.list[j].ENCRYPTED && m3u8.list[j].ENCRYPTED.METHOD != 'NONE') {
            if (m3u8.list[j].ENCRYPTED.METHOD == 'AES-128') {
                let ts = _url.parse(m3u8.list[j].URI);
                let fname = path.basename(ts.pathname);
                execSync(`openssl aes-128-cbc -d -in ${fname} -out ${fname + '.UET'} -nosalt -iv ${m3u8.list[j].ENCRYPTED.IV} -K ${m3u8.list[j].ENCRYPTED.KEY}`, {
                    cwd: filepath,
                    windowsHide: true
                });
                fs.unlinkSync(filepath + fname);
                fs.copyFileSync(filepath + fname + '.UET', filepath + fname);
                fs.unlinkSync(filepath + fname + '.UET');
            }
        }
        let progress = Math.round((((j + 1) / m3u8.list.length) * 100 * 0.5 + 50) * 100) / 100;
        parent._cacheOnceEventEmitter.emit("progress", {
            total: m3u8.list.length,
            current: j + 1,
            progress
        });
    }
    m3u8FileText.push("#EXT-X-ENDLIST");
    fs.writeFileSync(filepath + 'index.m3u8', m3u8FileText.join('\n'));
}

function downLoad(filename, uri) {
    return new Promise(function (resolve, reject) {
        try {
            var stream = fs.createWriteStream(filename);
            _requestModule(uri).pipe(stream).on('close', resolve);
        } catch (e) {
            reject(e);
        }
    });
};