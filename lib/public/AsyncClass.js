// 用于定义异步构造函数的类

module.exports = class AsyncConstructor {
    constructor(asyncConstructor) {
        const init = (async () => {
            await asyncConstructor();
            delete this.then;
            return this;
        })();
        this.then = init.then.bind(init);
    }
};