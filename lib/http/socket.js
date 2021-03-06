/** Socket服务 */

const fac = require('../../index');
const path = require('path');

// const db = "\
//     create table if not exists facomm_socketlog( \
//         id char(22) primary key not null comment '主键', \
//         `from` varchar(50) NOT NULL COMMENT '发送方', \
//         `to` varchar(50) NOT NULL COMMENT '接收方', \
//         pid char(20) NOT NULL COMMENT '进程编号', \
//         url text comment '请求路由地址(事件名称)', \
//         body text comment '请求包', \
//         time datetime comment '发送时间' \
//     );\
// ";

// let facomm_socketlog;
const log = fac.createLog('socket');
// let mysql, socketService;
let socketService;
const io = require('socket.io')();
const EventEmitter = require('events');
class MyEmitter extends EventEmitter { }

exports.createServer = async (options) => {
    socketService = new MyEmitter();
    socketService.clients = [];
    io.listen(options.port);
    log.info(`socket Server Start Listening on port:${options.port}`);
    /**
     * 向指定客户端发送消息
     * @param {String} clientid 客户端
     * @param {String} event 事件名称
     * @param {String | [...String]} message 事件内容
     */
    socketService.send = function (clientid, event, ...message) {
        const client = findClient(clientid);
        log.info(`服务端发送消息"${event}:${message || ""}"到客户端"${clientid}"`);
        client && client.emit(event, message);
    };
    /**
     * 向所有已经连接的客户端发送广播
     * @param {String} event 事件名称
     * @param {String | [...String]} message 事件内容
     */
    socketService.broadcast = function (event, ...message) {
        log.info(`服务端发送广播"${event}:${message || ""}"到所有${socketService.clients.length}个客户端`);
        io.emit(event, message);
    };
    return socketService;
};

//客户端连接
io.on('connection', async function (client) {
    if (client.id) {
        client.use(async (kv, next) => {
            const _log = {
                id: fac.guid.v22,
                from: client.id,
                to: '[SERVER]',
                pid: fac.process.id,
                url: kv[0],
                body: null,
                time: new Date().format()
            }
            if (kv.length > 1) {
                kv.removeFirst();
                _log.body = kv;
            }
            log.info(`客户端"${client.id}"发送消息"${_log.url}:${_log.body || ""}"到服务器`);
            socketService.emit(_log.url, client.id, _log.body);
            return next();
        });
        client.on('disconnect', async message => {
            if (client.id) {
                for (let i = 0; i < socketService.clients.length; i++) {
                    if (socketService.clients[i].id == client.id) {
                        socketService.clients.remove(i);
                        break;
                    }
                }
                log.info(`客户端"${client.id}"从服务器断开(${message})，当前在线客户端数：${socketService.clients.length}`);
                socketService.emit('disconnect', client.id);
            }
        });
        socketService.clients.push(client);
        log.info(`客户端"${client.id}"连接到服务器，当前在线客户端数：${socketService.clients.length}`);
        socketService.emit('connection', client.id);
    }
});

/**
 * 查找客户端
 * @param {*} id
 * @returns
 */
function findClient(id) {
    const client = socketService.clients.find(item => item.id == id);
    return client;
}