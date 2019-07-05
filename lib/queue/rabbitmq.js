const fac = require('../../index');
const amqp = require('amqplib');
const EventEmitter = require('events');

module.exports = {
    /**
     * 获取RabbitMQ连接
     * @param {STRING|JSON} option 连接参数
     * @returns 连接成功返回连接对象，连接失败返回null
     */
    'createRabbitMqConn': function (option) {
        return new Promise(function (resolve, reject) {
            option = option || "amqp://guest:guest@127.0.0.1:5672";
            if (typeof option != "string") {
                option = {
                    user: option.user || (option.username || 'guest'),
                    password: option.password || (option.pwd || 'guest'),
                    host: option.host || (option.url || '127.0.0.1'),
                    port: option.port || '5672'
                };
                option = `amqp://${option.user}:${option.password}@${option.host}:${option.port}`;
            }
            // option = `amqp://guest:guest@172.16.1.8:5672`;
            // amqp.connect(option);
            amqp.connect(option).then(function (conn) {
                conn._hosts = option;
                conn.declareChannel = _declareChannel;
                console.info(`open rabbitmq ${option} connection success`.toInfo());
                resolve(conn);
            }).catch(function (e) {
                console.error(`open rabbitmq ${option} connection error:${e}`.toError());
                reject(e);
            });
        });
    }
};


/**
 * 获取RabbitMQ通道
 * @param {*} conn 连接对象
 * @returns RabbitMQ通道
 */
function _declareChannel(name) {
    name = name || fac.guid.guid22();
    let self = this;
    return new Promise(function (resolve, reject) {
        self.createChannel().then(function (channel) {
            channel._name = name;
            channel._conn = self;
            channel.declareQueue = _declareQueue;
            channel.delQueue = _deleteQueue;
            channel.declareExchange = _declareExchange;
            channel.send = _send;
            console.info(`declare rabbitmq ${self._hosts} channel ${name} success`.toInfo());
            resolve(channel);
        }).catch(function (e) {
            console.error(`declare rabbitmq ${self._hosts} channel ${name} error:${e}`.toError());
            // resolve(null);
            reject(e);
        });
    });
}

/**
 * 声明交换机
 * @param {*} name 交换机名称
 * @param {*} type 交换机类型(topic/fanout/direct/headers) 
 * 1)Direct，翻译过来就是”直接的”，方式类似于点对点投递，建立Binding时候依赖于exchangeName，queueName、routingKey，消息投递的时候，只需要依赖于exchangeName和routingKey就能分发到被绑定的Queue中。
 * 2)Topic类型的Exchange通过支持通配符的RoutingKey管理复杂的发布订阅关系，发送消息时指定的RoutingKey必须是点号（.）分隔的单词 "#"代表0个或者多个关键字。 "*"表示一个关键字。
 * 3)对于Fanout类型的Exchange，只要有消息投递到该exchange，它会分发这个消息到所有绑定在它上面的队列，也就是routingKey对于Fanout类型的Exchange是无意义的，但是在声明队列Binding到Fanout类型的Exchange的时候，routingKey不能为null，随便写个值例如空字符串也是可以的，在发送消息的时候也是这样。
 * 4)Headers类型的Exchanges是不处理路由键的，而是根据发送的消息内容中的headers属性进行匹配。在绑定Queue与Exchange时指定一组键值对；当消息发送到RabbitMQ时会取到该消息的headers与Exchange绑定时指定的键值对进行匹配；如果完全匹配则消息会路由到该队列，否则不会路由到该队列。headers属性是一个键值对，可以是Hashtable，键值对的值可以是任何类型。
 * @returns 交换机对象
 */
