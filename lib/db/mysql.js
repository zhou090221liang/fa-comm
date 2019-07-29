const verify = require('../comm/verify');
const guid = require('../comm/guid');
const mysqld = require('mysql');

/** 
 * Mysql操作类
*/
let MySQL = class {
    /** 
     * Mysql对象构造函数
     * @param {JSON} options 连接配置对象
     */
    constructor(options) {
        options.host = options.host || (options.uri || (options.url || "127.0.0.1"));
        options.port = options.port || 3306;
        options.user = options.user || (options.username || (options.loginid || "root"));
        options.password = options.password || (options.pwd || (options.pass || "root"));
        options.database = options.database || (options.db || "mysql");
        options.multipleStatements = options.multipleStatements != void 0 ? options.multipleStatements : true;
        options.insecureAuth = options.insecureAuth != void 0 ? options.insecureAuth : true;
        options.connectionLimit = options.connectionLimit || 10;
        options.charset = options.charset || "utf8mb4";
        options.timeout = options.timeout || 10000;
        options.acquireTimeout = options.timeout;
        options.connectTimeout = options.timeout;
        this._name = guid.v22;
        this._options = options;
        this._pool = mysqld.createPool(this._options);
        this.formatSQL = formatSQL;
        this.query = _queryByPool;
        this.list = _queryListByPool;
        this.getTable = _getTable;
        this.getConnection = _getConnection;
        this.getLongConnection = _getLongConnection;
        console.info(`create mysql client mysql://${options.host}/${options.database}?user=${options.user}&password=${options.password}&port=${options.port} success`.toInfo());
    };
};

/** 
 * mysql连接对象，可用于事物的处理。
 * 如果声明连接后，未开启事物，在执行完一次查询后，自动释放连接。
 * 如果声明连接后，已开启事物，则在commit或rollback后，自动释放。
*/
class MysqlConnection {
    /**
     * 数据库连接对象构造函数
     * @param {*} conn
     * @memberof MysqlConnection
     */
    constructor(conn, id, long) {
        this._long = long || false;
        this._name = guid.v22;
        this._id = id || 0;
        this._isrelease = false;
        this._transaction = false;
        this._conn = conn;
        this.query = _queryByConn;
        this.beginTransaction = _beginTransaction;
        this.commit = _commit;
        this.rollback = _rollback;
        this.release = _release;
    };
};

/**
 * 格式化SQL语句
 * @param {String} sql 需要格式化的sql
 * @param {JSON} options 格式化的数据源
 * @returns
 */
function formatSQL(sql, options) {
    for (var k in options) {
        // if (typeof options[k] != 'function') {
        var reg = new RegExp("@" + k + "@", "g");
        //字符串最后一位是$需要再添加一个$去转义
        if (typeof options[k] == 'string') {
            if (options[k].substr(options[k].length - 1, 1) == '$') {
                options[k] += '$';
            }
            sql = sql.replace(reg, mysqld.escape(options[k]));
        } else if (options[k] instanceof Date) {
            sql = sql.replace(reg, mysqld.escape(options[k].format('yyyy-MM-dd hh:mm:ss')));
        } else if (options[k] instanceof Array) {
            sql = sql.replace(reg, `'${options[k].join("','")}'`);
        } else if (typeof options[k] === 'number') {
            sql = sql.replace(reg, `'${options[k].toString()}'`);
        } else if (options[k] === null) {
            sql = sql.replace(reg, `NULL`);
        }
        // }
    }
    return sql;
}

/**
 * 执行一条sql语句
 * @param {String} sql 需要执行的sql
 * @param {JSON} data 数据源
 * @returns 执行结果
 */
function _queryByConn(sql, data) {
    let self = this;
    sql = formatSQL(sql, data);
    return new Promise(function (resolve, reject) {
        if (self._isrelease) {
            let err = `${self._long ? 'long' : 'short'} connection:${self._id}(${self._name}) is released`;
            console.warn(err.toWarn());
            reject(new Error(err));
        }
        else {
            self._conn.query(sql, function (err, result) {
                if (err) {
                    console.warn(`${self._long ? 'long' : 'short'} connection:${self._id}(${self._name}) query sql failed:${err}`.toError());
                    reject(err);
                } else {
                    console.info(`${self._long ? 'long' : 'short'} connetcion:${self._id}(${self._name}) query sql:${sql} success,result:${verify.isJsonArray(result) || verify.isJson(result) ? JSON.stringify(result) : result.toString()}`.toInfo());
                    if (!self._transaction && !self._long) {
                        self.release();
                    }
                    resolve(result);
                }
            });
        }
    });
}

