(async function () {
    const comm = require('../../index');
    const path = require('path');
    // //只启动HTTP服务，方式一
    // const proc = await comm.service.api({
    //     port: 19468,
    //     static: path.join(__dirname, './static')
    // });
    // //只启动HTTP服务，方式二
    // const proc = await comm.service.api({
    //     port: { http: 19468 },
    //     static: path.join(__dirname, './static')
    // });
    // //只启动HTTPS服务（使用默认的SSL证书）
    // const proc = await comm.service.api({
    //     port: { https: 19469 },
    //     static: path.join(__dirname, './static')
    // });
    // //只启动HTTPS服务（使用自己的SSL证书）
    // const proc = await comm.service.api({
    //     port: { https: 19469 },
    //     ssl: {
    //         key: path.join(__filename, '../ssl/privatekey.pem'),
    //         cert: path.join(__filename, '../ssl/certificate.pem')
    //     },
    //     static: path.join(__dirname, './static')
    // });
    //启动HTTP和HTTPS服务（监听接口一样，如需不一样，请使用单独一份代码结构，创建一个服务）
    const proc = await comm.service.api({
        port: { http: 19468, https: 19469 },
        ssl: {
            key: path.join(__filename, '../ssl/privatekey.pem'),
            cert: path.join(__filename, '../ssl/certificate.pem')
        },
        static: path.join(__dirname, './static')
    });
})();