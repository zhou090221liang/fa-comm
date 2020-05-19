require('./proto');
const cluster = require('cluster');
const os = require('os');
const cpus = os.cpus();
const path = require('path');
const ip = require('./ip');
const port = require('./port');

module.exports = {
    /** 
     * 进程ID 16进制 表示法
    */
    id: '0x000' + (process.pid * process.pid || 0).toString(16).toUpperCase(),
    /** 
     * 进程ID 10进制 表示法
    */
    pid: process.pid.toString(),
    /** 
     * 是否调试模式
    */
    debugger: process.execArgv.join('').indexOf('--inspect-brk') >= 0 || process.execArgv.join('').indexOf('--inspect') >= 0,
    /** 
     * 休眠
    */
    sleep: (ms) => { return new Promise(resolve => setTimeout(resolve, ms)) },
    /**
     * 启动新进程（可用作集群）
     * @param {String} file 可执行文件绝对路径
     * @param {Array} args 参数列表
     * @param {Number} length 进程个数 (调试状态该参数无效) 默认为CPU核心数
     * @param {Blean} autofork 子进程异常或退出后，是否自动重启 (调试状态、单个进程该参数无效) 默认 true
     * @param {Blean} showStartInfo 是否显示新进程启动信息 默认 true
     */
    start: function (file, args, length, autofork, showStartInfo) {
        showStartInfo = showStartInfo != undefined ? showStartInfo : true;
        if (!file)
            return;
        args = args || [];
        length = length || cpus.length;
        // console.log(('startup processes:' + length).toInfo());
        autofork = autofork != undefined ? autofork : true;
        const msg = `startupInfo:[processes core:${length},autofork:${autofork},file:${file},args:${args}]`;
        showStartInfo && console.info(msg.toInfo());
        //负载均衡调度方式
        // cluster.schedulingPolicy = cluster.SCHED_NONE;
        cluster.schedulingPolicy = cluster.SCHED_RR;
        // worker 进程之行文件的路径
        const _masterConf = {
            exec: file,
            args: args,
            cwd: path.dirname(file),
            silent: false
        };
        cluster.setupMaster(_masterConf);
        //在主进程上建立集群工作进程
        if (process.execArgv.join('').indexOf('--inspect-brk') >= 0 || process.execArgv.join('').indexOf('--inspect') >= 0) {
            _spawn(file, args, {
                env: {
                    index: 0
                }
            });
            console.warn(('use --inspect-brk= auto fork ' + file).toWarn());
            return cluster;
        } else {
            //正常模式
            if (cluster.isMaster) {
                for (let i = 0; i < length; i++) {
                    cluster.fork({ index: i });
                }
                cluster.on('fork', function (worker) {
                    console.info(`worker #${worker.id} is forked`.toInfo());
                });
                cluster.on('listening', function (worker, address) {
                    console.info(`worker #${worker.id} listen ${address.address || ip.local}:${address.port}`.toInfo());
                });
                cluster.on('online', function (worker) {
                    console.info(`worker #${worker.id} onlined by ${'0x000' + (worker.process.pid * worker.process.pid).toString(16).toUpperCase()}`.toInfo());
                });
                cluster.on('disconnect', function (worker) {
                    console.info(`worker #${worker.id} disconnected`.toInfo());
                    // if (autofork) {
                    //     setTimeout(() => { cluster.fork(); }, 500);
                    // }
                });
                cluster.on('exit', function (worker, code, signal) {
                    console.info(`worker #${worker.id} exited,code=${code},signal=${signal}`.toInfo());
                    if (autofork) {
                        setTimeout(() => { cluster.fork(); }, 500);
                    }
                });
                cluster.on('setup', function (execInfo) {
                    // console.info(`setup`);
                });
                cluster.on('message', function (worker, message, handle) {
                    console.info(`worker #${worker.id} ${JSON.stringify(message)}`.toInfo());
                });
            }
            return cluster;
        }
    }
};

const _spawn = (file, args, options) => {
    let { spawn } = require('child_process');
    options = options || {};
    if (!options.cwd) {
        options.cwd = path.dirname(file);
        file = path.basename(file);
    }
    args = Array.from(args);
    args.splice(0, 0, file);

    // args.insert('inspect');
    // let proc = spawn(process.execPath, args, options);
    // console.info(`child process forked`.toInfo());
    // proc.stdout.on('data', (data) => {
    //     console.info(data.toString().toInfo());
    // });
    // proc.stderr.on('data', (data) => {
    //     console.error(data.toString().toInfo());
    // });
    // proc.on('close', (code) => {
    //     console.warn(`child process exited with code ${code}`.toInfo());
    // });

    port.getRandomUnUsePort().then(function (_port) {
        args.insert('--inspect-brk=127.0.0.1:' + _port);
        let proc = spawn(process.execPath, args, options);
        console.info(`child process forked`.toInfo());
        proc.stdout.on('data', (data) => {
            console.info(data.toString().toInfo());
        });
        proc.stderr.on('data', (data) => {
            console.error(data.toString().toInfo());
        });
        proc.on('close', (code) => {
            console.warn(`child process exited with code ${code}`.toInfo());
        });
    });
}