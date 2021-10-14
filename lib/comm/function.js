/**
 * 函数节流 \
 * 比如判断滚动条是否滚动到底部（节流后无需每次滚动都进行运算）
 * @param {*} fn 要节流的方法
 * @param {number} [interval=300] 节流频率，默认300毫秒
 * @returns
 */
function throttle(fn, interval = 300) {
    let canRun = true;
    return function () {
        if (!canRun) return;
        canRun = false;
        setTimeout(() => {
            fn.apply(this, arguments);
            canRun = true;
        }, interval);
    };
}

/**
 * 函数防抖 \
 * 比如用户用户注册时，输入时(input或change)，验证用户名是否被占用
 * @param {*} fn 要防抖的方法
 * @param {number} [interval=300] 防抖频率，默认300毫秒
 * @returns
 */
function debounce(fn, interval = 300) {
    let timeout = null;
    return function () {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            fn.apply(this, arguments);
        }, interval);
    };
}

module.exports = {
    throttle,
    debounce
}