const http = require('http');
const net = require('net');
const { spawnSync, execSync } = require('child_process');
const iconv = require('iconv-lite');
const ip = require('./ip');

/**
 * 获取一个随机的未使用的端口号
 * @returns
 */
const getRandomUnUsePort = function () {
    return new Promise(function (resolve, reject) {
        const server = http.createServer();
        server.listen(0);
        server.on('listening', function () {
            var port = server.address().port;
            server.close(function () {
                resolve(port);
            });
        });
    });
}

/**
 * 检查端口是否已经被占用
 * @param {*} port
 * @returns
 */
const checkPortIsUsed = function (port) {
    return new Promise(function (resolve, reject) {
        var server = net.createServer().listen(port)
        server.on('listening', function () { // 执行这块代码说明端口未被占用
            server.close() // 关闭服务
            resolve(false);
        });
        server.on('error', function (err) {
            if (err.code === 'EADDRINUSE') { // 端口已经被使用
                resolve(true);
            }
        })
    });
}

/**
 * telnet，如果端口通，则正常返回，否则触发异常
 * @param {String} address 需要telnet的ip或域名，默认本机ip
 * @param {number} port 需要telnet的端口，默认80
 * @param {number} [timeout=30000] 超时时间
 * @returns
 */
const telnet = function (port = 80, address, timeout = 30000) {
    address = address || ip.local;
    port = port || "80";
    return new Promise(function (resolve, reject) {
        const client = net.connect(port, address, function () {
            let result = "";
            client.write('GET / \r\n');
            client.on('data', function (data) {
                result = data.toString();
                if (result.indexOf('HTTP/') == 0 && result.indexOf('400 Bad Request') > 0 && result.indexOf('Connection: close') > 0) {
                    result = "http server";
                }
            });
            client.on('close', function () {
                resolve({
                    error: null,
                    body: result
                });
            });
        }).on('error', function (err) {
            resolve({
                error: err,
                body: null
            });
        });
    });
}

module.exports = {
    getRandomUnUsePort,
    checkPortIsUsed,
    telnet
};