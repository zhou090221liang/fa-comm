
(async function () {
    const comm = require('../../index');
    const redis = comm.createRedisConn({
        password: 'zhou090221liang'
    });
    let i = 1;
    while (true) {
        let str = `第${i}个：${comm.random.getRandomStr()}`;
        await redis.rpush("queue", str);
        i++;
        console.log(str);
        await comm.process.sleep(comm.random.getRandomNum(100, 1000));
        if (i > 50) {
            break;
        }
    }
    process.exit(0);
})();