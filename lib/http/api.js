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
conf.cwd = conf.cwd || process.cwd();
// conf.cwd = conf.cwd.endWith(path.sep) ? conf.cwd : conf.cwd + path.sep;
let facomm_apilog;
const log = fac.createLog('fa-comm.api');
const http = require('http');
const fs = require('fs');
const mysql = fac.createMysqlConn(conf.mysql);
const qs = require('querystring');

/**
 * 创建HTTP Server
 * @param {*} req
 * @param {*} res
 */
server = http.createServer(async (req, res) => {
    try {
        //允许跨域请求
        res.setHeader("Access-Control-Allow-Origin", "*");
        //接受GET和POST请求
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
        //允许的请求头部
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Content-Length, Authorization, Accept,X-Requested-With,Cookies,Token');
        //OPTIONS
        if (req.method.toUpperCase() === 'OPTIONS') {
            res.end();
            return;
        }
        //其他基础参数
        debugger;
        req.time = (new Date()).format();
        req.id = fac.guid.v22;
        res.id = req.id;
        req.pid = fac.process.id;
        req.ip = fac.ip.httpClientIp(req);
        //解码请求URL参数
        req.url = decodeURIComponent(req.url);
        //请求地址
        req.path = req.url.split('?')[0];
        //解析请求
        const _req = await analyzing(req);
        if (!_req.exists) {
            if (_req.exception) {
                res.writeHead(500);
                res.end(e);
            } else {
                res.writeHead(404);
                res.end();
            }
            return;
        }
        //请求参数
        req.query = fac.req.getQuery(req.url.split('?')[1]);
        //接收post参数
        if (req.method.toLowerCase() == 'post') {
            req.body = await reveiverPostData(req);
        } else {
            req.body = null;
        }
        //解析params参数
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
    } catch (e) {
        log.error('请求处理异常:' + e.message + ',发送错误statusCode:' + (e.code || 500) + '到客户端');
        res.writeHead(500)
        res.end(e.message);
    }
});
server.on('listening', async function () {
    //创建数据表
    await mysql.query(fs.readFileSync(path.join(__dirname, './api.sql'), { encoding: 'utf8' }), null, false);
    //获取文件上传表
    facomm_apilog = await mysql.getTable('facomm_apilog');
    log.info(`fa-comm.api Server Start Listening on port:${conf.port}`);
    //获取基础配置
    conf.configure = await mysql.query('select * from facomm_config', null, false);
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
            obj = qs.parse(obj);
            resolve(obj);
        });
    });
};

const analyzing = async (req) => {
    debugger;
    let result = {
        exists: false,
        module: null,
        params: null,
        exception: null
    };
    try {
        const _path = req.path.split('/');
        let filepath = '';
        result.index = _path.length - 1;
        for (let i = 0; i < _path.length; i++) {
            filepath += _path[i] + path.sep;
            const tmp = path.join(conf.cwd, filepath.substr(0, filepath.length - 1) + '.js');
            if (fs.existsSync(tmp)) {
                result.index = i;
                result.exists = true;
                result.module = require(tmp);
                break;
            }
        }
        if (result.exists) {
            result.params = [];
            for (let i = result.index; i < _path.length; i++) {
                result.params.push(_path[i]);
            }
        }
    } catch (e) {
        result.exists = false;
        result.exception = e;
    } finally {
        return result;
    }
}