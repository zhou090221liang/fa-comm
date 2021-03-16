require('./proto');
const verify = require('./verify');
const convert = require('./convert');
const querystring = require('querystring');
const axios = require('axios');
const FormData = require('form-data');
const https = require('https');
const iconv = require('iconv-lite');
const cheerio = require('cheerio');

const request = class {
    /**
     * 创建一个HTTP请求对象，对象只包含get和post，可扩展post FormData等应用，具体请查看test目录
    * @param {String} baseUrl Api服务器地址，必须以http://或https://开头，后面跟上域名或ip地址及端口号
    * @param {JSON} headers 自定义请求头
    * @param {Number} timeout 超时时间，单位毫秒，默认1分钟
    */
    constructor(baseUrl = "http://127.0.0.1", headers = null, timeout = 60000) {
        this.FormData = FormData;
        this._baseUrl = baseUrl;
        this._headers = headers;
        this._timeout = timeout;
        if (baseUrl.startWith('https://')) {
            this.instance = axios.create({
                baseUrl,
                timeout,
                headers,
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                })
            });
        } else {
            this.instance = axios.create({
                baseUrl,
                timeout,
                headers
            });
        }
        /**
         * 发送GET请求
         * @param {string} [url='/'] 请求的接口地址
         * @param {JSON} data 请求的参数，querystring方式，自动拼接到接口地址后面
         * @returns
         */
        this.get = function (url = '/', data) {
            const self = this;
            return new Promise(function (resolve, reject) {
                if (data) {
                    url += url.indexOf('?') > -1 ? `${querystring(data)}` : `?${querystring(data).replace('&', '')}`;
                }
                self.instance.get(`${self._baseUrl}${url}`).then(function (data) {
                    if (data.status == 200) {
                        resolve(data.data);
                    } else {
                        reject(new Error(data.statusText));
                    }
                }).catch(function (e) {
                    reject(e);
                });
            });
        };
        /**
         * 发送POST请求
         * @param {string} [url='/'] 请求的接口地址
         * @param {*} data 请求的参数，可以是一个JSON/String/new request.FormData()等
         * @returns
         */
        this.post = function (url = '/', data) {
            const self = this;
            return new Promise(function (resolve, reject) {
                data = data || "";
                let header = self._headers || {};
                if (data && data.getHeaders && typeof data.getHeaders == 'function') {
                    let fdHeader = data.getHeaders();
                    header['content-type'] = fdHeader['content-type'];
                }
                self.instance.post(`${self._baseUrl}${url}`, data, { headers: header }).then(function (data) {
                    if (data.status == 200) {
                        resolve(data.data);
                    } else {
                        reject(new Error(data.statusText));
                    }
                }).catch(function (e) {
                    reject(e);
                });
            });
        };
        /**
         * 获取网页源码并转换成Jquery对象
         * @param {string} [url='/']
         * @param {string} [encodeing='utf-8']
         * @returns
         */
        this.getHtml2Jquery = function (url = '/', encodeing = 'utf-8') {
            const self = this;
            return new Promise(async function (resolve, reject) {
                axios({
                    url: `${self._baseUrl}${url}`,
                    responseType: 'stream',
                    headers: self._headers,
                    httpsAgent: (self._baseUrl.toLowerCase().indexOf('https://') > -1 ? new https.Agent({
                        rejectUnauthorized: false
                    }) : null)
                }).then(function (res) {
                    const chunks = []
                    res.data.on('data', chunk => {
                        chunks.push(chunk)
                    })
                    res.data.on('end', () => {
                        const buffer = Buffer.concat(chunks);
                        const html = iconv.decode(buffer, encodeing);
                        resolve(cheerio.load(html));
                    })
                }).catch(function (err) {
                    reject(err);
                });
            });
        };
    }
};

module.exports = request;