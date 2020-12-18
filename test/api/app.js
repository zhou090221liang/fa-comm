const comm = require('../../index');
const path = require('path');
comm.service.api({
    port: 8080,
    static: path.join(__dirname, './static')
});