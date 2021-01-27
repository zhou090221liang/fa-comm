/** Session服务 */

require('../comm/proto.js');
const path = require('path');
const sqlite3Obj = require('../db/sqlite3');
const sqlite3 = new sqlite3Obj(path.join(__filename, '../session.list'), false);
const AsyncClass = require('../public/AsyncClass');
const guid = require('../comm/guid');

const AutoRemove = async (namespance) => {
    let sql = `DELETE FROM ${namespance} WHERE expire IS NOT NULL AND expire <= '${new Date().format('yyyy-MM-dd hh:mm:ss')}'`;
    await sqlite3.run(sql);
}

class SessionClass extends AsyncClass {
    constructor(namespance = 'default') {
        super(async () => {
            const sql = '\
                CREATE TABLE if NOT EXISTS '+ namespance + '( \
                    id CHAR(22) PRIMARY KEY NOT NULL, \
                    data TEXT NOT NULL, \
                    expire DATETIME NULL, \
                    createtime DATETIME NOT NULL \
                ); \
            ';
            await sqlite3.exec(sql);
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
                let sql = "SELECT COUNT(1) n FROM " + this.instance.id.decrypt();
                const _count = await sqlite3.get(sql);
                return _count.n;
            };
            /**
             * Session列表
             * @param {Number} limit 获取数量
             */
            this.list = async function (limit = 0) {
                await AutoRemove(this.instance.id.decrypt());
                let sql = "SELECT id,data,expire FROM " + this.instance.id.decrypt() + " ORDER BY createtime DESC ";
                if (limit) {
                    sql += ` LIMIT ${limit} `;
                }
                const list = await sqlite3.all(sql);
                return list;
            };
            /**
             * 创建一个Session
             * @param {String} data 用户数据
             * @param {Number} expire 过期时间，单位秒，如果不传则永不过期
             */
            this.create = async function (data, expire) {
                await AutoRemove(this.instance.id.decrypt());
                if (!data) {
                    throw new Error('data不能为空');
                }
                data = data.toString();
                let sql, sessionid = guid.v22;
                if (expire) {
                    expire = new Date(new Date().valueOf() + expire * 1000).format('yyyy-MM-dd hh:mm:ss');
                    sql = "INSERT INTO " + this.instance.id.decrypt() + "(id,data,expire,createtime)values(?,?,?,?);";
                    await sqlite3.run(sql, [sessionid, data, expire, new Date().format('yyyy-MM-dd hh:mm:ss')]);
                } else {
                    sql = "INSERT INTO " + this.instance.id.decrypt() + "(id,data,createtime)values(?,?,?);";
                    await sqlite3.run(sql, [sessionid, data, new Date().format('yyyy-MM-dd hh:mm:ss')]);
                }
                return sessionid;
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
                let sql = `DELETE FROM ${this.instance.id.decrypt()} WHERE id = '${sessionid}'`;
                await sqlite3.run(sql);
            };
            /**
             * 清空session
             * @returns
             */
            this.empty = async function () {
                let sql = `DELETE FROM ${this.instance.id.decrypt()}`;
                await sqlite3.run(sql);
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
                let sql = `SELECT expire FROM ${this.instance.id.decrypt()} WHERE id = '${sessionid}'`;
                let session = await sqlite3.get(sql);
                if (session) {
                    time = new Date(new Date(session.expire).valueOf() + time * 1000).format('yyyy-MM-dd hh:mm:ss');
                    sql = `UPDATE ${this.instance.id.decrypt()} SET expire = '${time}' WHERE id = '${sessionid}'`;
                    await sqlite3.run(sql);
                }
            };
            this.completed = true;
        });
        this.completed = false;
    }
}

module.exports = SessionClass;

// /** Session服务 */

// require('../comm/proto.js');
// const path = require('path');
// const sqlite3Obj = require('../db/sqlite3');
// const sqlite3 = new sqlite3Obj(path.join(__filename, '../session.list'), false);

// const AutoRemove = async (namespance) => {
//     let sql = `DELETE FROM ${namespance} WHERE expire IS NOT NULL AND expire <= '${new Date().format('yyyy-MM-dd hh:mm:ss')}'`;
//     await sqlite3.run(sql);
// }

