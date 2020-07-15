const comm = require('../../index');
const path = require('path');
comm.service.api({
    port: 50001,
    static: path.join(__dirname, './static')
});