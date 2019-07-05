module.exports = ipAddr = {};

/** 
 * 获取HTTP请求客户端IP(内网或公网)地址
*/
Object.defineProperty(ipAddr, 'client', {
    get: function () {
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
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
});

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