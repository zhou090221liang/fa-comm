
require('./lib/comm/proto');
const path = require('path');
const fs = require('fs');
const mysql = require('./lib/db/mysql');
const sqlite3 = require('./lib/db/sqlite3');
const redis = require('./lib/db/redis');
const rabbitmq = require('./lib/queue/rabbitmq');
const convert = require('./lib/comm/convert');
const verify = require('./lib/comm/verify');
const _process = require('./lib/comm/process');
const ip = require('./lib/comm/ip');
const _fs = require('./lib/comm/fs');
const sdk = require('./lib/comm/sdk');


let _global = {
    sqlite3DbName: "fa-comm.db"
};
let _module = {};

_module.convert = require('./lib/comm/convert');
_module.fs = require('./lib/comm/fs');
_module.guid = require('./lib/comm/guid');
_module.ip = require('./lib/comm/ip');
_module.live = require('./lib/comm/live');
_module.process = require('./lib/comm/process');
_module.progress = require('./lib/comm/progress');
_module.random = require('./lib/comm/random');
_module.req = require('./lib/comm/req');
_module.system = require('./lib/comm/system');
_module.verify = require('./lib/comm/verify');
_module.sdk = sdk;
_module.sqlite3 = sqlite3;

async function init() {
    const db = new sqlite3(_global.sqlite3DbName);
    const api_log = `\
        create table if not exists api_log(
            id char(22) primary key not null,
            qid char(22) NOT NULL,
            pid char(20) NOT NULL,
            ip char(30) NOT NULL,
            url text,
            path text,
            method char(50),
            query text,
            params text,
            body text,
            headers text,
            req_time datetime,
            res_status int,
            res_message text,
            res_time datetime
        );\
    `;
    await db.run(api_log, null, false);
    const resource = `\
        create table if not exists upload(\
            id char(32) primary key not null, \
            size bigint, \
            form varchar(200), \
            origin_name varchar(500), \
            type varchar(200), \
            boundary varchar(500), \
            file_name varchar(500), \
            path text, \
            md5 char(32), \
            batch char(22), \
            upload_time datetime, \
            extend text
        );\
    `;
    await db.run(resource, null, false);
    const socket_log = "\
        create table if not exists socket_log( \
            id char(22) primary key not null, \
            from varchar(50) NOT NULL, \
            to varchar(50) NOT NULL, \
            pid char(20) NOT NULL, \
            url text, \
            body text, \
            send_time datetime \
        );\
    ";
    await db.run(socket_log, null, false);
}
init();

/**
 * 全局对象
 * @returns
 */
_module.global = () => {
    return _global;
};

function getCallerFileNameAndLine() {
    function getException() {
        try {
            throw Error('');
        } catch (err) {
            return err;
        }
    }
    const err = getException();
    const stack = err.stack;
    const stackArr = stack.split('\n');
    let callerLogIndex = 0;
    let str = '';
    for (let i = stackArr.length - 1; i >= 0; i--) {
        //at Server.<anonymous> (/Users/zhouxiaoyue/Documents/SoftwareDev/Gitee/server/api/lib/server.js:281:9)
        //at Object.<anonymous> (/Users/zhouxiaoyue/Documents/SoftwareDev/Gitee/server/api/lib/server.js:281:9)
        if (stackArr[i].indexOf('at Object.<anonymous> (') > -1) {
            str = 'at Object.<anonymous> (';
            callerLogIndex = i;
            break;
        }
        if (stackArr[i].indexOf('at Server.<anonymous> (') > -1) {
            str = 'at Server.<anonymous> (';
            callerLogIndex = i;
            break;
        }
    }
    if (callerLogIndex !== 0) {
        const callerStackLine = stackArr[callerLogIndex];
        return callerStackLine.Trim().replace(str, '').substring(0, callerStackLine.Trim().replace(str, '').length - 1);
    } else {
        return '';
    }
}

/**
 * 创建日志对象
 * @param {String} name 日志文件名称
 * @param {String} dir 日志存放路径
 */
