//测试用 实际环境 npm install后 使用 const comm = require('fa-comm'); 即可
const comm = require('../../index');
const path = require('path');

//百度Api开发者信息
const conf = {
    client_id: '',
    client_secret: ''
};

//创建百度api服务
const baidu = new comm.Api.Baidu(conf);
test();

async function test() {
    let picture = path.join(__dirname, './idcard1.jpg');
    picture = comm.convert.pictureToBase64(picture);
    let result = await baidu.ocr.idcard(picture);
    console.log("身份证(正面)识别结果1：", result && result.concise ? result.concise : result);

    picture = path.join(__dirname, './idcard2.jpg');
    picture = comm.convert.pictureToBase64(picture);
    result = await baidu.ocr.idcard(picture);
    console.log("身份证(正面)识别结果2：", result && result.concise ? result.concise : result);

    picture = path.join(__dirname, './idcard1.jpg');
    picture = comm.convert.pictureToBase64(picture);
    result = await baidu.ocr.idcardBack(picture);
    console.log("身份证反面识别结果1：", result && result.concise ? result.concise : result);

    picture = path.join(__dirname, './idcard2.jpg');
    picture = comm.convert.pictureToBase64(picture);
    result = await baidu.ocr.idcardBack(picture);
    console.log("身份证反面识别结果2：", result && result.concise ? result.concise : result);
}