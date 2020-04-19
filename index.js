
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
const guid = require('./lib/comm/guid');
const live = require('./lib/comm/live');
const _progress = require('./lib/comm/progress');
const random = require('./lib/comm/random');
const _req = require('./lib/comm/req');
const _system = require('./lib/comm/system');
// const db = require('./resource/db');
const mail = require('./lib/mail');
// db();
// const conf = require('./resource/conf');

let _global = {
    sqlite3DbName: 'fa-comm.db'
};
let _module = {};

_module.convert = convert;
_module.fs = _fs;
_module.guid = guid;
_module.ip = ip;
_module.live = live;
_module.process = _process;
_module.progress = _progress;
_module.random = random;
_module.req = _req;
_module.system = _system;
_module.verify = verify;
_module.sdk = sdk;
_module.sqlite3 = sqlite3;
_module.mail = mail;

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
 * @param {JSON} options 配置文件
 * @returns
 */
_module.service.resource = (options) => {
    options = options && verify.isJson(options) ? options : {};
    //资源服务器监听的端口
    options.port = options.port && verify.isNumber(options.port) && options.port > 1 && options.port <= 65535 ? options.port : 19468;
    //允许的最大上传文件大小 单位字节 默认50MB
    options.size = options.size && verify.isNumber(options.port) ? options.size : (10 * 1024 * 1024);
    //资源上传路径 默认为当前目录
    options.path = options.path && verify.isString(options.path) ? options.path : path.join(__dirname, '../fa-comm.uploads');
    if (!fs.existsSync(options.path)) {
        _fs.mkdirSync(options.path);
    }

    //sqlite3file
    options.sqlite3file = options.db;
    if (options.sqlite3file) {
        _fs.mkdirSync(options.sqlite3file);
        options.sqlite3file = path.join(options.sqlite3file, _global.sqlite3DbName);
    } else {
        options.sqlite3file = _global.sqlite3DbName;
    }
    const files = _fs.findfilesSync(path.join(__dirname, './resource/db/sql/'));
    const sqlite3Obj = new sqlite3(options.sqlite3DbName, false);
    for (const file of files) {
        const sql = fs.readFileSync(file).toString();
        sqlite3Obj.run(sql);
    }

    _process.start(path.join(__dirname, './lib/http/resource.js'), [JSON.stringify(options)], null, true, false);

    setTimeout(() => {
        console.group('----------------------------------- Resource Info -----------------------------------');
        console.info(`Resource服务（监听端口:${options.port}）,目前已经实现的内容（参考test/，该目录可理解为demo）：`);
        console.info('1、Resource(HTTP/1.1) 监听');
        console.info('2、自定义监听端口');
        console.info('3、自定义允许的最大上传文件大小');
        console.info('4、自定义资源上传路径');
        console.info('5、自定义框架日志目录');
        console.info('自定义配置项如下：');
        console.info('      1) port，该配置项为Resource监听的端口，如不配置，或配置错误，默认使用19468');
        console.info('      2) size，该配置项为允许的最大上传文件大小，配置一个数字，单位MB，如不配置，默认10MB。');
        console.info('      3) path，该配置项为一个目录，该目录用于存放上传的资源文件，如不配置，默认为当前启动文件所在目录下的fa-comm.uploads目录下。');
        console.info('      4) db，该配置项为一个目录，用于指定框架日志数据文件保存的位置，如不配置，默认为当前启动文件所在目录');
        console.groupEnd();
        console.info('----------------------------------- Resource Info -----------------------------------');
    }, 5000);
};

/**
 * 启动Api接口服务器(提供接口服务)
 * @param {JSON} options 配置文件
 * @returns
 */