_module.createLog = (name, dir) => {
    let logObj = {};
    const date = new Date().format('yyyy-MM-dd')
    logObj._newline = '\r\n';
    logObj._name = name || "default";
    logObj._outfile = logObj._name + "_" + date + ".out";
    logObj._logfile = logObj._name + "_" + date + ".log";
    logObj._infofile = logObj._name + "_" + date + ".info";
    logObj._warnfile = logObj._name + "_" + date + ".warn";
    logObj._errorfile = logObj._name + "_" + date + ".error";
    if (dir) {
        logObj._dir = dir;
    } else {
        logObj._dir = path.join(__dirname, '../../logs/');
    }
    logObj._outpath = logObj._dir + logObj._outfile;
    logObj._logpath = logObj._dir + logObj._logfile;
    logObj._infopath = logObj._dir + logObj._infofile;
    logObj._warnpath = logObj._dir + logObj._warnfile;
    logObj._errorpath = logObj._dir + logObj._errorfile;
    _module.fs.mkfileSync(logObj._outpath);
    _module.fs.mkfileSync(logObj._logpath);
    _module.fs.mkfileSync(logObj._infopath);
    _module.fs.mkfileSync(logObj._warnpath);
    _module.fs.mkfileSync(logObj._errorpath);
    logObj.log = (...message) => {
        // let _message = ['[LOG]\t' + new Date().format('yyyy-MM-dd hh:mm:ss') + '\t' + _module.process.id + '\t[' + getCallerFileNameAndLine() + ']\t'];
        let _message = ['[LOG]\t' + new Date().format('yyyy-MM-dd hh:mm:ss') + '\t' + _module.process.id + '\t'];
        for (const msg of message) {
            _message.push(convert.toString(msg));
        }
        console.log(_message.join(' '));
        fs.appendFileSync(logObj._logpath, _message.join('') + logObj._newline);
        fs.appendFileSync(logObj._outpath, _message.join('') + logObj._newline);
    };
    logObj.info = (...message) => {
        // let _message = ['[INFO]\t' + new Date().format('yyyy-MM-dd hh:mm:ss') + '\t' + _module.process.id + '\t[' + getCallerFileNameAndLine() + ']\t'];
        let _message = ['[INFO]\t' + new Date().format('yyyy-MM-dd hh:mm:ss') + '\t' + _module.process.id + '\t'];
        for (const msg of message) {
            _message.push(convert.toString(msg));
        }
        console.info(_message.join(' '));
        fs.appendFileSync(logObj._infopath, _message.join('') + logObj._newline);
        fs.appendFileSync(logObj._outpath, _message.join('') + logObj._newline);
    };
    logObj.warn = (...message) => {
        // let _message = ['[WARN]\t' + new Date().format('yyyy-MM-dd hh:mm:ss') + '\t' + _module.process.id + '\t[' + getCallerFileNameAndLine() + ']\t'];
        let _message = ['[WARN]\t' + new Date().format('yyyy-MM-dd hh:mm:ss') + '\t' + _module.process.id + '\t'];
        for (const msg of message) {
            _message.push(convert.toString(msg));
        }
        console.warn(_message.join(' '));
        fs.appendFileSync(logObj._warnpath, _message.join('') + logObj._newline);
        fs.appendFileSync(logObj._outpath, _message.join('') + logObj._newline);
    };
    logObj.error = (...message) => {
        // let _message = ['[ERROR]\t' + new Date().format('yyyy-MM-dd hh:mm:ss') + '\t' + _module.process.id + '\t[' + getCallerFileNameAndLine() + ']\t'];
        let _message = ['[ERROR]\t' + new Date().format('yyyy-MM-dd hh:mm:ss') + '\t' + _module.process.id + '\t'];
        for (const msg of message) {
            _message.push(convert.toString(msg));
        }
        console.error(_message.join(' '));
        fs.appendFileSync(logObj._errorpath, _message.join('') + logObj._newline);
        fs.appendFileSync(logObj._outpath, _message.join('') + logObj._newline);
    };
    return logObj;
}

/**
 * 创建RabbitMq连接
 * @param {*} connection
 * @returns
 */
_module.createRabbitmqConn = (connection) => {
    return rabbitmq.createRabbitMqConn(connection);
};

/**
 * 创建Mysql连接
 * @param {*} connection
 */
_module.createMysqlConn = (connection) => {
    return new mysql(connection);
};

/**
 * 创建Redis连接
 * @param {*} connection
 * @returns
 */
_module.createRedisConn = (connection) => {
    return new redis(connection);
};

/**
 * 各种监听服务
 * @returns
 */
_module.service = {};

/**
 * 启动资源服务器(资源文件的上传、下载等)
 * @param {JSON} conf 配置文件
 * @returns
 */
_module.service.resource = (conf) => {
    conf = conf && verify.isJson(conf) ? conf : {};
    // //数据库配置 默认会在数据库里创建一张表 用于保存资源信息
    // conf.mysql = conf.mysql || {
    //     host: '127.0.0.1',
    //     port: 3306,
    //     user: 'root',
    //     password: 'root',
    //     database: 'mysql',
    //     timeout: 10000
    // };
    //资源服务器监听的端口
    conf.port = conf.port && verify.isNumber(conf.port) && conf.port > 1 && conf.port <= 65535 ? conf.port : 19468;
    //允许的最大上传文件大小 单位字节 默认50MB
    conf.size = conf.size && verify.isNumber(conf.port) ? conf.size : (50 * 1024 * 1024);
    //资源上传路径 默认为当前目录
    conf.path = conf.path && verify.isString(conf.path) ? conf.path : path.join(__dirname, '../fa-comm.uploads');
    if (!fs.existsSync(conf.path)) {
        _fs.mkdirSync(conf.path);
    }
    conf = [JSON.stringify(conf)];
    _process.start(path.join(__dirname, './lib/http/resource.js'), conf, null, true, false);
    setTimeout(() => {
        console.group('----------------------------------- Api Info -----------------------------------');
        console.info(`详细Api请参考:http://${ip.local}:${JSON.parse(conf[0]).port}`);
        console.info('GET请求用于资源的查看、预览、下载等操作');
        console.info('POST(form-data)请求用于资源的上传操作,且可带入字符串形式的参,用于业务扩展');
        console.groupEnd();
        console.info('----------------------------------- Api Info -----------------------------------');
    }, 3000);
};

