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

    constructor(uri, retry = 3) {
        this.retry = retry;
        this.uri = uri;
        this.parse = _parse;
        this.stringify = _stringify;
        this.saveAs = _saveAs;
        this.originMap = _originMap;
        this.cache = _cache;
        this._cacheOnceEventEmitter = new events.EventEmitter();
        this.cacheTaskProgress = new events.EventEmitter();
    }
};

/**
 * 将一个m3u8地址转换成m3u8对象
 * @param {*} uri
 * @returns
 */
const _parse = async function (uri) {
    let m3u8Obj = [];
    let text;
    try {
        //转换地址
        uri = _url.parse(uri || this.uri);
        //获取内容
        request = new _axios(uri.protocol + '//' + uri.host);
        text = await request.get(uri.path);
    } catch (e) {
        console.warn("请求不到资源1：", e);
        return null;
    }
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
                        try {
                            _text = await _request.get(tmp.path);
                            result = await _read(_text, info, tmp.protocol + '//' + tmp.host);
                        } catch (e) {
                            console.warn("请求不到资源2：", e);
                            return null;
                        }
                    } else {
                        try {
                            _text = await request.get(text[i + 1]);
                            result = await _read(_text, info, uri.protocol + '//' + uri.host);
                        } catch (e) {
                            console.warn("请求不到资源3：", e);
                            return null;
                        }
                    }
                    result && m3u8Obj.push(result);
                    i++;
                }
            }
        } else {
            //非主播放列表，直接解析
            try {
                m3u8Obj[0] = await _read(text, {
                    BANDWIDTH: '默认',
                    'RESOLUTION': '默认',
                }, uri.protocol + '//' + uri.host);
            } catch (e) {
                console.warn("请求不到资源4：", e);
                return null;
            }
        }
        return m3u8Obj;
    } else {
        console.warn('非标准M3U8文件');
        return null;
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
            info.VERSION = text[i].replace("#EXT-X-VERSION:", '').replace('\r', '');
        }
        if (text[i].startWith("#EXT-X-TARGETDURATION:")) {
            info.TARGETDURATION = text[i].replace("#EXT-X-TARGETDURATION:", '').replace('\r', '');
        }
        if (text[i].startWith("#EXT-X-PLAYLIST-TYPE:")) {
            info.TYPE = text[i].replace("#EXT-X-PLAYLIST-TYPE:", '').replace('\r', '');
        }
        if (text[i].startWith("#EXT-X-MEDIA-SEQUENCE:")) {
            info.SEQUENCE = text[i].replace("#EXT-X-MEDIA-SEQUENCE:", '').replace('\r', '');
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
                encrypted[tmp[0]] = tmp[1].replace('\r', '');
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
                EXTINF: text[i].replace("#EXTINF:", '').replace(',', '').replace('\r', ''),
                URI: text[i + 1].replace('\r', '')
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
 * 另存为本地m3u8文件（可用于转发）
 * @param {*} filepath 本地保存路径
 * @param {String} prefix 片段转发请求地址
 * @returns
 */
const _saveAs = async function (filepath, prefix) {
    if (!filepath.endWith(path.sep)) {
        filepath += path.sep;
    }
    _fs.mkdirSync(filepath);
    const uri = _url.parse(this.uri);
    const m3u8Obj = await _parse(this.uri);
    if (m3u8Obj) {
        let m3u8FileText = [];
        if (m3u8Obj.length > 1) {
            //多个m3u8
            m3u8FileText.push("#EXTM3U");
            for (index = 0; index < m3u8Obj.length; index++) {
                const _m3u8FileText = _stringify(m3u8Obj[i], 1, prefix);
                fs.writeFileSync(`${filepath}${m3u8Obj[index].BANDWIDTH}.m3u8`, _m3u8FileText.remove.join('\n'));
                m3u8FileText.push(`#EXT-X-STREAM-INF:BANDWIDTH=${m3u8Obj[index].BANDWIDTH}${m3u8Obj[index].RESOLUTION ? `,RESOLUTION=${m3u8Obj[index].RESOLUTION}` : ""}`);
                m3u8FileText.push(`${filepath}${m3u8Obj[index].BANDWIDTH}.m3u8`);
            }
            m3u8FileText.push('#EXT-X-ENDLIST');
            fs.writeFileSync(filepath + 'index.m3u8', m3u8FileText.join('\n'));
        } else {
            //单个m3u8
            m3u8FileText = _stringify(m3u8Obj[0], 1, prefix);
            fs.writeFileSync(filepath + 'index.m3u8', m3u8FileText.remove.join('\n'));
        }
        fs.writeFileSync(filepath + 'm3u8', JSON.stringify({ m3u8Obj, uri }).encrypt());
        return filepath + 'index.m3u8';
    } else {
        return null;
    }
}

/**
 * 获得原始地址映射
 * @param {*} filepath m3u8所在目录
 * @returns
 */
const _originMap = async function (filepath) {
    try {
        if (!filepath.endWith('.m3u8')) {
            filepath = path.join(filepath, './index.m3u8');
        }
        if (!fs.existsSync(filepath)) {
            return null;
        }
        const m3u8FilePath = path.join(path.dirname(filepath), './m3u8');
        if (!fs.existsSync(m3u8FilePath)) {
            return null;
        }
        const m3u8File = JSON.parse(fs.readFileSync(m3u8FilePath).toString().decrypt());
        for (let i = 0; i < m3u8File.m3u8Obj.length; i++) {
            let _filepath = path.join(path.dirname(filepath), `./${m3u8File.m3u8Obj.length == 1 ? "index" : m3u8File.m3u8Obj[i].BANDWIDTH}.m3u8`);
            const text = fs.readFileSync(_filepath).toString().split('\n');
            for (let j = 0; j < m3u8File.m3u8Obj[i].list.length; j++) {
                let _orginUrl = m3u8File.m3u8Obj[i].list[j].URI;
                if (!_orginUrl.startWith('http://') && !_orginUrl.startWith('https://')) {
                    _orginUrl = `${m3u8File.uri.protocol}//${m3u8File.uri.host}${m3u8File.uri.port ? `:${m3u8File.uri.port}` : ""}${_orginUrl}`;
                }
                const _originUri = _url.parse(_orginUrl);
                const nowUrl = text.find(item => decodeURIComponent(_url.getParams("url", item)) == _originUri.path);
                m3u8File.m3u8Obj[i].list[j].URI = nowUrl;
                m3u8File.m3u8Obj[i].list[j].ORGIN_URI = _orginUrl;
                m3u8File.m3u8Obj[i].list[j].PATH = _originUri.path;
            }
        }
        return m3u8File.m3u8Obj;

    } catch (e) {
        return null;
    }
}

/**
 * 将m3u8对象转换成字符文件对象
 * @param {Object} m3u8Obj m3u8对象
 * @param {Boolean} removeHost 是否移除分片域名信息
 * @param {String} prefix 移除后替换的分片域名信息（用于保存本地时使用）
 * @returns
 */
function _stringify(m3u8Obj, removeHost, prefix) {
    let text = [], m3u8Text = [];
    //起始标签
    text.push("#EXTM3U");
    m3u8Text.push("#EXTM3U");
    //表示 HLS 的协议版本号，该标签与流媒体的兼容性相关。该标签为全局作用域，使能整个 m3u8 文件；
    //每个 m3u8 文件内最多只能出现一个该标签定义。如果 m3u8 文件不包含该标签，则默认为协议的第一个版本。
    m3u8Obj.VERSION && text.push(`#EXT-X-VERSION:${m3u8Obj.VERSION}`);
    m3u8Obj.VERSION && m3u8Text.push(`#EXT-X-VERSION:${m3u8Obj.VERSION}`);
    //该标签为必选标签。表示每个视频分段最大的时长（单位秒）。
    m3u8Obj.TARGETDURATION && text.push(`#EXT-X-TARGETDURATION:${m3u8Obj.VERSION}`);
    m3u8Obj.TARGETDURATION && m3u8Text.push(`#EXT-X-TARGETDURATION:${m3u8Obj.VERSION}`);
    //该标签为可选标签。表明流媒体类型。全局生效。
    m3u8Obj.TYPE && text.push(`#EXT-X-PLAYLIST-TYPE:${m3u8Obj.TYPE}`);
    m3u8Obj.TYPE && m3u8Text.push(`#EXT-X-PLAYLIST-TYPE:${m3u8Obj.TYPE}`);
    //标签必须出现在播放列表第一个切片之前。
    //表示播放列表第一个 URL 片段文件的序列号。
    //每个媒体片段 URL 都拥有一个唯一的整型序列号。
    //每个媒体片段序列号按出现顺序依次加 1。
    //如果该标签未指定，则默认序列号从 0 开始。
    //媒体片段序列号与片段文件名无关。
    m3u8Obj.SEQUENCE && text.push(`#EXT-X-MEDIA-SEQUENCE:${m3u8Obj.SEQUENCE}`);
    m3u8Obj.SEQUENCE && m3u8Text.push(`#EXT-X-MEDIA-SEQUENCE:${m3u8Obj.SEQUENCE}`);
    //开始循环每一个切片
    let ENCRYPTEDING = false;
    for (let i = 0; i < m3u8Obj.list.length; i++) {
        //媒体片段可以进行加密，而该标签可以指定解密方法。
        //该标签对所有 媒体片段 和 由标签 EXT-X-MAP 声明的围绕其间的所有 媒体初始化块（Meida Initialization Section） 都起作用，
        //直到遇到下一个 EXT-X-KEY（若 m3u8 文件只有一个 EXT-X-KEY 标签，则其作用于所有媒体片段）。
        //多个 EXT-X-KEY 标签如果最终生成的是同样的秘钥，则他们都可作用于同一个媒体片段。
        if (m3u8Obj.list[i].ENCRYPTED.METHOD != "NONE") {
            //需要加密，并且之前没有标记过加密字段
            if (!ENCRYPTEDING) {
                text.push(`#EXT-X-KEY:METHOD=${m3u8Obj.list[i].ENCRYPTED.METHOD},URI="${m3u8Obj.list[i].ENCRYPTED.URI}"${m3u8Obj.list[i].ENCRYPTED.IV ? `,IV="${m3u8Obj.list[i].ENCRYPTED.IV}"` : ""}`);
                m3u8Text.push(`#EXT-X-KEY:METHOD=${m3u8Obj.list[i].ENCRYPTED.METHOD},URI="${m3u8Obj.list[i].ENCRYPTED.URI}"${m3u8Obj.list[i].ENCRYPTED.IV ? `,IV="${m3u8Obj.list[i].ENCRYPTED.IV}"` : ""}`);
                ENCRYPTEDING = true;
            }
        } else {
            if (ENCRYPTEDING) {
                //之前的片段正在加密，现在无需加缪，需要标记不需要加密的标记，否则忽略
                text.push(`#EXT-X-KEY:METHOD=NONE`);
                m3u8Text.push(`#EXT-X-KEY:METHOD=NONE`);
            }
            ENCRYPTEDING = false;
        }
        //表示其后 URL 指定的媒体片段时长（单位为秒）。每个 URL 媒体片段之前必须指定该标签。
        text.push(`#EXTINF:${m3u8Obj.list[i].EXTINF},`);
        m3u8Text.push(`#EXTINF:${m3u8Obj.list[i].EXTINF},`);
        //片段信息
        if (removeHost) {
            const uri = _url.parse(m3u8Obj.list[i].URI);
            if (prefix) {
                text.push(`${prefix}${encodeURIComponent(uri.path)}`);
            } else {
                text.push(uri.path);
            }
        }
        m3u8Text.push(m3u8Obj.list[i].URI);
        //该标签表明其前一个切片与下一个切片之间存在中断。
        if (m3u8Obj.DISCONTINUITY.find(item => m3u8Obj.list[i].URI.endWith(item))) {
            text.push("#EXT-X-DISCONTINUITY");
            m3u8Text.push("#EXT-X-DISCONTINUITY");
        }
    }
    //结束标记
    text.push('#EXT-X-ENDLIST');
    m3u8Text.push('#EXT-X-ENDLIST');
    if (!removeHost) {
        return m3u8Text;
    }
    return {
        unRemove: m3u8Text,
        remove: text
    };
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
    if (m3u8Obj) {
        if (m3u8Obj.length > 1) {
            //多个m3u8
            let m3u8FileText = ["#EXTM3U"];
            let index = 0;
            self._cacheOnceEventEmitter.on("progress", function (data) {
                let completed = index / m3u8Obj.length * 100;
                let nowCompleted = data.progress / m3u8Obj.length;
                let progress = Math.round((completed + nowCompleted) * 100) / 100;
                self.cacheTaskProgress.emit("progress", {
                    current: index + 1,
                    total: m3u8Obj.length,
                    detail: data,
                    progress
                });
                if (progress == 100) {
                    self.cacheTaskProgress.emit("complete", '');
                }
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
                self.cacheTaskProgress.emit("progress", {
                    progress: data.progress,
                    current: 1,
                    total: 1,
                    detail: data
                });
                if (data.progress == 100) {
                    self.cacheTaskProgress.emit("complete", '');
                }
            });
            await cacheOnce(m3u8Obj[0], filepath, procNum, self);
        }
    } else {
        self.cacheTaskProgress.emit("error", '');
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
    // console.log("准备循环下载...");
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
                // console.log("准备下载：", j, t, m3u8.list.length);
                downLoad(filepath + fname, m3u8.list[j].URI).then(function () {
                    // console.log("完成下载：", j, t, m3u8.list.length);
                    success++;
                    if (t < m3u8.list.length) {
                        t++;
                    }
                    let progress = Math.round((((success + error) / m3u8.list.length) * 100 * 0.98) * 100) / 100;
                    parent._cacheOnceEventEmitter.emit("progress", {
                        total: m3u8.list.length,
                        current: success + error,
                        progress
                    });
                }).catch(function () {
                    // console.warn("下载失败：", j, t, m3u8.list.length);
                    error++;
                    if (t < m3u8.list.length) {
                        t++;
                    }
                    let progress = Math.round((((success + error) / m3u8.list.length) * 100 * 0.98) * 100) / 100;
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
            await _process.sleep(1000);
            break;
        }
        await _process.sleep(100);
    }
    //解密
    // console.log("循环下载完成，准备解密");
    for (let j = 0; j < m3u8.list.length; j++) {
        // console.log("解密", j);
        if (m3u8.list[j].ENCRYPTED && m3u8.list[j].ENCRYPTED.METHOD != 'NONE') {
            if (m3u8.list[j].ENCRYPTED.METHOD == 'AES-128') {
                let ts = _url.parse(m3u8.list[j].URI);
                let fname = path.basename(ts.pathname);
                await openssl(filepath, fname, m3u8.list[j].ENCRYPTED.IV, m3u8.list[j].ENCRYPTED.KEY, this.retry > 0 ? this.retry : 3);
                try {
                    fs.unlinkSync(filepath + fname);
                    fs.copyFileSync(filepath + fname + '.UETS', filepath + fname);
                    fs.unlinkSync(filepath + fname + '.UETS');
                } catch (e) { }
            }
        }
        let progress = Math.round((((j + 1) / m3u8.list.length) * 100 * 0.02 + 98) * 100) / 100;
        parent._cacheOnceEventEmitter.emit("progress", {
            total: m3u8.list.length,
            current: j + 1,
            progress
        });
    }
    m3u8FileText.push("#EXT-X-ENDLIST");
    try {
        fs.writeFileSync(filepath + 'index.m3u8', m3u8FileText.join('\n'));
    } catch (e) { }
}

async function openssl(filepath, fname, iv, key, retry, _retry) {
    _retry = _retry || 0;
    while (_retry < retry) {
        try {
            // execSync(`openssl aes-128-cbc -d -in ${fname} -out ${fname + '.UETS'} -nosalt -iv ${m3u8.list[j].ENCRYPTED.IV} -K ${m3u8.list[j].ENCRYPTED.KEY}`, {
            if (fs.existsSync(path.join(filepath, fname))) {
                execSync(`openssl aes-128-cbc -d -in ${fname} -out ${fname + '.UETS'} -nosalt -iv ${iv} -K ${key}`, {
                    cwd: filepath,
                    windowsHide: true
                });
            }
            return;
        } catch (e) {
            _retry++;
            console.warn(`转换出错,重试${_retry}...`);
            await _process.sleep(1000);
            openssl(filepath, fname, iv, key, retry, _retry);
        }
    }
    return;
}

function downLoad(filename, uri) {
    return new Promise(function (resolve, reject) {
        var stream = fs.createWriteStream(filename);
        _requestModule(uri).pipe(stream).on('close', resolve).on("error", reject);
    });
};