//引用node_modules组件包
const comm = require('../index');

//模拟一个异步的方法，比如一个Http请求等，也可能会出现异常
const fnCallbak = function (params, callback) {
    //模拟异步发生的时长
    const sleep = comm.random.getRandomNum(100, 1500);
    // const sleep = 1000;
    //20%的可能性会发生异常
    const error = comm.random.getRandomNum(1, 100) > 80 ? 1 : 0;
    //延时后回调
    if (!error) {
        setTimeout(() => {
            callback(null, params);
        }, sleep);
    } else {
        setTimeout(() => {
            callback(new Error(params));
        }, sleep);
    }
};

//模拟一个异步的方法，比如一个Http请求等，也可能会出现异常
const fnCallbak2 = function (params1, params2, callback) {
    //模拟异步发生的时长
    const sleep = comm.random.getRandomNum(100, 1500);
    // const sleep = 1000;
    //20%的可能性会发生异常
    const error = comm.random.getRandomNum(1, 100) > 80 ? 1 : 0;
    //延时后回调
    if (!error) {
        setTimeout(() => {
            callback(null, `${params1}+${params2}=${params1 + params2}`);
        }, sleep);
    } else {
        setTimeout(() => {
            callback(new Error(`${params1}+${params2}=${params1 + params2}`));
        }, sleep);
    }
};

//模拟一个异步的方法，比如一个Http请求等，也可能会出现异常
const fnAsync = async function (params) {
    //模拟异步发生的时长
    const sleep = comm.random.getRandomNum(100, 1500);
    // const sleep = 1000;
    //20%的可能性会发生异常
    const error = comm.random.getRandomNum(1, 100) > 80 ? 1 : 0;
    //延时后回调
    await comm.process.sleep(sleep);
    if (error) {
        throw new Error(params);
    }
    return params;
};

//模拟一个异步的方法，比如一个Http请求等，也可能会出现异常
const fnAsync2 = async function (params1, params2) {
    //模拟异步发生的时长
    const sleep = comm.random.getRandomNum(100, 1500);
    // const sleep = 1000;
    //20%的可能性会发生异常
    const error = comm.random.getRandomNum(1, 100) > 80 ? 1 : 0;
    //延时后回调
    await comm.process.sleep(sleep);
    if (error) {
        throw new Error(`${params1}+${params2}=${params1 + params2}`);
    }
    return `${params1}+${params2}=${params1 + params2}`;
};

//模拟一个异步的方法，比如一个Http请求等，也可能会出现异常
const fnSync = function (params) {
    //20%的可能性会发生异常
    const error = comm.random.getRandomNum(1, 100) > 80 ? 1 : 0;
    if (!error) {
        return params;
    } else {
        throw new Error(params);
    }
};

//模拟一个异步的方法，比如一个Http请求等，也可能会出现异常
const fnPromise = function (params) {
    return new Promise(async function (resolve, reject) {
        //模拟异步发生的时长
        const sleep = comm.random.getRandomNum(100, 1500);
        // const sleep = 1000;
        //20%的可能性会发生异常
        const error = comm.random.getRandomNum(1, 100) > 80 ? 1 : 0;
        //延时后回调
        await comm.process.sleep(sleep);
        if (error) {
            reject(new Error(params));
        }
        resolve(params);
    });
};

// // 单个参数示例
// (
//     async function () {
//         //开始生成100个参数列表
//         let arr = new Array();
//         for (let i = 1; i <= 100; i++) {
//             arr.push(i);
//         }
//         let result;
//         //callback函数
//         result = await comm.concurrentTask.start(fnCallbak, comm.concurrentTask.FnTypes.Callback, arr, 10);
//         /*
//         //Async函数
//         result = await comm.concurrentTask.start(fnAsync, comm.concurrentTask.FnTypes.Async, arr, 10);
//         //Sync函数
//         result = await comm.concurrentTask.start(fnSync, comm.concurrentTask.FnTypes.Sync, arr, 10);
//         //Promise函数
//         result = await comm.concurrentTask.start(fnPromise, comm.concurrentTask.FnTypes.Promise, arr, 10);
//         */
//         console.log(result);
//     }
// )();

//多个参数示例
(
    async function () {
        //开始生成100个参数列表
        let arr = new Array();
        for (let i = 1; i <= 100; i++) {
            arr.push([i, comm.random.getRandomNum(0, 9)]);
        }
        let result;
        //Async函数
        result = await comm.concurrentTask.start(fnAsync2, comm.concurrentTask.FnTypes.Async, arr, 10);
        /*
        //callback函数
        result = await comm.concurrentTask.start(fnCallbak2, comm.concurrentTask.FnTypes.Callback, arr, 10);
        */
        console.log(result);
    }
)();