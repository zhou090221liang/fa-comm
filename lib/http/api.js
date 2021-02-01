/** Api服务 */
const fac = require('../../index');
const path = require('path');
let conf;
try {
    conf = JSON.parse(process.argv[2]);
} catch (e) { }
if (!conf) {
    try {
        conf = require(process.argv[2]);
    } catch (e) { }
}
conf = conf || {};
const log = fac.createLog('fa-comm.api');
const http = require('http');
const fs = require('fs');
const mysql = fac.createMysqlConn(conf.mysql);
const qs = require('querystring');
const mmm = require('mmmagic'),
    Magic = mmm.Magic;
let routers;
const mimeTypes = ["audio/", "video/", "image/", "text/", "application/pdf;"];
const MIME = require('./mime');
const convert = require('../comm/convert');
const { sqlite3 } = require('../../index');

/**
 * 创建HTTP Server
 * @param {*} req
 * @param {*} res
 */
server = http.createServer(async (req, res) => {
    try {
        //允许跨域请求
        res.setHeader("Access-Control-Allow-Origin", "*");
        // //接受GET和POST请求
        // res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
        //接受常用的请求
        // res.setHeader('Access-Control-Allow-Methods', 'DELETE,PUT,POST,GET,OPTIONS');
        //接受所有请求
        res.setHeader('Access-Control-Allow-Methods', '*');
        //允许的常用请求头部
        // res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Content-Length, Authorization, Accept,X-Requested-With,Cookies');
        //允许所有请求头部
        res.setHeader('Access-Control-Allow-Headers', '*');
        //OPTIONS
        if (req.method.toUpperCase() === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        //favicon
        if (req.method.toUpperCase() == 'GET' && req.url == '/favicon.ico') {
            res.setEncoding = 'utf-8';
            res.writeHead(200, { 'Content-Type': 'image/' });
            var rs = fs.createReadStream(path.join(__dirname, '../../resource/logo.PNG'));
            rs.on('data', function (filestream) {
                res.write(filestream);
            });
            rs.on('end', function () {
                res.end();
            });
            return;
        }
        //是否静态资源
        if (conf.static && fs.existsSync(conf.static) && req.method.toUpperCase() == 'GET') {
            let rpath = req.url.split('?')[0];
            let fpath = path.join(conf.static, (rpath == '/' ? '/index.html' : rpath));
            if (fs.existsSync(fpath)) {
                var magic = new Magic(mmm.MAGIC_MIME_TYPE | mmm.MAGIC_MIME_ENCODING);
                magic.detectFile(fpath, function (err, type) {
                    if (err) {
                        log.warn('获取文件MIME异常:', err);
                        type = "application/octet-stream";
                    }
                    res.setEncoding = 'utf-8';
                    log.info(fpath, '文件MIME', type);
                    if (mimeTypes.find(item => type.startWith(item))) {
                        if (type.startWith('text/plain;')) {
                            type = MIME[path.extname(fpath)] || type;
                        }
                        //charset=utf-8
                        if (type.indexOf('charset=') > -1 && type.indexOf('charset=utf-8') < 0) {
                            let types = type.split(';');
                            type = [];
                            for (const t of types) {
                                if (t.indexOf('charset=') < 0) {
                                    type.push(t);
                                } else {
                                    type.push('charset=utf-8');
                                }
                            }
                            type = type.join(';');
                        }
                        if (type.indexOf('charset=') < 0) {
                            type += ";charset=utf-8";
                        }
                        res.writeHead(200, { 'Content-Type': type });
                        var rs = fs.createReadStream(fpath);
                        rs.on('data', function (filestream) {
                            res.write(filestream);
                        });
                        rs.on('end', function () {
                            res.end();
                        });
                    } else {
                        // res.setHeader('Content-Type', 'application/octet-stream');
                        res.setHeader('Content-Type', type);
                        res.setHeader('Content-Disposition', 'attachment; filename=' + encodeURIComponent(path.basename(fpath)));
                        res.setHeader('Content-Length', fs.statSync(fpath).size);
                        fs.createReadStream(fpath).pipe(res);
                    }
                });
                return;
            }
        }
        //其他基础参数
        let host_index = 0;
        for (host_index = 0; host_index < req.rawHeaders.length; host_index++) {
            if (req.rawHeaders[host_index].toLowerCase() == 'host') {
                break;
            }
        }
        req.host = req.rawHeaders[host_index + 1];
        req.db = conf.sqlite3file;
        req.req_time = (new Date()).format();
        req.id = fac.guid.v22;
        req.qid = fac.guid.v22;
        res.id = req.qid;
        req.pid = fac.process.id;
        req.ip = fac.ip.httpClientIp(req);
        //解码请求URL参数
        req.url = decodeURIComponent(req.url);
        //请求地址
        req.path = req.url.split('?')[0];
        //请求参数
        req.query = fac.req.getQuery(req.url.split('?')[1]);
        //接收请求包数据
        req.body = await reveiverData(req);
        //收到一个请求
        log.info('收到请求:', {
            id: req.id,
            pid: req.pid,
            ip: req.ip,
            url: req.url,
            path: req.path,
            method: req.method,
            headers: JSON.stringify(req.headers),
            query: req.query,
            params: req.params,
            body: req.body,
            time: req.time
        });
        // //记录请求
        // req._query = req.query ? JSON.stringify(req.query) : "";
        // req._params = req.params ? JSON.stringify(req.params) : "";
        // req._body = req.body ? JSON.stringify(req.body) : "";
        // req._headers = req.headers ? JSON.stringify(req.headers) : "";
        await mysql.query("\
            insert into FACOMMAPILOG(\
                id,host,qid,pid,ip,url,path,method,query,params,body,originBody,headers,req_time\
            )values(\
                @id@,@host@,@qid@,@pid@,@ip@,@url@,@path@,@method@,@query@,@params@,@body@,@originBody@,@headers@,NOW() \
            );\
        ", {
            id: req.id,
            host: req.host,
            qid: req.qid,
            pid: req.pid,
            ip: req.ip,
            url: req.url,
            path: req.path,
            method: req.method,
            query: req.query ? JSON.stringify(req.query) : "",
            params: req.params ? JSON.stringify(req.params) : "",
            body: req.body ? JSON.stringify(req.body) : "",
            originBody: req.originBody ? req.originBody.toString() : "",
            headers: req.headers ? JSON.stringify(req.headers) : "",
        }, false);
        //解析请求
        let existsRouter = false;
        let apiResult = "";
        for (const router in routers[req.method.toLowerCase()]) {
            if (router == req.path) {
                existsRouter = true;
                const middlewareResult = await runMiddleware(req);
                if (middlewareResult) {
                    let res_message = middlewareResult || "";
                    if (fac.verify.isJsonOrJsonArray(res_message)) {
                        res_message = JSON.stringify(res_message);
                    } else {
                        res_message = res_message.toString();
                    }
                    //中间件报错了
                    await mysql.query(`\
                        update FACOMMAPILOG set res_status = '200',res_message = @res_message@,\
                        res_time = NOW() where id = @id@;\
                    `, {
                        id: req.id,
                        res_message
                    }, false);
                    res.setEncoding = 'utf-8';
                    res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8;' });
                    res.end(fac.convert.toString(middlewareResult));
                    return;
                }
                apiResult = await routers[req.method.toLowerCase()][router](req);
                break;
            }
            const _router = router.split('/');
            const _path = req.path.split('/');
            if (_router.length == _path.length) {
                let params = {};
                for (let i = 0; i < _router.length; i++) {
                    if (_router[i].startWith(':')) {
                        params[_router[i].replace(':', '')] = _path[i];
                    } else {
                        if (_router[i] != _path[i]) {
                            params = null;
                            break;
                        }
                    }
                }
                if (params) {
                    existsRouter = true;
                    req.params = params;
                    await mysql.query(`\
                        update FACOMMAPILOG set params = @params@ where id = @id@;\
                    `, {
                        id: req.id,
                        params: req.params ? JSON.stringify(req.params) : ''
                    }, false);
                    const middlewareResult = await runMiddleware(req);
                    if (middlewareResult) {
                        let res_message = middlewareResult || "";
                        if (fac.verify.isJsonOrJsonArray(res_message)) {
                            res_message = JSON.stringify(res_message);
                        } else {
                            res_message = res_message.toString();
                        }
                        //中间件报错了
                        await mysql.query(`\
                            update FACOMMAPILOG set res_status = '200',res_message = @res_message@,\
                            res_time = NOW() where id = @id@;\
                        `, {
                            id: req.id,
                            res_message
                        }, false);
                        res.setEncoding = 'utf-8';
                        res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8;' });
                        res.end(fac.convert.toString(middlewareResult));
                        return;
                    }
                    apiResult = await routers[req.method.toLowerCase()][router](req);
                    break;
                }
            }
        }
        if (existsRouter) {
            //响应结果
            log.info('响应请求:', {
                id: req.id,
                res_status: 200,
                res_message: apiResult,
                res_time: (new Date()).format()
            });
            let res_message = apiResult || "";
            if (fac.verify.isJsonOrJsonArray(res_message)) {
                res_message = JSON.stringify(res_message);
            } else {
                res_message = res_message.toString();
            }
            //正常响应
            await mysql.query(`\
                update FACOMMAPILOG set res_status = '200',res_message = @res_message@,\
                res_time = NOW() where id = @id@;\
            `, {
                id: req.id,
                res_message
            }, false);
            res.setEncoding = 'utf-8';
            res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8;' });
            res.end(fac.convert.toString(apiResult));
        } else {
            //404
            log.info('响应请求:', {
                id: req.id,
                res_status: 404,
                res_time: (new Date()).format()
            });
            await mysql.query(`\
                update FACOMMAPILOG set res_status = '404',res_time = NOW() where id = @id@;\
            `, {
                id: req.id
            }, false);
            res.setEncoding = 'utf-8';
            res.writeHead(404);
            res.end();
        }
    } catch (e) {
        log.error('请求处理异常:' + e.message + ',发送错误statusCode:' + (e.code || 500) + '到客户端');
        if (req.id) {
            let ERRMESSAGE = {};
            if (e.stack) {
                //错误堆栈信息
                ERRMESSAGE.stack = e.stack.toString();
            }
            if (e.message) {
                //错误信息
                ERRMESSAGE.message = e.message.toString();
            }
            if (e.code) {
                //错误代码
                ERRMESSAGE.code = e.code.toString();
            }
            if (e.number) {
                //错误代码
                ERRMESSAGE.number = e.number.toString();
            }
            if (e.lineNumber) {
                //出错的行数
                ERRMESSAGE.lineNumber = e.lineNumber.toString();
            }
            if (e.name) {
                //错误类型
                ERRMESSAGE.name = e.name.toString();
            }
            if (e.description) {
                //错误描述
                ERRMESSAGE.description = e.description.toString();
            }
            if (e.fileName) {
                //出错的文件名
                ERRMESSAGE.fileName = e.fileName.toString();
            }
            await mysql.query(`\
                update FACOMMAPILOG set res_status = '500',res_message = @res_message@,\
                res_time = NOW() where id = @id@;\
            `, {
                id: req.id,
                res_message: JSON.stringify(ERRMESSAGE)
            }, false);
        }
        res.writeHead(500);
        res.end(e.message);
    }
});
server.on('listening', async function () {
    try {
        // //创建日志表
        // await mysql.query(db, null, false);
        // //获取日志表
        // facomm_apilog = await mysql.getTable('facomm_apilog', false);
        log.info(`fa-comm.api Server Start Listening on port:${conf.port}`);
        //读取路由信息
        routers = require(path.join(conf.root, 'routers.js'));
        routers.get = routers.get || routers.GET;
        routers.post = routers.post || routers.POST;
    } catch (e) {
        log.error(e);
        process.exit(0);
    }
});
//开始监听
server.listen(conf.port);

/**
 * 接受请求数据包
 * @param {*} req
 * @returns
 */
const reveiverData = (req) => {
    return new Promise(function (resolve, reject) {
        let chuk = "";
        req.on('data', function (data) {
            chuk += data;
        });
        req.on("end", function () {
            const body = convert.requestData2Json(chuk);
            if (body != chuk) {
                req.originBody = chuk;
            }
            resolve(body);
        });
    });
};

/**
 * 执行中间件
 * @param {*} req
 */
const runMiddleware = async (req) => {
    if (conf.middleware) {
        const files = fac.fs.findfilesSync(conf.middleware);
        for (const file of files) {
            const tmp = require(file);
            const r = await tmp(req);
            if (r) {
                return r;
            }
        }
        return null;
    }
}