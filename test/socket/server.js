const comm = require('../../index');
const conf = require('../setting');
const log = comm.createLog('fa-comm.socket');
conf.port = 19467;
const user = require('./api/user');

(async () => {
    // const service = await comm.service.ws(conf);
    const service = await comm.service.websocket(conf);
    service.on('connection', function (socketid) {
        service.send(socketid, 'connection', 'welcome:' + socketid);
        service.broadcast('clientonline', socketid);
    });
    service.on('disconnect', function (socketid) {
        service.send(socketid, 'disconnect', 'goodbye:' + socketid);
        service.broadcast('clientoffline', socketid);
    });
    service.on('test', async (clientid, message) => {
        log.info(`收到客户端${clientid}请求:${message}`);
        const _user = await user.list();
        service.send(clientid, 'test', 'user', JSON.stringify(_user));
    });
})();