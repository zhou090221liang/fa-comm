// const sqlite3 = require('sqlite3');

// module.exports = class {
//     //创建一个sqlite3数据库连接
//     constructor(name = ":memory:", showstdout = true) {
//         this.name = name;
//         showstdout = showstdout != undefined ? showstdout : true;
//         this.db = new sqlite3.Database(name, function (err) {
//             if (err) {
//                 showstdout && console.error(`sqlite3(${name}) connection failed:${err}`.toError());
//             } else {
//                 showstdout && console.info(`sqlite3(${name}) connection success`.toInfo())
//             }
//         });
//         //执行DDL和DML语句
//         this.run = function (sql, params) {
//             params = params || [];
//             return new Promise((resolve, reject) => {
//                 this.db.run(sql, params, function (err) {
//                     if (err) {
//                         showstdout && console.warn(`sqlite3(${name}) query sql:${sql} failed:${err}`.toWarn());
//                         reject(err)
//                     } else {
//                         const result = { changes: this.changes, lastId: this.lastID };
//                         showstdout && console.info(`sqlite3(${name}) query sql:${sql} success,result:${JSON.stringify(result)}`.toInfo());
//                         resolve(result);
//                     }
//                 })
//             })
//         };
//         //查询所有数据 sql 的类型是DQL
//         this.all = function (sql, params) {
//             params = params || [];
//             return new Promise((resolve, reject) => {
//                 this.db.all(sql, params, function (err, result) {
//                     if (err) {
//                         showstdout && console.warn(`sqlite3(${name}) query sql:${sql} failed:${err}`.toWarn());
//                         reject(err)
//                     } else {
//                         showstdout && console.info(`sqlite3(${name}) query sql:${sql} success,result:${JSON.stringify(result)}`.toInfo());
//                         resolve(result)
//                     }
//                 })
//             })
//         };
//         //查询一条数据 sql 的类型是DQL
//         this.get = function (sql, params) {
//             params = params || [];
//             return new Promise((resolve, reject) => {
//                 this.db.get(sql, params, function (err, result) {
//                     if (err) {
//                         showstdout && console.warn(`sqlite3(${name}) query sql:${sql} failed:${err}`.toWarn());
//                         reject(err)
//                     } else {
//                         showstdout && console.info(`sqlite3(${name}) query sql:${sql} success,result:${JSON.stringify(result)}`.toInfo());
//                         resolve(result)
//                     }
//                 })
//             })
//         };
//         //执行多条语句 sql 的类型是DDL和DML
//         this.exec = function (sql) {
//             return new Promise((resolve, reject) => {
//                 this.db.exec(sql, function (err, result) {
//                     if (err) {
//                         showstdout && console.warn(`sqlite3(${name}) query sql:${sql} failed:${err}`.toWarn());
//                         reject(err)
//                     } else {
//                         showstdout && console.info(`sqlite3(${name}) query sql:${sql} success,result:${JSON.stringify(result)}`.toInfo());
//                         resolve(result)
//                     }
//                 })
//             })
//         };
//     };
// };