/**
 * 开启事物
 * @returns
 */
function _beginTransaction() {
    let self = this;
    return new Promise(function (resolve, reject) {
        if (self._isrelease) {
            let err = `${self._long ? 'long' : 'short'} connection:${self._id}(${self._name}) is released`;
            console.warn(err.toWarn());
            reject(new Error(err));
        }
        else {
            self._conn.beginTransaction(function (err, res) {
                if (err) {
                    console.warn(`${self._long ? 'long' : 'short'} connection:${self._id}(${self._name}) beginTransaction error:${err}`.toWarn());
                    reject(err);
                } else {
                    console.info(`${self._long ? 'long' : 'short'} connection:${self._id}(${self._name}) beginTransaction success`.toInfo());
                    self._transaction = true;
                    resolve();
                }
            });
        }
    });
}

/**
 * 提交事物
 * @returns
 */
function _commit() {
    let self = this;
    return new Promise(function (resolve, reject) {
        if (self._isrelease) {
            let err = `${self._long ? 'long' : 'short'} connection:${self._id}(${self._name}) is released`;
            console.warn(err.toWarn());
            reject(new Error(err));
        }
        else if (self._transaction) {
            self._conn.commit(function (err, res) {
                if (err) {
                    console.warn(`${self._long ? 'long' : 'short'} connection:${self._id}(${self._name}) commit transaction error:${err}`.toWarn());
                    reject(err);
                } else {
                    console.warn(`${self._long ? 'long' : 'short'} connection:${self._id}(${self._name}) commit transaction success`.toInfo());
                    if (!self._long) {
                        self.release();
                    }
                    resolve();
                }
            });
        } else {
            let err = `${self._long ? 'long' : 'short'} connection:${self._id}(${self._name}) is not begin transaction`;
            console.warn(err.toWarn());
            reject(new Error(err));
        }
    });
}

/**
 * 回滚事物
 * @returns
 */
function _rollback() {
    let self = this;
    return new Promise(function (resolve, reject) {
        if (self._isrelease) {
            let err = `${self._long ? 'long' : 'short'} connection:${self._id}(${self._name}) is released`;
            console.warn(err.toWarn());
            reject(new Error(err));
        }
        else if (self._transaction) {
            self._conn.rollback(function (err, res) {
                if (err) {
                    console.warn(`${self._long ? 'long' : 'short'} connection:${self._id}(${self._name}) rollback transaction error:${err}`.toWarn());
                    reject(err);
                } else {
                    console.info(`${self._long ? 'long' : 'short'} connection:${self._id}(${self._name}) rollback transaction success`.toInfo());
                    if (!self._long) {
                        self.release();
                    }
                    resolve();
                }
            });
        } else {
            let err = `${self._long ? 'long' : 'short'} connection:${self._id}(${self._name}) is not begin transaction`;
            console.warn(err.toWarn());
            reject(new Error(err));
        }
    });
}

/**
 * 释放连接
 * @returns
 */
function _release() {
    let self = this;
    return new Promise(function (resolve, reject) {
        if (self._isrelease) {
            let err = `${self._long ? 'long' : 'short'} connection:${self._id}(${self._name}) is released`;
            console.warn(err.toWarn());
            reject(new Error(err));
        }
        else {
            self._conn.release();
            self._isrelease = true;
            self._transaction = false;
            console.info(`${self._long ? 'long' : 'short'} connection:${self._id}(${self._name}) release success`.toInfo());
            resolve();
        }
    });
}

/**
 * 获取一个短连接，在未开启事物的情况下，执行完query会自动释放;
 * 在开启事物的情况下，执行commit或roolback后会自动释放
 * @returns
 */