// module.exports = class {
//     /**
//      * 创建一个Session
//      * @param {String} namespance Session所在的命名空间，类似于多个项目各自分离
//      */
//     constructor(namespance = 'default') {
//         // const path = require('path');
//         // console.log('__dirname：', __dirname);
//         // console.log('__filename：', __filename);
//         // console.log('process.cwd()：', process.cwd());
//         // console.log('./：', path.resolve('./'));
//         // console.log("db path:",path.join(__filename,'../session.list'));
//         this.completed = false;
//         const init = (async function () {
//             let obj = {};
//             const sql = '\
//                 CREATE TABLE if NOT EXISTS '+ namespance + '( \
//                     id CHAR(22) PRIMARY KEY NOT NULL, \
//                     data TEXT NOT NULL, \
//                     expire DATETIME NULL, \
//                     createtime DATETIME NOT NULL \
//                 ); \
//             ';
//             await sqlite3.exec(sql);
//             await AutoRemove(namespance);
//             obj.id = namespance.encrypt();
//             /**
//              * Session数量
//              */
//             obj.count = async function () {
//                 await AutoRemove(this.id.decrypt());
//                 let sql = "SELECT COUNT(1) n FROM " + this.id.decrypt();
//                 const _count = await sqlite3.get(sql);
//                 return _count.n;
//             };
//             /**
//              * Session列表
//              * @param {Number} limit 获取数量
//              */
//             obj.list = async function (limit = 0) {
//                 await AutoRemove(this.id.decrypt());
//                 let sql = "SELECT id,data,expire FROM " + this.id.decrypt() + " ORDER BY createtime DESC ";
//                 if (limit) {
//                     sql += ` LIMIT ${limit} `;
//                 }
//                 const list = await sqlite3.all(sql);
//                 return list;
//             };
//             /**
//              * 创建一个Session
//              * @param {String} data 用户数据
//              * @param {Number} expire 过期时间，单位秒，如果不传则永不过期
//              */
//             obj.create = async function (data, expire) {
//                 await AutoRemove(this.id.decrypt());
//                 if (!data) {
//                     throw new Error('data不能为空');
//                 }
//                 data = data.toString();
//                 let sql, sessionid = fac.guid.v22;
//                 if (expire) {
//                     expire = new Date(new Date().valueOf() + expire * 1000).format('yyyy-MM-dd hh:mm:ss');
//                     sql = "INSERT INTO " + this.id.decrypt() + "(id,data,expire,createtime)values(?,?,?,?);";
//                     await sqlite3.run(sql, [sessionid, data, expire, data, new Date().format('yyyy-MM-dd hh:mm:ss')]);
//                 } else {
//                     sql = "INSERT INTO " + this.id.decrypt() + "(id,data,createtime)values(?,?,?);";
//                     await sqlite3.run(sql, [sessionid, data, new Date().format('yyyy-MM-dd hh:mm:ss')]);
//                 }
//                 return sessionid;
//             };
//             /**
//              * 移除session
//              * @param {String} sessionid 需要删除的session
//              * @returns
//              */
//             obj.del = async function (sessionid) {
//                 await AutoRemove(this.id.decrypt());
//                 if (!sessionid) {
//                     throw new Error('sessionid不能为空');
//                 }
//                 sessionid = sessionid.toString();
//                 let sql = `DELETE FROM ${this.id.decrypt()} WHERE id = '${sessionid}'`;
//                 await sqlite3.run(sql);
//             };
//             /**
//              * 清空session
//              * @returns
//              */
//             obj.empty = async function () {
//                 let sql = `DELETE FROM ${this.id.decrypt()}`;
//                 await sqlite3.run(sql);
//             };
//             /**
//              * 延长session有效期
//              * @param {String} sessionid 需要延长的session
//              * @param {Number} time 延长时间，单位秒，如果不传则永不过期
//              * @returns
//              */
//             obj.expire = async function (sessionid, time = 0) {
//                 await AutoRemove(this.id.decrypt());
//                 if (!sessionid) {
//                     throw new Error('sessionid不能为空');
//                 }
//                 let sql = `SELECT expire FROM ${this.id.decrypt()} WHERE id = '${sessionid}'`;
//                 let session = await sqlite3.get(sql);
//                 if (session) {
//                     let time = new Date(new Date(session.expire).valueOf() + time * 1000).format('yyyy-MM-dd hh:mm:ss');
//                     sql = `UPDATE ${this.id.decrypt()} SET expire = '${time}' WHERE id = '${sessionid}'`;
//                     await sqlite3.run(sql);
//                 }
//             };
//             // this.completed = true;
//             // delete this.then;
//             return obj;
//         })();
//         // this.then = init.then.bind(init);
//         return init.then.bind(init);
//     }
// };