
require('./lib/comm/proto');
const path = require('path');
const fs = require('fs');
const mysql = require('./lib/db/mysql');
const redis = require('./lib/db/redis');
const rabbitmq = require('./lib/queue/rabbitmq');
const convert = require('./lib/comm/convert');
const verify = require('./lib/comm/verify');
const process = require('./lib/comm/process');
const ip = require('./lib/comm/ip');

let _global = {};
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
    //数据库配置 默认会在数据库里创建一张表 用于保存资源信息
    conf.mysql = conf.mysql || {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: 'root',
        database: 'mysql',
        timeout: 10000
    };
    //资源服务器监听的端口
    conf.port = conf.port && verify.isNumber(conf.port) && conf.port > 1 && conf.port <= 65535 ? conf.port : 19468;
    //允许的最大上传文件大小 单位字节 默认50MB
    conf.size = conf.size && verify.isNumber(conf.port) ? conf.size : (50 * 1024 * 1024);
    //资源上传路径 默认为当前目录
    conf.path = conf.path && verify.isString(conf.path) ? conf.path : path.join(__dirname, '../fa-comm.uploads');
    if (!fs.existsSync(conf.path)) {
        fs.mkdirSync(conf.path);
    }
    conf = [JSON.stringify(conf)];
    process.start(path.join(__dirname, './lib/http/resource.js'), conf);
    setTimeout(() => {
        console.group('----------------------------------- Api Info -----------------------------------');
        console.info(`详细Api请参考:http://${ip.local}:${JSON.parse(conf[0]).port}`);
        console.info('GET请求用于资源的查看、预览、下载等操作');
        console.info('POST(form-data)请求用于资源的上传操作,且可带入字符串形式的参,用于业务扩展');
        console.groupEnd();
        console.info('----------------------------------- Api Info -----------------------------------');
    }, 3000);
};
module.exports = _module;