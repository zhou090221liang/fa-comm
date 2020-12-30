const comm = require('../index');
const http = require('http');

const reveiverData = (req) => {
    return new Promise(function (resolve, reject) {
        let chuk = '', body = '';
        req.on('data', function (data) {
            chuk += data;
        });
        req.on("end", function () {
            try {
                body = JSON.parse(chuk);
            } catch (e) {
                body = chuk;
            }
            resolve(body);
        });
    });
};

(async () => {
    const port = await comm.port.getRandomUnUsePort();
    console.log('port:', port);

    //创建一个服务
    const server = http.createServer(async (req, res) => {
        let resBody;
        try {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader('Access-Control-Allow-Methods', '*');
            res.setHeader('Access-Control-Allow-Headers', '*');
            req.url = decodeURIComponent(req.url);
            req.path = req.url.split('?')[0];
            req.query = comm.req.getQuery(req.url.split('?')[1]);
            // if (req.method.toLowerCase() == 'post') {
            req.body = await reveiverData(req);
            // } else {
            //     req.body = null;
            // }
            //收到一个请求
            resBody = {
                url: req.url,
                path: req.path,
                method: req.method,
                headers: JSON.stringify(req.headers),
                query: req.query,
                body: req.body
            };
            // console.info('收到请求:', resBody);
            res.end(JSON.stringify(resBody));
        } catch (e) {
            res.writeHead(500);
            res.end(e.message);
        }
    });
    server.listen(port);

    //监听Api启动完成
    while (true) {
        const result = await comm.port.telnet(port);
        if (!result.error) {
            console.log('started', result.body);
            break;
        }
        await comm.process.sleep(500);
    }
    console.log('服务已经启动');

    let result;

    // //GET
    // result = await comm.request.get('http://localhost:' + port + '/');
    // console.log('get result1:', result);

    // result = await comm.request.get('http://localhost:' + port + `/?a=1`);
    // console.log('get result2:', result);

    // //POST JSON
    // result = await comm.request.post(`http://127.0.0.1:${port}/?p=1`, { a: 1 });
    // console.log('post json result:', result);

    // //POST text
    // result = await comm.request.post(`http://127.0.0.1:${port}/?p=1`, "a123456");
    // console.log('post text result:', result);

    // //POST form-data
    // const fd = new comm.request.FormData();
    // fd.append('name', '张三');
    // // fd.append('headimg',fs.createReadStream('./headimg.png'));
    // result = await comm.request.post(`http://127.0.0.1:${port}/?p=1`, fd);
    // console.log('post form-data result:', result);

    process.exit(0);
})();