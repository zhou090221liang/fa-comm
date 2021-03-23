const comm = require('../index');

const httpUrl = 'http://127.0.0.1:8080/api/xxx?id=123&name=zhangsan';

console.log("获取地址栏参数：", comm.url.getParams('id', httpUrl));
console.log("获取query参数：", comm.url.convert(httpUrl));
console.log("转换成URL对象：", comm.url.parse(httpUrl, true));