/**
 * 启动Api接口服务器(提供接口服务)
 * @param {JSON} options 配置文件
 * @returns
 */
_module.service.api = (options) => {
    try {
        options = options || {};
        // //数据库配置
        // options.mysql = options.mysql || {
        //     host: '127.0.0.1',
        //     port: 3306,
        //     user: 'root',
        //     password: 'root',
        //     database: 'mysql',
        //     timeout: 10000
        // };
        // //redis配置
        // options.redis = options.redis || {
        //     host: '127.0.0.1',
        //     port: 6379,
        //     password: ''
        // };
        //Api服务器监听的端口
        options.port = options.port && verify.isNumber(options.port) && options.port > 1 && options.port <= 65535 ? options.port : 19469;
        //Api服务器对应的业务代码存放目录
        options.root = options.root && verify.isString(options.root) ? options.root : process.cwd();
        //中间件目录
        // options.middleware && verify.isString(options.middleware) ? options.middleware : null;
        let _middleware = null;
        if (options.middleware && verify.isString(options.middleware) && fs.existsSync(options.middleware)) {
            _middleware = options.middleware;
        }
        let middlewarePath = options.root;
        if (!middlewarePath.endWith(path.sep)) {
            middlewarePath += path.sep + 'middleware';
        }
        if (fs.existsSync(middlewarePath)) {
            _middleware = middlewarePath;
        }
        if (_middleware) {
            options.middleware = _middleware;
        }
        _process.start(path.join(__dirname, './lib/http/api.js'), [JSON.stringify(options)], null, true, false);
        setTimeout(() => {
            console.group('----------------------------------- Api Info -----------------------------------');
            console.info('Api服务,目前已经实现的内容：');
            console.info(`1、HTTP/1.1 监听，监听端口默认19469${options.port != 19469 ? `(当前端口:${options.port})` : ""}，可在配置文件中自定义port`);
            console.info('2、配置文件可自定义配置项root（Api服务器对应的业务代码存放目录）及middleware（中间件目录）');
            console.info('3、接口定义，参考test/api/routers.js');
            console.info('4、各种定义，参考test/api/，该目录可理解为demo');
            console.groupEnd();
            console.info('----------------------------------- Api Info -----------------------------------');
        }, 3000);
    } catch (e) {
        console.error(e);
    }
};

/**
 * 启动Socket接口服务器(提供WebSocket服务)
 * @param {JSON} options 配置文件
 * @returns
 */
_module.service.websocket = _module.service.ws = async (options) => {
    try {
        options = options || {};
        // //数据库配置
        // options.mysql = options.mysql || {
        //     host: '127.0.0.1',
        //     port: 3306,
        //     user: 'root',
        //     password: 'root',
        //     database: 'mysql',
        //     timeout: 10000
        // };
        //端口
        options.port = options.port && verify.isNumber(options.port) && options.port > 1 && options.port <= 65535 ? options.port : 19467;
        //服务器对应的业务代码存放目录
        options.root = options.root && verify.isString(options.root) ? options.root : process.cwd();
        // _process.start(path.join(__dirname, './lib/http/socket.js'), [JSON.stringify(options)], null, true, false);

        setTimeout(() => {
            console.group('----------------------------------- Socket Info -----------------------------------');
            console.info('Socket服务,目前已经实现的内容：');
            console.info(`1、WebSocket服务端 监听，监听端口默认19467${options.port != 19467 ? `(当前端口:${options.port})` : ""}，可在配置文件中自定义port`);
            console.info('2、配置文件可自定义配置项root（Socket服务器对应的业务代码存放目录）');
            console.groupEnd();
            console.info('----------------------------------- Socket Info -----------------------------------');
        }, 3000);

        const socket = require('./lib/http/socket');
        const server = await socket.createServer(options);
        return server;

    } catch (e) {
        console.error(e);
    }
};

/**
 * 解析路由业务文件
 * @param {*} _path
 * @returns
 */
_module.service.analyzing = (_path) => {
    let result = {};
    if (!_path.endWith(path.sep)) {
        _path += path.sep;
    }
    const files = _fs.findfilesSync(_path);
    files.forEach((file, index) => {
        const basename = path.basename(file);
        const extname = path.extname(basename);
        let tmp = file.replace(_path, '').split(path.sep);
        let _result = result;
        tmp.forEach((t, _index) => {
            if (t == basename) {
                _result[t.replace(extname, '')] = require(file);
            } else {
                if (!_result[t]) {
                    _result[t] = {};
                }
                _result = _result[t];
            }
        });
    });
    return result;
}

module.exports = _module;