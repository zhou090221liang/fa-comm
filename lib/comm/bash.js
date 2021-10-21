require('./proto');

/**
 * 获取命令行后面的参数 \
 * 例如命令 xxx -port 8080
 * @returns
 */
function getArgs() {
    const argArray = process.argv.splice(2);
    const args = {};
    let lastKey = null;
    argArray.forEach(item => {
        if (/^-\w/g.test(item)) {
            lastKey = item.replace(/^-/g, '')
            args[lastKey] = true;
        } else if (lastKey) {
            args[lastKey] = item;
        }
    });
    return args;
}
exports.getArgs = getArgs;