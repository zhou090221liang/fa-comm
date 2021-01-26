const comm = require('../../index');
const path = require('path');
comm.service.wechat({
    port: 50000,
    //账号配置，可以多个，哪怕一个也需要配置成Array<JSON>
    accounts: [{
        //Oauth的wui过期时间，单位秒，0为永不过期
        expire_wui: 0,
        //推送给第三方开发者的接口地址，使用数组配置多个接口。
        forward: ['http://127.0.0.1:8080/wechat/push'],
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