const req = require('./req');
const convert = require('./convert');
var { spawnSync } = require('child_process');
var iconv = require('iconv-lite');

module.exports = ipAddr = {};

/**
 * 获取Http客户端IP地址(Nginx代理等可能获取会异常)
 * @param {*} req
 * @returns
 */
ipAddr.httpClientIp = (req) => {
    var ipAddress;
    var forwardedIpsStr = '';
    if (req.header) {
        forwardedIpsStr = req.header('x-forwarded-for');
    }
    if (forwardedIpsStr) {
        var forwardedIps = forwardedIpsStr.split(',');
        ipAddress = forwardedIps[0];
    }
    if (!ipAddress) {
        ipAddress = req.connection.remoteAddress;
    }
    return ipAddress.replace("\"", "");
}

/**
 * 获取服务器本地IP信息
 * @returns
 */
ipAddr.info = ipAddr.all = function () {
    let result = {
        local: this.local,
        public: {}
    }
    return new Promise(function (resolve, reject) {
        req.requesturl('http://members.3322.org/dyndns/getip').then(function (html) {
            html = html.replace(/(^\s*)|(\s*$)/g, "");
            result.public.ip = html;
            return req.requesturl('http://apis.juhe.cn/ip/ipNew?ip=' + result.public.ip + '&key=bb97eb9e7137244c7d4d759c3954c093');
        }).then(function (area) {
            area = convert.toJson(area);
            if (area && area.resultcode == '200') {
                result.public.area = area.result;
            }
            resolve(result);
        }).catch(function (err) {
            resolve(result);
        });
    });
}

/**
 * ping
 * @param {String} address 需要ping的ip或域名，默认本机ip
 * @param {number} [timeout=10000] 超时时间
 * @returns
 */
ipAddr.ping = function (address, timeout = 10000) {
    address = address || this.local;
    const ping = spawnSync('ping', [address], {
        timeout: timeout || 10000
    });
    let result = {
        pid: ping.pid,
        status: ping.status,
        signal: ping.signal,
        error: ping.error
    };
    result.stdout = iconv.decode(Buffer.from(ping.stdout), 'gbk');
    result.stderr = iconv.decode(Buffer.from(ping.stderr), 'gbk');
    return result;
}

/** 
 * 获取本机IP(内网)地址
*/
Object.defineProperty(ipAddr, 'local', {
    get: function () {
        var interfaces = require('os').networkInterfaces();
        for (var devName in interfaces) {
            var iface = interfaces[devName];
            for (var i = 0; i < iface.length; i++) {
                var alias = iface[i];
                if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                    return alias.address;
                }
            }
        }
    }
});