function _getConnection() {
    // MySQL.prototype.getConnection = function () {
    var self = this;
    return new Promise(function (resolve, reject) {
        try {
            if (self._pool._allConnections.length >= self._options.connectionLimit) {
                console.warn(`get connection failed:Exceeding the maximum limit of 10`.toWarn());
                resolve(null);
            } else {
                self._pool.getConnection(function (err, connection) {
                    if (err) {
                        console.error(`get connection error:${err}`.toError());
                        // resolve(null);
                        reject(err);
                    }
                    else {
                        let _MysqlConnection = new MysqlConnection(connection, self._pool._allConnections.length);
                        console.info(`get ${self._long ? 'long' : 'short'} connection:${_MysqlConnection._id}(${_MysqlConnection._name}) success`.toInfo());
                        resolve(_MysqlConnection);
                    }
                });
            }
        } catch (e) {
            console.error(`get connection error:${err}`.toError());
            // resolve(null);
            reject(e);
        }
    });
};

/**
 * 获取一个长连接，无论何种情况下，都不会自动释放连接，需要手动调用release释放
 * @returns
 */
function _getLongConnection() {
    // MySQL.prototype.getLongConnection = function () {
    var self = this;
    return new Promise(function (resolve, reject) {
        try {
            if (self._pool._allConnections.length >= self._options.connectionLimit) {
                console.warn(`get connection failed:Exceeding the maximum limit of 10`.toWarn());
                resolve(null);
            } else {
                self._pool.getConnection(function (err, connection) {
                    if (err) {
                        console.error(`get connection error:${err}`.toError());
                        reject(err);
                    }
                    else {
                        let _MysqlConnection = new MysqlConnection(connection, self._pool._allConnections.length, true);
                        console.info(`get ${_MysqlConnection._long ? 'long' : 'short'} connection:${_MysqlConnection._id}(${_MysqlConnection._name}) success`.toInfo());
                        resolve(_MysqlConnection);
                    }
                });
            }
        } catch (e) {
            console.error(`get ${self._long ? 'long' : 'short'} connection error:${err}`.toError());
            // resolve(null);
            reject(e);
        }
    });
};

/**
 * 执行一条SQL语句，并自动释放连接，无需手动release
 * @param {*} sql 需要自行的sql语句
 * @param {JSON} data 数据源
 * @returns
 */
function _queryByPool(sql, data) {
    // MySQL.prototype.query = function (sql, data) {
    var self = this;
    sql = formatSQL(sql, data);
    return new Promise(function (resolve, reject) {
        try {
            self._pool.query(sql, function (err, result) {
                if (err) {
                    console.warn(`connection pool query sql:${sql} failed:${err}`.toWarn());
                    reject(err);
                } else {
                    let _result = '';
                    try {
                        _result = JSON.stringify(result);
                    } catch (e) {
                        _result = result.toString();
                    }
                    _result = 'connection pool query sql:' + sql + ' success,result:' + _result;
                    console.info(_result.toInfo());
                    resolve(result);
                }
            });
        } catch (e) {
            console.error(`connection pool query sql error:${sql} ${err}`.toError());
            // resolve(null);
            reject(e);
        }
    });
};

/**
 * 执行一条分页查询语句，并自动释放连接，无需手动release
 * @param {String} sql 需要自行的sql语句
 * @param {JSON} data 数据源
 * @param {JSON} page 分页信息
 * @param {String/JSON} order 排序
 * @returns
 */
function _queryListByPool(sql, data, page, order) {
    sql = sql || "";
    data = data || {};
    page = page || {};
    order = order || "";
    if (verify.isJson(order)) {
        if (order.column && order.type) {
            order = `order by ${order.column} ${order.type}`;
        } else {
            order = "";
        }
    }
    order = order.toText();
    var self = this;
    sql = formatSQL(sql, data);
    return new Promise(function (resolve, reject) {
        try {
            //limit (pageindex - 1) * pagesize,pagesize
            const p1 = ((page.index || 1) - 1) * (page.size || 10);
            const p2 = page.size || 10;
            const sql1 = `${sql} ${order} limit ${p1},${p2};`;
            const sql2 = `select count(1) count from (${sql}) tb;`;
            Promise.all([self.query(sql1), self.query(sql2)]).then(function (result) {
                resolve({ list: result[0], count: result[1][0].count });
            }).catch(function (err) {
                reject(err);
            });
        } catch (e) {
            console.error(`connection pool query sql error:${sql} ${err}`.toError());
            // resolve(null);
            reject(e);
        }
    });
};

/**
 * 获取表对象
 * @param {String} table_name 表名称
 * @returns 表空间对象
 */
