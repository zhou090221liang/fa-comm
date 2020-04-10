const comm = require('../../index');
(async function () {
    const conf = {
        pool: false,
        host: 'smtp.exmail.qq.com',
        port: 465,
        secure: true,
        user: 'yourusername@zhouxiaoyue.cn',
        pass: 'yourpassword',
        type: 'login'
    };
    try {
        const mail = new comm.mail(conf);
        const result = await mail.send('236723201@qq.com', '重置密码', '您的密码已经被重置');
        console.log('邮件发送结果:', result);
    } catch (e) {
        console.error('邮件发送异常:', e);
    }
})();