function _declareExchange(name, type) {
    type = type || "topic";
    let self = this;
    return new Promise(function (resolve, reject) {
        self.assertExchange(name, type, {
            durable: true,
            autoDelete: false
        }).then(function (mqExchange) {
            console.info(`declare rabbitmq ${self._conn._hosts} exchange ${name}(${type}) success`.toInfo());
            mqExchange._name = name;
            mqExchange._type = type;
            mqExchange._channel = self;
            mqExchange.declareProducer = _declareProducer;
            resolve(mqExchange);
        }).catch(function (e) {
            console.error(`declare rabbitmq ${self._conn._hosts} exchange ${name}(${type}) error:${e}`.toError());
            // resolve(null);
            reject(e);
        });
    });
}

/**
 * 声明生产者
 * @returns
 */
function _declareProducer() {
    let self = this;
    return new Promise(function (resolve, reject) {
        resolve({
            _exchange: self,
            publish: _publish
        });
    });
}

/**
 * 发布消息到交换机
 * @param {*} message 消息内容
 * @param {*} routeKey 路由键
 * @param {*} options
 * @returns true/false
 */
function _publish(message, routeKey, options) {
    let self = this;
    return new Promise(function (resolve, reject) {
        let result = self._exchange._channel.publish(self._exchange._name, routeKey || "#", message, options);
        console.info(`publish message ${message} to exchange ${self._exchange._name}(${routeKey}) ${result ? 'success' : 'failed'}`.toInfo());
        resolve(result);
    });
}

/**
 * 声明队列
 * @param {String} name 队列名称
 * @returns 队列对象
 */
function _declareQueue(name) {
    let self = this;
    return new Promise(function (resolve, reject) {
        self.assertQueue(name).then(function (mqQueue) {
            mqQueue._name = name;
            mqQueue._channel = self;
            mqQueue.bindExchange = _bindExchange;
            mqQueue.consume = _consume;
            // mqQueue.send = _sendToQueue;
            console.info(`declare rabbitmq ${self._conn._hosts} queue ${name} success`.toInfo());
            resolve(mqQueue);
        }).catch(function (e) {
            console.error(`declare rabbitmq ${self._conn._hosts} queue ${name} error:${e}`.toError());
            // resolve(null);
            reject(e);
        });
    });
}

/**
 * 发送消息到指定队列
 * @param {*} message
 * @param {*} queue
 * @returns
 */
function _send(message, queue) {
    let self = this;
    return new Promise(function (resolve, reject) {
        self.sendToQueue((queue && queue.name ? queue.name : queue), message);
        resolve();
    });
}

/**
 * 删除队列
 * @param {*} name
 * @returns
 */
function _deleteQueue(name) {
    let self = this;
    return self.deleteQueue(name);
}

/**
 * 将队列绑定到交换机
 * @param {*} exchange 交换机对象或交换机名称
 * @param {String} routerKey 路由键
 * @returns true/false
 */
function _bindExchange(exchange, routerKey) {
    let self = this;
    exchange = exchange && exchange._name ? exchange._name : (exchange || "");
    return new Promise(function (resolve, reject) {
        self._channel.bindQueue(self._name, exchange, routerKey || "#").then(function (r) {
            console.info(`bind queue ${self._name} to exchange ${exchange} by rabbitmq ${self._channel._conn._hosts} ${r ? 'success' : 'failed'}`.toInfo());
            resolve(r);
        }).catch(function (e) {
            console.error(`bind queue ${self._name} to exchange ${exchange} by rabbitmq ${self._channel._conn._hosts} error:${e}`.toError());
            // resolve(false);
            reject(e);
        });
    });
}

/**
 * 获取消费者对象
 * @returns consumer对象，可以通过消费者对象的事件(msg)监听，获得队列消息，例如:consumer.on('msg',function(msg){});
 */
function _consume() {
    let self = this;
    class MyEmitter extends EventEmitter { }
    let myEmitter = new MyEmitter();
    return new Promise(function (resolve, reject) {
        self._channel.consume(self._name, function (msg) {
            if (msg) {
                self._channel.ack(msg);
                let data = msg.content;
                myEmitter.emit('msg', data);
            }
        });
        resolve(myEmitter);
    });
}