function _getTable(table_name) {
    // MySQL.prototype.getTable = function (table_name) {
    var self = this;
    return new Promise(function (resolve, reject) {
        self._pool.query(`\
            select * from information_schema.columns \
            where table_schema = '${self._options.database}' \
            and table_name = '${table_name}'`, function (err, result) {
                if (err) {
                    console.warn(`get table ${table_name} failed:${err}`.toWarn());
                    reject(err);
                } else {
                    if (result && result.length) {
                        console.info(`get table ${table_name} success`.toInfo());
                        resolve({
                            'name': table_name,
                            'schema': result,
                            'insert': _insert,
                            'update': _update,
                            'delete': _delete,
                            'select': _select,
                            'root': self
                        });
                    } else {
                        console.warn(`get table ${table_name} failed,table is not exists`.toWarn());
                        resolve(null);
                    }
                }
            });
    });
}

/**
 * 寻找唯一主键
 * @param {*} schema 表结构
 * @returns
 */
function findPRI(schema) {
    for (let i = 0; i < schema.length; i++) {
        if (schema[i].COLUMN_KEY == "PRI") {
            return schema[i];
        }
    }
    return undefined;
}

/**
 * 获取结构对象
 * @param {*} schema 表结构
 * @returns
 */
function getStucture(schema) {
    let stucture = {};
    for (let i = 0; i < schema.length; i++) {
        if (schema[i].COLUMN_KEY != "PRI" || (schema[i].COLUMN_KEY == "PRI" && schema[i].EXTRA != "auto_increment")) {
            if (schema[i].COLUMN_KEY == "PRI") {
                stucture[schema[i].COLUMN_NAME] = guid.v22;
            } else {
                stucture[schema[i].COLUMN_NAME] = null;
            }
        }
    }
    return stucture;
}

/**
 * 获取标准结构数据
 * @param {*} schema 表结构
 * @param {*} data 数据源
 * @returns
 */
function getStuctureData(schema, data) {
    let _data = {};
    for (let i = 0; i < schema.length; i++) {
        if (schema[i].COLUMN_KEY == "PRI") {
            if (schema[i].EXTRA == "auto_increment") {
                _data[schema[i].COLUMN_NAME] = 0;
            } else {
                _data[schema[i].COLUMN_NAME] = guid.v22;
            }
        }
        if (schema[i].COLUMN_DEFAULT) {
            if (schema[i].COLUMN_DEFAULT != 'CURRENT_TIMESTAMP') {
                _data[schema[i].COLUMN_NAME] = schema[i].COLUMN_DEFAULT;
            } else {
                _data[schema[i].COLUMN_NAME] = new Date().format('yyyy-MM-dd hh:mm:ss');
            }
        }
        _data[schema[i].COLUMN_NAME] = data[schema[i].COLUMN_NAME] != void 0 ?
            data[schema[i].COLUMN_NAME] : (_data[schema[i].COLUMN_NAME] || null);
    }
    return _data;
}

function _existsColumnByTable(schema, column) {
    for (const row of schema) {
        if (row.COLUMN_NAME == column) {
            return true;
        }
    }
    return false;
}

/**
 * 新增一行数据
 * @param {*} data 需要新增的数据源
 */
