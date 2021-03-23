const __url = require('url');

/**
 * 获取地址栏参数
 * @param {*} name 参数名称
 * @param {*} url 地址 默认window.location.search
 * @returns
 */
function getParams(name, url) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    if (!url) {
        if (window && window.location && window.location.search) {
            url = window.location.search;
        } else {
            url = '';
        }
    }
    var r = url.substr(url.indexOf("?") + 1).match(reg);
    if (r != null) return decodeURI(r[2]);
    return "";
}
exports.getParams = getParams;

/**
 * 获取query参数
 * @param {*} url 默认window.location.search
 * @returns
 */
function convert(url) {
    url = decodeURIComponent(url || window.location.href);
    return parse(url, true).query;
}
exports.convert = convert;

/**
 * 将Url字符串转换成Url对象
 * @param {String} urlStr
 * @param {Boolean} parseQueryString Pass true as the second argument to also parse the query string using the querystring module. Defaults to false.
 * @param {Boolean} slashesDenoteHost Pass true as the third argument to treat //foo/bar as { host: 'foo', pathname: '/bar' } rather than { pathname: '//foo/bar' }. Defaults to false.
 * @returns
 */
function parse(urlStr, parseQueryString, slashesDenoteHost) {
    return __url.parse(urlStr, parseQueryString, slashesDenoteHost);
};
exports.parse = parse;

/**
 * Take a base URL, and a href URL, and resolve them as a browser would for an anchor tag.
 * @param {*} from
 * @param {*} to
 * @returns
 */
exports.resolve = function (from, to) {
    return __url.resolve(from, to);
}