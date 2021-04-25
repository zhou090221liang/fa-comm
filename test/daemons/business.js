(async function () {
    const comm = require('../../index');
    while (true) {
        let num = comm.random.getRandomNum(0, 3);
        console.log("模拟程序，随机出现0时，抛出异常，当前：", num);
        if (num == 0) {
            throw new Error('模拟出来一个异常');
        }
        await comm.process.sleep(1000);
    }
})();