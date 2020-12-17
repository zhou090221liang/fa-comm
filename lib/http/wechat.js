/** 微信服务号服务 */

let conf;
try {
    conf = JSON.parse(process.argv[2]);
} catch (e) { }
if (!conf) {
    try {
        conf = require(process.argv[2]);
    } catch (e) { }
}
const fac = require('../../index');
const log = fac.createLog('fa-comm.wechat');
const http = require('http');
const fs = require('fs');
const path = require('path');
const sqlite3 = new fac.sqlite3(conf.sqlite3file, false);
const wechatComm = require('../internal/wechat');
const pWechatComm = require('../internal/private/wechat');

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
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Content-Length, Authorization, Accept,X-Requested-With,Cookies');
        //OPTIONS
        if (req.method.toUpperCase() === 'OPTIONS') {
            res.end();
            return;
        }
        //解码请求URL参数
        req.url = decodeURIComponent(req.url);
        //请求地址
        req.path = req.url.split('?')[0];
        //请求参数
        req.query = fac.req.getQuery(req.url.split('?')[1]);
        log.info('收到请求:', {
            url: req.url,
            headers: JSON.stringify(req.ct),
            size: req.total_size,
            query: req.query
        });
        if (req.method.toUpperCase() == "POST") {
            let account = conf.accounts.find(item => item.api_url == req.path);
            if (account) {
                //接收到微信推送
                res.end('OK');
            } else {
                res.writeHead(404);
                res.end();
            }
        }
        if (req.method.toUpperCase() == "GET") {
            let account = conf.accounts.find(item => item.api_url == req.path);
            if (account) {
                if (pWechatComm.checkSignature(req.query.signature, req.query.timestamp, req.query.nonce, account.token)) {
                    res.end(req.query.echostr || "");
                }
            } else {
                res.writeHead(404);
                res.end();
            }
        }
    } catch (e) {
        log.error('请求处理异常:' + e.message + ',发送错误statusCode:' + (e.code || 500) + '到客户端');
        res.writeHead(500);
        res.end(e.message);
    }
});
server.on('listening', async function () {
    log.info(`fa-comm.wechat Server Start Listening on port:${conf.port}`);
    //获取基础配置
    await sqlite3.run("delete from wechat;");
    for (const account of (conf.accounts || [])) {
        await sqlite3.run("\
            insert into wechat(\
                account_id,appid,appsecret,api_url,token,js_domain,oauth_url\
            )values(\
                ?,?,?,?,?,?,?\
            );\
        ", [account.account_id, account.appid, account.appsecret, account.api_url, account.token, account.js_domain, account.oauth_url]);
    }
});
//开始监听
server.listen(conf.port);