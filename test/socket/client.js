const comm = require('../../index');
const io = require('socket.io-client');
const client = io('http://localhost:19467');
client.on('connection', function (msg) {
    console.log('client:' + client.id + ' receive2 msg:' + msg);
    client.emit('test', 'AAAAA', 'BBBB', 'CCCC', JSON.stringify({ "name": "张" }));
});
client.on('test', function (msg) {
    console.log('client:' + client.id + ' receive2 msg:' + msg);
});
client.on('clientonline', function (msg) {
    msg = 'client:' + client.id + ' receive2 客户端上线 msg:' + msg;
    console.log(msg);
});
client.on('clientoffline', function (msg) {
    msg = 'client:' + client.id + ' receive2 客户端下线 msg:' + msg;
    console.log(msg);
});