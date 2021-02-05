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
const log = fac.createLog('wechat');
const http = require('http');
const fs = require('fs');
const path = require('path');
const wechatComm = require('../internal/wechat');
const pWechatComm = require('../internal/private/wechat');
const xml2json = require('xml2json');
const request = require('../comm/req');
let wechatCommInstance = {};
const sdk = require('../comm/sdk');
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
                //调用微信Api接口
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
            } else if (req.path == '/verification') {
                try {
                    let result = req.body.decrypt();
                    log.info('验证后的微信信息：', result);
                    //result = `[expire_wui]${account.expire_wui}[/expire_wui][ts]${new Date().valueOf()}[/ts][data]${JSON.stringify(result)}[/data]`;
                    //'[expire_wui]60[/expire_wui][data]{"nickname":"zhou","sex":0}[/data][ts]12345678[/ts]'
                    if (
                        result.indexOf('[expire_wui]') > -1 && result.indexOf('[/expire_wui]') > -1 &&
                        result.indexOf('[ts]') > -1 && result.indexOf('[/ts]') > -1 &&
                        result.indexOf('[data]') > -1 && result.indexOf('[/data]') > -1
                    ) {
                        //微信用户信息有效期校验
                        let expire_wui = result.substr(result.indexOf('[expire_wui]') + 12);
                        expire_wui = expire_wui.substr(0, expire_wui.indexOf('[/expire_wui]'));
                        let ts = result.substr(result.indexOf('[ts]') + 4);
                        ts = ts.substr(0, ts.indexOf('[/ts]'));
                        let data = result.substr(result.indexOf('[data]') + 6);
                        data = data.substr(0, data.indexOf('[/data]'));
                        log.info('微信用户信息有效期校验,expire_wui:', expire_wui, "ts:", ts, "data:", data);
                        if (new Date().valueOf() - parseInt(ts) > parseInt(expire_wui) * 1000) {
                            res.end(JSON.stringify(new sdk.UnifiedStyleErrorMessage('Oauth认证过期', 402)));
                        } else {
                            res.end(JSON.stringify(new sdk.UnifiedStyleMessage(data)));
                        }
                    } else {
                        res.end(JSON.stringify(new sdk.UnifiedStyleMessage(result)));
                    }
                } catch (e) {
                    res.end(JSON.stringify(new sdk.UnifiedStyleErrorMessage('校验失败', 401)));
                }
            } else {
                //微信推送
                let account_id = req.path.split('/');
                account_id = account_id[account_id.length - 1];
                let account = conf.accounts.find(item => item.account_id == account_id);
                if (account) {
                    if (pWechatComm.checkSignature(req.query.signature, req.query.timestamp, req.query.nonce, account.token)) {
                        //接收到微信推送
                        res.end('');
                        //转发到开发服务器
                        const data = JSON.stringify(req.body).encrypt();
                        log.info(`将有效的微信消息"${JSON.stringify(req.body)}"转换成框架信息"${data}"`);
                        if (account.forward && account.forward.length) {
                            for (const forward of account.forward) {
                                try {
                                    const pushResult = await request.request({
                                        data,
                                        method: 'POST',
                                        uri: forward
                                    });
                                    log.info("转发微信消息到" + forward + "完成", pushResult);
                                } catch (e) {
                                    log.warn("转发微信消息到" + forward + "异常", e);
                                }
                            }
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
                //帮助文档
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
                //微信Oauth2.0授权 base_url code state
                let result;
                let account = conf.accounts.find(item => item.account_id == req.query.state);
                let base_url = req.query.base_url.decrypt();
                try {
                    let instance = getWechatCommInstance(account);
                    result = await instance.oauth.user({ code: req.query.code });
                    // result = new sdk.UnifiedStyleMessage(result);
                    log.info(`获取到的用户信息：`, result);
                } catch (e) {
                    res.end(JSON.stringify(new sdk.UnifiedStyleErrorMessage(e.stack || e.message)));
                }
                //获取用户信息
                // res.redirect(base_url);
                // result = qs.stringify(result);
                // result = JSON.stringify(result).encrypt();
                if (account.expire_wui) {
                    result = `[expire_wui]${account.expire_wui}[/expire_wui][ts]${new Date().valueOf()}[/ts][data]${JSON.stringify(result)}[/data]`;
                } else {
                    result = JSON.stringify(result);
                }
                log.info('微信用户信息：' + result);
                result = result.encrypt();
                if (base_url.indexOf('?') > -1) {
                    base_url += "&wui=" + result;
                } else {
                    base_url += "?wui=" + result;
                }
                log.info(`准备跳转到：`, base_url);
                res.writeHead(200, { 'Content-Type': "text/html;charset=utf-8;" });
                res.end(`\
                    <!DOCTYPE html> \
                    <html lang="en"> \
                    <head> \
                        <meta charset="UTF-8"> \
                        <title>Document</title> \
                    </head> \
                    <script> \
                        window.location.href = '${base_url}' \
                    </script> \
                    <body></body> \
                    </html> \
                `);
            } else {
                //微信配置校验
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
        let chuk = "", body = '';
        req.on('data', function (data1) {
            chuk += data1;
        });
        req.on("end", function () {
            // //是否是微信的xml推送
            // try {
            //     body = xml2json.toJson(chuk);
            //     body = JSON.parse(body).xml;
            // } catch (e) {
            //     body = chuk;
            // }
            // //是否是JSON
            // if (typeof body == 'string') {
            //     try {
            //         body = JSON.parse(body);
            //     } catch (e) {
            //         body = chuk;
            //     }
            // }
            // resolve(body);
            body = chuk;
            try {
                if (body.startsWith('<xml>') && body.endsWith('</xml>')) {
                    log.info('检测到xml类型的消息，自动转换成JSON');
                    body = xml2json.toJson(body);
                    body = JSON.parse(body).xml;
                    log.info('自动转换成JSON完成');
                    resolve(body);
                } else {
                    try {
                        log.info('尝试将请求包自动转换成JSON');
                        body = JSON.parse(body);
                        log.info('自动转换成JSON完成');
                        resolve(body);
                    } catch (e) {
                        log.warn('自动转换成JSON异常，使用原始包信息');
                        resolve(body);
                    }
                }
            } catch (e) {
                log.error('转换微信服务接收到的POST参数异常，使用原始包信息：', e);
                resolve(body);
            }
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
        instance = new wechatComm(account, conf);
        wechatCommInstance[account.account_id] = instance;
    }
    return instance;
}