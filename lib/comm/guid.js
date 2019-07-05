const uuid = require('node-uuid');

module.exports = GUID = {
    newid: (len) => {
        switch (len) {
            case 22:
                return guid22();
            case 32:
                return guid32();
            case 38:
                return guid38();
            default:
                return guid();
        }
    },
    emptyid: () => empty()
};

Object.defineProperty(GUID, 'v22', {
    get: function () {
        return guid22();
    }
});
Object.defineProperty(GUID, 'v32', {
    get: function () {
        return guid32();
    }
});
Object.defineProperty(GUID, 'v36', {
    get: function () {
        return guid();
    }
});
Object.defineProperty(GUID, 'v38', {
    get: function () {
        return guid38();
    }
});
Object.defineProperty(GUID, 'empty', {
    get: function () {
        return empty();
    }
});

/**
 * 获取Guid
 * @returns
 */
const guid = function () {
    return uuid.v4();
}

/**
 * 生成22位guid
 * @returns
 */
const guid22 = function () {
    var guid = Buffer.from(uuid.v4('binary')).toString('base64');
    //转成base64，最后两位都是＝＝，所以截取掉。  并且替换特殊字符串
    return guid.replace(/\//g, '_').replace(/\+/g, '-').substring(0, 22);
}

/**
 * 生成32位guid
 * @returns
 */
let guid32 = function () {
    return uuid.v4().replace(/-/g, '');
}

/**
 * 生成38位guid
 * @returns
 */
let guid38 = function () {
    return '{' + uuid.v4() + '}';
}

/**
 * 获取空guid
 * @returns
 */
var empty = function () {
    return "00000000-0000-0000-0000-000000000000";
}
// exports.empty = empty;