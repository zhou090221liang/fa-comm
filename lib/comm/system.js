const os = require('os');
const child_process = require('child_process');
module.exports = {
    /** 
     * 内置OS对象
    */
    os: os,
    /**
     * get cpu usage and frequency CPU负载和频率
     * @return {Object} cpu usage and frequency
     */
    getCpuUsage: function () {
        var loadAvg = os.loadavg();
        var cpus = os.cpus();
        var frequency = cpus[0].speed;
        if (frequency > 999) {
            frequency = (frequency / 1000).toFixed(1) + 'GHz';
        } else {
            frequency += 'MHz';
        }
        var cpu_use = (loadAvg[1] / cpus.length).toFixed(2);
        cpu_use = (+cpu_use) * 100;
        cpu_use = cpu_use.toFixed(0);
        return {
            usage: cpu_use + '%',
            frequency: frequency
        };
    },
    /**
     * get memory usage info 内存使用信息
     * @return {Object} memory usage and free
     */
    getMemUsage: function () {
        var freemem = os.freemem();
        var mem_use = parseFloat((1 - (freemem / os.totalmem()).toFixed(2)).toFixed(2) * 100).toFixed(2) + '%';
        freemem = freemem / 1024 / 1024;
        if (freemem > 999) {
            freemem = (freemem / 1024).toFixed(1) + 'GB';
        } else {
            freemem = parseInt(freemem) + 'MB';
        }
        return {
            usage: mem_use,
            free: freemem
        };
    },
    /** 
     * 获取网卡信息
    */
    getNetworkInfo: () => {
        const interfaces = os.networkInterfaces();
        let ips = new Array();
        for (const key in interfaces) {
            for (const ip of interfaces[key]) {
                if (ip.address != '127.0.0.1' && ip.family == 'IPv4') {
                    ips.push({
                        "iface": key,
                        "address": ip.address,
                        "netmask": ip.netmask,
                        "mac": ip.mac,
                        "internal": ip.internal,
                        "gateway": ""
                    });
                }
            }
        }
        const linebreak = (process.platform === 'win32') ? '\n\r' : '\n';
        const netstat = child_process.spawnSync("netstat", ['-nr']).stdout.toString().split(linebreak);
        for (let ip of ips) {
            for (const row of netstat) {
                if (row.indexOf(ip.iface) > -1 && row.indexOf("U") > -1 && row.indexOf("G") > -1) {
                    const _row = row.split(' ');
                    let net = new Array();
                    for (const val of _row) {
                        if (val != '') {
                            net.push(val);
                        }
                    }
                    if (ip.iface == net[net.length - 1]) {
                        ip.gateway = net[1];
                    }
                }
            }
        }
        let ip = new Array();
        for (const i of ips) {
            if (i.gateway) {
                ip.push(i);
            }
        }
        return ip;
    }
};