(async function () {
    const comm = require('../../index');
    const path = require('path');
    const proc = await comm.service.api({
        port: 19469,
        static: path.join(__dirname, './static')
    });
})();