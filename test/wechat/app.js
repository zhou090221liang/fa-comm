const comm = require('../../index');
const path = require('path');
comm.service.wechat({
    port: 50000,
    //为保证消息安全性及恶意攻击，接收端尽量验证来源IP等。
    forward: 'http://127.0.0.1:8080/wechat/push',
    //账号配置，可以多个，哪怕一个也需要配置成Array<JSON>
    accounts: [{
        //微信号
        account_id: 'gh_9fdb812fxxx',
        //appid
        appid: '',
        //appsecret
        appsecret: '',
        //请填写接口配置信息，此信息需要你有自己的服务器资源，填写的URL需要正确响应微信发送的Token验证，请阅读消息接口使用指南。
        token: '',
        //JS接口安全域名
        js_domain: 'examples.domain.com',
        //授权回调页面域名
        oauth_url: 'examples.domain.com:8080'
    }]
});