function _insert(data) {
    let self = this;
    return new Promise(function (resolve, reject) {
        let pri = findPRI(self.schema);
        let _data = getStuctureData(self.schema, data);
        let columns = new Array();
        let sql = `INSERT INTO ${self.name} (`;
        for (let key in _data) {
            if (pri.COLUMN_NAME == key) {
                if (pri.EXTRA != 'auto_increment') {
                    columns.push(key);
                }
            } else {
                if (_existsColumnByTable(self.schema, key)) {
                    columns.push(key);
                }
            }
        }
        sql += columns.join(",");
        sql += `) VALUES (@${columns.join("@,@")}@);`;
        sql = formatSQL(sql, _data);
        try {
            self.root._pool.query(sql, function (err, result) {
                if (err) {
                    console.warn(`connection pool query [insert] sql:${sql} failed:${err}`.toWarn());
                    reject(err);
                } else {
                    result.insertId = result.insertId || _data[pri.COLUMN_NAME];
                    console.info(`connection pool query [insert] sql:${sql} success,result:${verify.isJsonArray(result) || verify.isJson(result) ? JSON.stringify(result) : result.toString()}`.toInfo());
                    resolve(result);
                }
            });
        } catch (e) {
            console.error(`connection pool query [insert] sql error:${sql} ${err}`.toError());
            reject(e);
        }
    });
}
function _update(data) {
    let self = this;
    return new Promise(function (resolve, reject) {
        let pri = findPRI(self.schema);
        let sql = `UPDATE ${self.name} SET`;
        let where = ``, update = new Array();
        for (let key in data) {
            if (pri.COLUMN_NAME == key) {
                where = `${pri.COLUMN_NAME} = @${pri.COLUMN_NAME}@`;
            } else {
                if (_existsColumnByTable(self.schema, key)) {
                    update.push(`${key} = @${key}@`);
                }
            }
        }
        sql = `${sql} ${update.join(',')} where ${where};`;
        sql = formatSQL(sql, data);
        try {
            self.root._pool.query(sql, function (err, result) {
                if (err) {
                    console.warn(`connection pool query [update] sql:${sql} failed:${err}`.toWarn());
                    reject(err);
                } else {
                    console.info(`connection pool query [update] sql:${sql} success,result:${JSON.stringify(result)}`.toInfo());
                    resolve(result);
                }
            });
        } catch (e) {
            console.error(`connection pool query [update] sql error:${sql} ${err}`.toError());
            reject(e);
        }
    });
}

/**
 * 根据主键删除记录
 * @param {*} pk_value 主键的值
 */
function _delete(pk_value) {
    let self = this;
    return new Promise(function (resolve, reject) {
        let pri = findPRI(self.schema);
        let sql = `DELETE FROM ${self.name} WHERE ${pri.COLUMN_NAME} = @${pri.COLUMN_NAME}@;`;
        let data = {};
        data[pri.COLUMN_NAME] = pk_value;
        sql = formatSQL(sql, data);
        try {
            self.root._pool.query(sql, function (err, result) {
                if (err) {
                    console.warn(`connection pool query [delete] sql:${sql} failed:${err}`.toWarn());
                    reject(err);
                } else {
                    console.info(`connection pool query [delete] sql:${sql} success,result:${JSON.stringify(result)}`.toInfo());
                    resolve(result);
                }
            });
        } catch (e) {
            console.error(`connection pool query [delete] sql error:${sql} ${err}`.toError());
            reject(e);
        }
    });
}
/**
 * 根据主键查询记录
 * @param {*} pk_value 主键的值
 * @param {*} convert_date 是否将时间类型的字段转换成字符串格式
 * @returns
 */
function _select(pk_value, convert_date) {
    let self = this;
    convert_date = convert_date != undefined ? convert_date : true;
    return new Promise(function (resolve, reject) {
        let pri = findPRI(self.schema);
        let columns = new Array();
        if (convert_date == false) {
            columns.push('*');
        } else {
            for (let schema of self.schema) {
                if (schema.DATA_TYPE.toLowerCase() == "date") {
                    columns.push(`DATE_FORMAT(${schema.COLUMN_NAME},'%Y-%m-%d') AS ${schema.COLUMN_NAME}`);
                }
                else if (schema.DATA_TYPE.toLowerCase() == "datetime") {
                    columns.push(`DATE_FORMAT(${schema.COLUMN_NAME},'%Y-%m-%d %H:%i:%s') AS ${schema.COLUMN_NAME}`);
                } else {
                    columns.push(schema.COLUMN_NAME);
                }
            }
        }
        let sql = `SELECT ${columns} FROM ${self.name} WHERE ${pri.COLUMN_NAME} = @${pri.COLUMN_NAME}@;`;
        let data = {};
        data[pri.COLUMN_NAME] = pk_value;
        sql = formatSQL(sql, data);
        try {
            self.root._pool.query(sql, function (err, result) {
                if (err) {
                    console.warn(`connection pool query [select] sql:${sql} failed:${err}`.toWarn());
                    reject(err);
                } else {
                    result = result && result.length ? result[0] : undefined;
                    if (result != undefined)
                        console.info(`connection pool query [select] sql:${sql} success,result:${JSON.stringify(result)}`.toInfo());
                    console.info(`connection pool query [select] sql:${sql} success,result:`.toInfo());
                    resolve(result);
                }
            });
        } catch (e) {
            console.error(`connection pool query [select] sql error:${sql} ${err}`.toError());
            reject(e);
        }
    });
}

module.exports = MySQL;