/** Session服务 */

require('../comm/proto.js');
const path = require('path');
const AsyncClass = require('../public/AsyncClass');
const guid = require('../comm/guid');
const fs = require('fs');
const filepath = path.join(__filename, '../.session/');
const _fs = require('../comm/fs');

const AutoRemove = async (namespance) => {
    if (fs.existsSync(filepath + namespance)) {
        const filelist = _fs.findfilesSync(filepath + namespance);
        for (const file of filelist) {
            if (path.extname(file) == '.e') {
                const session = JSON.parse(fs.readFileSync(file).toString().decrypt());
                if (new Date(session.expire) <= new Date()) {
                    fs.unlinkSync(file);
                }
            }
        }
    } else {
        _fs.mkdirSync(filepath + namespance);
    }
}

class SessionAsync extends AsyncClass {
    constructor(namespance = 'default') {
        super(async () => {
            await AutoRemove(namespance);
            this.instance = {
                get id() {
                    return namespance.encrypt();
                }
            };
            /**
             * Session数量
             */
            this.count = async function () {
                await AutoRemove(this.instance.id.decrypt());
                const filelist = _fs.findfilesSync(filepath + this.instance.id.decrypt());
                return filelist.length;
            };
            /**
             * Session列表
             * @param {Number} limit 获取数量
             */
            this.list = async function (limit = 0) {
                await AutoRemove(this.instance.id.decrypt());
                let result = [];
                const filelist = _fs.findfilesSync(filepath + this.instance.id.decrypt());
                for (const file of filelist) {
                    const session = JSON.parse(fs.readFileSync(file).toString().decrypt());
                    session.id = path.basename(file, path.extname(file));
                    result.push(session);
                    if (limit > 0 && limit == result.length) {
                        return result;
                    }
                }
                return result;
            };
            /**
             * 创建一个Session
             * @param {String} data 用户数据
             * @param {Number} expire 过期时间，单位秒，如果不传则永不过期
             */
            this.create = async function (data, expire) {
                console.log("调用创建session方法：", data, expire);
                await AutoRemove(this.instance.id.decrypt());
                console.log("移除过期session");
                if (!data) {
                    throw new Error('data不能为空');
                }
                data = data.toString();
                let sessionid = guid.v22;
                console.log("生成的sessionid", sessionid);
                let fname, txt, etxt;
                if (expire) {
                    fname = filepath + this.instance.id.decrypt() + '/' + sessionid + '.e';
                    txt = JSON.stringify({
                        expire: new Date(new Date().valueOf() + expire * 1000).format('yyyy-MM-dd hh:mm:ss'),
                        data,
                        create_time: new Date().format('yyyy-MM-dd hh:mm:ss')
                    });
                    etxt = txt.encrypt();
                } else {
                    fname = filepath + this.instance.id.decrypt() + '/' + sessionid + '.ue';
                    txt = JSON.stringify({
                        data,
                        create_time: new Date().format('yyyy-MM-dd hh:mm:ss')
                    });
                    etxt = txt.encrypt();
                }
                console.log("写入文件：", fname);
                console.log("写入文件内容：", txt);
                console.log("写入文件加密后的内容：", etxt);
                fs.writeFileSync(fname, etxt);
                return sessionid;
            };
            /**
             * 获取session
             * @param {String} sessionid 需要获取的session
             * @returns
             */
            this.get = async function (sessionid) {
                console.log("调用获取session方法：", sessionid);
                await AutoRemove(this.instance.id.decrypt());
                console.log("移除过期session");
                if (!sessionid) {
                    throw new Error('sessionid不能为空');
                }
                sessionid = sessionid.toString();
                let session = null, file = filepath + this.instance.id.decrypt() + '/' + sessionid;
                console.log("读取session文件：", file);
                if (fs.existsSync(file + '.e')) {
                    file = file + '.e';
                    console.log("存在有有效期的文件", file);
                } else if (fs.existsSync(file + '.ue')) {
                    file = file + '.ue';
                    console.log("存在无有效期的文件", file);
                }
                session = fs.readFileSync(file).toString();
                console.log("读取到的加密的内容：", session);
                session = session.decrypt();
                console.log("解密后的内容：", session);
                return JSON.parse(session);
            };
            /**
             * 移除session
             * @param {String} sessionid 需要删除的session
             * @returns
             */
            this.del = async function (sessionid) {
                await AutoRemove(this.instance.id.decrypt());
                if (!sessionid) {
                    throw new Error('sessionid不能为空');
                }
                sessionid = sessionid.toString();
                const file = filepath + this.instance.id.decrypt() + '/' + sessionid;
                if (fs.existsSync(file + '.e')) {
                    fs.unlinkSync(file + '.e');
                } else if (fs.existsSync(file + '.ue')) {
                    fs.unlinkSync(file + '.ue');
                }
            };
            /**
             * 清空session
             * @returns
             */
            this.empty = async function () {
                const file = filepath + this.instance.id.decrypt() + '/';
                _fs.unlinkSync(file);
            };
            /**
             * 延长session有效期
             * @param {String} sessionid 需要延长的session
             * @param {Number} time 延长时间，单位秒，如果不传则永不过期
             * @returns
             */
            this.expire = async function (sessionid, time = 0) {
                await AutoRemove(this.instance.id.decrypt());
                if (!sessionid) {
                    throw new Error('sessionid不能为空');
                }
                let session = null, file = filepath + this.instance.id.decrypt() + '/' + sessionid + '.e';
                if (fs.existsSync(file)) {
                    session = JSON.parse(fs.readFileSync(file).toString().decrypt());
                    if (session) {
                        session.expire = new Date(new Date(session.expire).valueOf() + time * 1000).format('yyyy-MM-dd hh:mm:ss');
                        fs.unlinkSync(file);
                        fs.writeFileSync(file, JSON.stringify(session).encrypt());
                    }
                }
            };
            this.completed = true;
        });
        this.completed = false;
    }
}

module.exports = SessionAsync;