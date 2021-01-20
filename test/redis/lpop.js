
(async function () {
    const comm = require('../../index');
    const redis = comm.createRedisConn({
        password: 'zhou090221liang'
    });
    while (true) {
        let str = await redis.lpop("queue");
        console.log(str);
        await comm.process.sleep(comm.random.getRandomNum(500, 2000));
    }

})();