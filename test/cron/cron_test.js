const comm = require('../../index');

(async () => {
    //获取任务
    let task = process.argv[process.argv.length - 1];
    //业务逻辑
    let i = 0;
    while (i < 20) {
        i++;
        //记录当前进度
        await comm.service.setCron(task, 20, i);
        console.log('测试' + i);
        //模拟业务运行需要的时间
        await comm.process.sleep(comm.random.getRandomNum(1000, 3000));
    }
})();