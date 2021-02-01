(async function () {
    const comm = require('../../index');
    const path = require('path');
    // const port = await comm.port.getRandomUnUsePort();
    const mysql = {
        host: '10.0.0.20',
        port: 3306,
        database: 'facomm',
        user: 'root',
        password: 'zhou090221liang'
    };
    comm.service.api({
        mysql,
        // port,
        static: path.join(__dirname, './static')
    });
})();