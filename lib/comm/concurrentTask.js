/**
 * 多任务并发运行程序
 */

const convert = require('./convert');
const verify = require('./verify');

module.exports = {
    // 枚举 - 传入的方法类型
    FnTypes: {
        /**  
         * 同步函数
        */
        "Sync": 1,
        /**  
         * 异步函数
        */
        "Async": 2,
        /**  
         * Promise函数
        */
        "Promise": 3,
        /**  
         * Callback回调风格函数
        */
        "Callback": 4
    },
    /**
     * 并发运行任务
     * @param {Function} fn 一个运行函数
     * @param {concurrentTask.FnTypes} fnType 该运行函数的类型，callback类型的方法，必须是callback(error,result)形式的函数
     * @param {Array<Object>} [taskList=[]] 传入fn的运行参数，一个元素代表一次任务，一次任务的参数也可以多个以数组形式构造
     * @param {Number} [max=1] 每次并发的数量
     * @returns
     */
    start: async function (fn, fnType, taskList = [], max = 1) {
        try {
            if (!fn) return;
            if (!fnType) return;
            if (!taskList.length) return;
            const startTime = new Date().format(); // 记录任务执行开始时间
            if (fnType == 4) {
                fn = convert.promisify(fn);
            }
            const result = []; // 收集任务执行结果
            // 任务执行程序
            const schedule = async (index) => {
                return new Promise(async (resolve) => {
                    // console.log("运行第" + index + "次");
                    const _startTime = new Date().format(); // 记录任务执行开始时间
                    const _params = taskList[index];
                    if (!_params) {
                        resolve();
                    } else {
                        // 执行当前异步任务
                        let reply;
                        try {
                            if (fnType == 1) {
                                //同步方法
                                if (verify.isArray(_params)) {
                                    reply = fn(..._params);
                                } else {
                                    reply = fn(_params);
                                }
                            } else {
                                //异步方法
                                if (verify.isArray(_params)) {
                                    reply = await fn(..._params);
                                } else {
                                    reply = await fn(_params);
                                }
                            }
                            reply = {
                                result: reply,
                                error: null
                            };
                        } catch (e) {
                            reply = {
                                result: null,
                                error: e
                            };
                        }
                        const _endTime = new Date().format(); // 记录任务执行开始时间
                        reply.startTime = _startTime;
                        reply.endTime = _endTime;
                        // console.log("运行第" + index + "次结果", reply);
                        result[index] = reply;
                        // 执行完当前任务后，继续执行任务池的剩余任务
                        await schedule(index + max);
                    }
                    resolve();
                });
            };
            // 任务池执行程序
            const scheduleList = new Array(max)
                .fill(0)
                .map((_, index) => schedule(index));
            // 使用 Promise.all 批量执行
            await Promise.all(scheduleList);
            const endTime = new Date().format(); // 记录任务执行开始时间
            return { result, startTime, endTime };
        } catch (e) {
            throw e;
        }
    }
};