_module.service.api = (options) => {
    try {
        options = options || {};
        //Api服务器监听的端口
        options.port = options.port && verify.isNumber(options.port) && options.port > 1 && options.port <= 65535 ? options.port : 19469;
        //Api服务器对应的业务代码存放目录
        options.root = options.root && verify.isString(options.root) ? options.root : process.cwd();
        //中间件目录
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
        //sqlite3file
        options.sqlite3file = options.db;
        if (options.sqlite3file) {
            _fs.mkdirSync(options.sqlite3file);
            options.sqlite3file = path.join(options.sqlite3file, _global.sqlite3DbName);
        } else {
            options.sqlite3file = _global.sqlite3DbName;
        }
        const files = _fs.findfilesSync(path.join(__dirname, './resource/db/sql/'));
        const sqlite3Obj = new sqlite3(options.sqlite3DbName, false);
        for (const file of files) {
            const sql = fs.readFileSync(file).toString();
            sqlite3Obj.run(sql);
        }

        _process.start(path.join(__dirname, './lib/http/api.js'), [JSON.stringify(options)], null, true, false);
        setTimeout(() => {
            console.group('----------------------------------- Api Info -----------------------------------');
            console.info(`Api服务（监听端口:${options.port}）,目前已经实现的内容（参考test/，该目录可理解为demo）：`);
            console.info('1、HTTP/1.1 监听');
            console.info('2、自定义监听端口');
            console.info('3、自定义业务代码目录');
            console.info('4、自定义Api接口');
            console.info('5、自定义Api接口中间件');
            console.info('6、自定义静态资源目录');
            console.info('7、自定义框架日志目录');
            console.info('自定义配置项如下：');
            console.info('      1) port，该配置项为HTTP监听的端口，如不配置，或配置错误，默认使用19469');
            console.info('      2) root，该配置项为一个目录，用于存放业务代码文件，如不配置，默认业务代码目录为当前启动文件所在目录。业务文件代码编写方式，请查看demo，主要由router.js及对应的执行器文件组成。');
            console.info('      3) middleware，该配置项为一个目录，该目录用于存放中间件代码文件，中间件执行顺序按照文件名排列顺序执行，如需自定义执行顺序，可通过定义文件名进行排序执行，如不配置，默认将不使用中间件。中间件代码编写方式，请查看demo。');
            console.info('      4) static，该配置项为一个目录，用于存放静态资源文件，如不配置，默认不使用静态资源');
            console.info('      5) db，该配置项为一个目录，用于指定框架日志数据文件保存的位置，如不配置，默认为当前启动文件所在目录');
            console.groupEnd();
            console.info('----------------------------------- Api Info -----------------------------------');
        }, 5000);
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
        //端口
        options.port = options.port && verify.isNumber(options.port) && options.port > 1 && options.port <= 65535 ? options.port : 19467;

        //sqlite3file
        options.sqlite3file = options.db;
        if (options.sqlite3file) {
            _fs.mkdirSync(options.sqlite3file);
            options.sqlite3file = path.join(options.sqlite3file, _global.sqlite3DbName);
        } else {
            options.sqlite3file = _global.sqlite3DbName;
        }
        const files = _fs.findfilesSync(path.join(__dirname, './resource/db/sql/'));
        const sqlite3Obj = new sqlite3(options.sqlite3DbName, false);
        for (const file of files) {
            const sql = fs.readFileSync(file).toString();
            sqlite3Obj.run(sql);
        }

        const socket = require('./lib/http/socket');
        const server = await socket.createServer(options);

        setTimeout(() => {
            console.group('----------------------------------- Socket Info -----------------------------------');
            console.info(`Socket服务（监听端口:${options.port}）,目前已经实现的内容（参考test/，该目录可理解为demo）：`);
            console.info('1、WebSocket服务端 监听');
            console.info('2、自定义监听端口');
            console.info('3、自定义框架日志目录');
            console.info('自定义配置项如下：');
            console.info('      1) port，该配置项为HTTP监听的端口，如不配置，或配置错误，默认使用19467');
            console.info('      2) db，该配置项为一个目录，用于指定框架日志数据文件保存的位置，如不配置，默认为当前启动文件所在目录');
            console.groupEnd();
            console.info('----------------------------------- Socket Info -----------------------------------');
        }, 5000);

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