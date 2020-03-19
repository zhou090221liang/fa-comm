const sqlite3 = require('sqlite3');

module.exports = class {
    constructor(name = ":memory:") {
        this.name = name;
        this.db = new sqlite3.Database(name, (err) => {
            if (err) {
                console.error(`sqlite3(${name}) connection failed:${err}`.toError());
            } else {
                console.info(`sqlite3(${name}) connection success`.toInfo())
            }
        });
        this.run = function (sql, params, showstdout) {
            showstdout = showstdout != undefined ? showstdout : true;
            params = params || [];
            return new Promise((resolve, reject) => {
                this.db.run(sql, params, function (err) {
                    if (err) {
                        showstdout && console.warn(`sqlite3(${name}) query sql:${sql} failed:${err}`.toWarn());
                        reject(err)
                    } else {
                        const result = { changes: this.changes, lastId: this.lastID };
                        showstdout && console.info(`sqlite3(${name}) query sql:${sql} success,result:${JSON.stringify(result)}`.toInfo());
                        resolve(result);
                    }
                })
            })
        };
        this.all = function (sql, params, showstdout) {
            showstdout = showstdout != undefined ? showstdout : true;
            params = params || [];
            return new Promise((resolve, reject) => {
                this.db.all(sql, params, function (err, result) {
                    if (err) {
                        showstdout && console.warn(`sqlite3(${name}) query sql:${sql} failed:${err}`.toWarn());
                        reject(err)
                    } else {
                        showstdout && console.info(`sqlite3(${name}) query sql:${sql} success,result:${JSON.stringify(result)}`.toInfo());
                        resolve(result)
                    }
                })
            })
        };
        this.get = function (sql, params, showstdout) {
            showstdout = showstdout != undefined ? showstdout : true;
            params = params || [];
            return new Promise((resolve, reject) => {
                this.db.get(sql, params, function (err, result) {
                    if (err) {
                        showstdout && console.warn(`sqlite3(${name}) query sql:${sql} failed:${err}`.toWarn());
                        reject(err)
                    } else {
                        showstdout && console.info(`sqlite3(${name}) query sql:${sql} success,result:${JSON.stringify(result)}`.toInfo());
                        resolve(result)
                    }
                })
            })
        };
    };
};