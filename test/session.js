(async function () {
    const comm = require('../index');
    const session = await new comm.session('test');
    console.log("创建Session对象完成", session);

    let result = await session.count();
    console.log("count", result);

    result = await session.create('data1');
    console.log("create", result);

    result = await session.count();
    console.log("count", result);

    result = await session.list(1);
    console.log("list", result);

    let sessionid = await session.create('data2');
    console.log("create", sessionid);

    result = await session.list();
    console.log("list", result);

    result = await session.del(sessionid);
    console.log("del", result);

    result = await session.list();
    console.log("list", result);

    result = await session.empty();
    console.log("empty", result);

    result = await session.list();
    console.log("list", result);

    sessionid = await session.create('expire', 10);
    console.log("create", sessionid);

    result = await session.list();
    console.log("list", result);

    await comm.process.sleep(11000);

    result = await session.list();
    console.log("list", result);

    sessionid = await session.create('expire', 10);
    console.log("create", sessionid);

    result = await session.list();
    console.log("list", result);

    await comm.process.sleep(5000);

    result = await session.expire(sessionid,10);
    console.log("expire", result);

    result = await session.list();
    console.log("list", result);

    await comm.process.sleep(15000);

    result = await session.list();
    console.log("list", result);
})();