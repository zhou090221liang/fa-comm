const comm = require('../../index');
const log = comm.createLog('fa-comm.socket');
const user = require('./api/user');

(async () => {
    // const service = await comm.service.ws();
    const service = await comm.service.websocket({
        port:8080
    });
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