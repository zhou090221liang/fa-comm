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
    url = decodeURIComponent(url || window.location.search.replace('?', ''));
    url = url.split('&');
    let query = {};
    for (let _url of url) {
        let _u = _url.split('=');
        _u[0] && (query[_u[0]] = _u[1]);
    }
    return query;
}
exports.convert = convert;