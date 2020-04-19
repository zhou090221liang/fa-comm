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
// let facomm_apilog;
const log = fac.createLog('fa-comm.api');
const http = require('http');
const fs = require('fs');
// const mysql = fac.createMysqlConn(conf.mysql);
let sqlite3file = conf.db || conf.dbpath || conf.sqlite3Path;
if (sqlite3file) {
    fac.fs.mkdirSync(sqlite3file);
    sqlite3file = path.join(sqlite3file, fac.global().sqlite3DbName);
}
const sqlite3 = new fac.sqlite3(sqlite3file || fac.global().sqlite3DbName, false);
const qs = require('querystring');
const mmm = require('mmmagic'),
    Magic = mmm.Magic;
let routers;

// const db = `\
//     create table if not exists facomm_apilog(
//         id char(22) primary key not null comment '主键',
//         qid char(22) NOT NULL COMMENT '请求序列号',
//         pid char(20) NOT NULL COMMENT '进程编号',
//         ip char(30) NOT NULL COMMENT '客户端IP地址',
//         url text comment '请求路由地址',
//         path text comment '请求接口地址',
//         method char(50) comment '请求方式',
//         query text comment '请求参数，URL中?后面的值',
//         params text comment '请求参数，URL中的:',
//         body text comment '请求包，POST方式中的body',
//         headers text comment '请求头',
//         req_time datetime comment '请求时间',
//         res_status int comment '响应状态码',
//         res_message text comment '响应内容',
//         res_time datetime comment '响应时间'
//     );\
// `;

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
        //接受所有请求
        res.setHeader('Access-Control-Allow-Methods', '*');
        //允许的请求头部
        // res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Content-Length, Authorization, Accept,X-Requested-With,Cookies');
        res.setHeader('Access-Control-Allow-Headers', '*');
        //OPTIONS
        if (req.method.toUpperCase() === 'OPTIONS') {
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
                    log.info(fpath, '文件MIME', type);
                    res.writeHead(200, { 'Content-Type': type });
                    var rs = fs.createReadStream(fpath, {
                        encoding: 'utf8'
                    });
                    rs.on('data', function (filestream) {
                        res.write(filestream);
                    });
                    rs.on('end', function () {
                        res.end();
                    });
                });
                return;
            }
        }
        //其他基础参数
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
        //接收post参数
        if (req.method.toLowerCase() == 'post') {
            req.body = await reveiverPostData(req);
        } else {
            req.body = null;
        }
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
        // await facomm_apilog.insert(req, false);
        await sqlite3.run(`\
            insert into api_log(\
                id,qid,pid,ip,url,path,method,query,params,body,headers,req_time\
            )values(\
                '${req.id}','${req.qid}','${req.pid}','${req.ip}','${req.url}','${req.path}',\
                '${req.method}','${req.query ? JSON.stringify(req.query) : ""}',\
                '${req.params ? JSON.stringify(req.params) : ""}',\
                '${req.body ? JSON.stringify(req.body) : ""}','${req.headers ? JSON.stringify(req.headers) : ""}',\
                '${new Date().format()}'\
            );\
        `, null, false);
        //解析请求
        let existsRouter = false;
        let apiResult = "";
        for (const router in routers[req.method.toLowerCase()]) {
            if (router == req.path) {
                existsRouter = true;
                const middlewareResult = await runMiddleware(req);
                if (middlewareResult) {
                    // await facomm_apilog.update({
                    //     id: req.id,
                    //     res_status: 200,
                    //     res_message: middlewareResult,
                    //     res_time: (new Date()).format()
                    // }, false);
                    let res_message = middlewareResult || "";
                    if (fac.verify.isJsonOrJsonArray(res_message)) {
                        res_message = JSON.stringify(res_message);
                    } else {
                        res_message = res_message.toString();
                    }
                    await sqlite3.run(`\
                        update api_log set res_status = '200',res_message = '${res_message}',\
                        res_time = '${new Date().format()}' where id = '${req.id}';\
                    `, null, false);
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
                    // await facomm_apilog.update({
                    //     id: req.id,
                    //     params: req.params
                    // }, false);
                    await sqlite3.run(`\
                        update api_log set params = '${req.params ? JSON.stringify(req.params) : ""}' where id = '${req.id}';\
                    `, null, false);
                    const middlewareResult = await runMiddleware(req);
                    if (middlewareResult) {
                        // await facomm_apilog.update({
                        //     id: req.id,
                        //     res_status: 200,
                        //     res_message: middlewareResult,
                        //     res_time: (new Date()).format()
                        // }, false);
                        let res_message = middlewareResult || "";
                        if (fac.verify.isJsonOrJsonArray(res_message)) {
                            res_message = JSON.stringify(res_message);
                        } else {
                            res_message = res_message.toString();
                        }
                        await sqlite3.run(`\
                            update api_log set res_status = '200',res_message = '${res_message}',\
                            res_time = '${new Date().format()}' where id = '${req.id}';\
                        `, null, false);
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
            // await facomm_apilog.update({
            //     id: req.id,
            //     res_status: 200,
            //     res_message: apiResult,
            //     res_time: (new Date()).format()
            // }, false);
            let res_message = apiResult || "";
            if (fac.verify.isJsonOrJsonArray(res_message)) {
                res_message = JSON.stringify(res_message);
            } else {
                res_message = res_message.toString();
            }
            await sqlite3.run(`\
                update api_log set res_status = '200',res_message = '${res_message}',\
                res_time = '${new Date().format()}' where id = '${req.id}';\
            `, null, false);
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
            // await facomm_apilog.update({
            //     id: req.id,
            //     res_status: 404,
            //     res_time: (new Date()).format()
            // }, false);
            await sqlite3.run(`\
                update api_log set res_status = '404',res_time = '${new Date().format()}' where id = '${req.id}';\
            `, null, false);
            res.setEncoding = 'utf-8';
            res.writeHead(404);
            res.end();
        }
    } catch (e) {
        log.error('请求处理异常:' + e.message + ',发送错误statusCode:' + (e.code || 500) + '到客户端');
        if (req.id) {
            // await facomm_apilog.update({
            //     id: req.id,
            //     res_status: 500,
            //     res_message: e.message,
            //     res_time: (new Date()).format()
            // }, false);
            await sqlite3.run(`\
                update api_log set res_status = '500',res_message = '${e.message.toString()}',\
                res_time = '${new Date().format()}' where id = '${req.id}';\
            `, null, false);
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
 * 接受post参数
 * @param {*} req
 * @returns
 */
const reveiverPostData = (req) => {
    return new Promise(function (resolve, reject) {
        let obj = "";
        req.on('data', function (data1) {
            obj += data1;
        });
        req.on("end", function () {
            obj = fac.convert.toJson(obj);
            if (!fac.verify.isJsonOrJsonArray(obj)) {
                obj = qs.parse(obj);
            }
            resolve(obj);
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