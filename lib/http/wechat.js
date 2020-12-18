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
const xml2json = require('xml2json');
const request = require('../comm/req');
let wechatCommInstance = {};
const sdk = require('../comm/sdk');

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
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Content-Length, Authorization, Accept,X-Requested-With,Cookies,account_id,module,command');
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
            path: req.path,
            method: req.method,
            headers: JSON.stringify(req.ct),
            size: req.total_size,
            query: req.query
        });
        if (req.method.toUpperCase() == "POST") {
            req.body = await reveiverPostData(req);
            log.info(`接收到请求包：`, req.body);
            if (req.path == '/') {
                let account = conf.accounts.find(item => item.account_id == req.headers.account_id);
                if (!account && req.headers.module == 'account' && req.headers.command == 'shorturl') {
                    account = conf.accounts[fac.random.getRandomNum(0, conf.accounts.length - 1)];
                }
                if (account) {
                    const instance = getWechatCommInstance(account);
                    if (instance[req.headers.module] && instance[req.headers.module][req.headers.command]) {
                        try {
                            result = await instance[req.headers.module][req.headers.command](req.body);
                            result = new sdk.UnifiedStyleMessage(result);
                        } catch (e) {
                            res.end(JSON.stringify(new sdk.UnifiedStyleErrorMessage(e.stack || e.message)));
                        }
                        res.end(JSON.stringify(result));
                    }
                } else {
                    res.end(JSON.stringify(new sdk.UnifiedStyleErrorMessage('未配置的微信号', 404)));
                }
            } else {
                let account_id = req.path.split('/');
                account_id = account_id[account_id.length - 1];
                let account = conf.accounts.find(item => item.account_id == account_id);
                if (account) {
                    if (pWechatComm.checkSignature(req.query.signature, req.query.timestamp, req.query.nonce, account.token)) {
                        //接收到微信推送
                        res.end('');
                        //转发到开发服务器
                        const devUrl = conf.forward + '?' + req.url.split('?')[1];
                        try {
                            await request.request({
                                data: {
                                    data: req.body,
                                    account: {
                                        account_id: account.account_id,
                                        token: account.token,
                                        appid: account.appid
                                    }
                                },
                                method: 'POST',
                                uri: devUrl
                            });
                            log.info("转发微信消息到" + conf.forward + "完成");
                        } catch (e) {
                            log.warn("转发微信消息到" + conf.forward + "异常", e);
                        }
                    } else {
                        console.warn('微信消息校验失败');
                        res.end(JSON.stringify(new sdk.UnifiedStyleErrorMessage('微信校验失败', 400)));
                    }
                } else {
                    res.end(JSON.stringify(new sdk.UnifiedStyleErrorMessage('未配置的微信号', 404)));
                }
            }
        }
        if (req.method.toUpperCase() == "GET") {
            if (req.path == '/') {
                res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
                var rs = fs.createReadStream(path.join(__dirname, './wechat.html'), {
                    encoding: 'utf8'
                });
                rs.on('data', function (filestream) {
                    res.write(filestream);
                });
                rs.on('end', function () {
                    res.end();
                });
            } else if (req.path == '/oauth/redirect') {
                //微信Oauth2.0授权
                let base_url = req.query.base_url.decrypt();
                //获取用户信息
                res.redirect(base_url);
            } else {
                let account_id = req.path.split('/');
                account_id = account_id[account_id.length - 1];
                let account = conf.accounts.find(item => item.account_id == account_id);
                if (account) {
                    if (pWechatComm.checkSignature(req.query.signature, req.query.timestamp, req.query.nonce, account.token)) {
                        res.end(req.query.echostr || "");
                    } else {
                        console.warn('微信消息校验失败');
                        res.end(JSON.stringify(new sdk.UnifiedStyleErrorMessage('微信校验失败', 400)));
                    }
                } else {
                    res.end(JSON.stringify(new sdk.UnifiedStyleErrorMessage('未配置的微信号', 404)));
                }
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
            try {
                obj = JSON.parse(obj);
            } catch (e) {
                obj = xml2json.toJson(obj);
                obj = JSON.parse(obj).xml;
            }
            resolve(obj);
        });
    });
};

/**
 * 获取微信帮助类
 * @param {*} account
 * @returns
 */
const getWechatCommInstance = (account) => {
    let instance = wechatCommInstance[account.account_id];
    if (!instance) {
        instance = new wechatComm(account, conf.sqlite3file);
        wechatCommInstance[account.account_id] = instance;
    }
    return instance;
}