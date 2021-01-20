const guid = require('../comm/guid');
const ioredis = require('ioredis');

/** 
 * Redis操作类
*/
let Redis = class {
    /** 
     * Redis对象构造函数
     * @param {JSON} options 连接配置对象
     */
    constructor(options) {
        options = options || {};
        options.lazyConnect = options.lazyConnect != undefined ? options.lazyConnect : true;
        options.showFriendlyErrorStack = options.showFriendlyErrorStack != undefined ? options.showFriendlyErrorStack : true;
        options.host = options.host || (options.uri || (options.url || "127.0.0.1"));
        options.port = options.port || 6379;
        options.password = options.password || (options.pwd || (options.pass || (options.authentication || (options.auth || ""))));
        options.db = options.db || (options.database || 0);
        options.connectTimeout = options.timeout || (options.connectTimeout || 10000);
        this._name = guid.v22;
        this._options = options;
        this._url = `redis://${options.password ? options.password + '@' : ''}${options.host}:${options.port}/${options.db}`;
        this._client = new ioredis(options);
        /**
         * 设置键值对
         * @param {String} key 键
         * @param {String} value 值
         * @param {Int} second 过期时间 秒
         * @returns 成功返回"OK"
         */
        this.set = (key, value, second) => {
            let self = this;
            if (this._status != 'connect') {
                console.warn(`redis client dosn't connection to ${this._url}`);
            }
            if (second != void 0) {
                return this._client.setex(key, second, value);
            }
            return this._client.set(key, value);
        };
        /**
         * 根据键获取值
         * @param {String} key 键
         * @returns 值 不存在则返回null
         */
        this.get = (key) => { return this._client.get(key) };
        /**
         * 删除键值对
         * @param {String} key 键
         * @returns 
         */
        this.del = (key) => { return this._client.del(key) };
        /**
         * 获取所有的键
         * @param {String} pattern 规则。
         * * 匹配数据库中所有 key。
         * h?llo 匹配 hello ， hallo 和 hxllo 等。
         * h*llo 匹配 hllo 和 heeeeello 等。
         * h[ae]llo 匹配 hello 和 hallo ，但不匹配 hillo 。
         * @returns
         */
        this.keys = (pattern) => {
            pattern = pattern || "*";
            return this._client.keys(pattern);
        };
        /**
         * 以秒为单位返回 键 的剩余生存时间 如果不存在 键 或者长期有效 返回-1
         * @param {String} key 键
         * @returns
         */
        this.ttl = (key) => {
            return this._client.ttl(key);
        };
        /**
         * 是否存在键
         * @param {String} key 键
         * @returns
         */
        this.exists = (key) => {
            return this._client.exists(key);
        };
        /**
         * 将一个或多个值 value 插入到列表 key 的表尾(最右边)。
         * @param {String} key 键
         * @param {String} value 值
         * @returns
         */
        this.rpush = (key, value) => {
            return this._client.rpush(key, value);
        };
        /**
         * 移除并返回列表 key 的头元素。
         * @param {String} key 键
         * @returns
         */
        this.lpop = (key) => {
            return this._client.lpop(key);
        };
        let self = this;
        self.outmsg = {};
        this._client.connect();
        this._client.on('ready', function () {
            if (!self.outmsg.ready) {
                self.outmsg.ready = 'ready';
                console.info(`ready connection to redis ${self._url}`.toInfo());
            }
        }).on('error', function (e) {
            self._status = this.status;
            if (!self.outmsg.error) {
                self.outmsg.error = 'error';
                console.warn(`redis ${self._url} error`.toWarn());
            }
        }).on('close', function () {
            self._status = this.status;
            if (!self.outmsg.close) {
                self.outmsg.close = 'close';
                console.warn(`redis ${self._url} close`.toWarn());
            }
        }).on('reconnecting', function () {
            if (!self.outmsg.reconnecting) {
                self.outmsg.reconnecting = 'reconnecting';
                console.warn(`redis ${self._url} reconnecting`.toWarn());
            }
            self._status = this.status;
        }).on('end', function () {
            self._status = this.status;
            if (!self.outmsg.end) {
                self.outmsg.end = 'end';
                console.warn(`redis ${self._url} connection end`.toWarn());
            }
        }).on('rejection', function () {
            self._status = this.status;
            if (!self.outmsg.rejection) {
                self.outmsg.rejection = 'rejection';
                console.warn(`redis ${self._url} connection rejection`.toWarn());
            }
        }).on('authError', function () {
            self._status = this.status;
            if (!self.outmsg.authError) {
                self.outmsg.authError = 'authError';
                console.warn(`redis ${self._url} connection auth failed`.toWarn());
            }
        }).on('connect', function () {
            self._status = this.status;//connect
            setTimeout(() => {
                if (self._status === 'connect') {
                    self.outmsg = {};
                    console.info(`create redis client redis://${options.password}@${options.host}:${options.port}/${options.db} success`.toInfo());
                }
            }, 200);
        });
    }
};

module.exports = Redis;