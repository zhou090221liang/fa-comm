/** 
 * 官方文档
 * https://ai.baidu.com/ai-doc/OCR/zk3h7xw5e
*/
const helper = require('./helper');
const req = require('../../comm/req');
let app;

const postForm = async function (url, form, access_token) {
    url = `${url}?access_token=${access_token}`;
    let result = await req.postForm(url, form);
    result = JSON.parse(result);
    return result;
}

/**
 * 解析身份证正面
 * @param {*} image
 */
const idcardFront = async function (image) {
    let access_token = await helper.getAccessToken(app);
    image = image.replace(/data:image\/(.*);base64,/, "");
    const url = 'https://aip.baidubce.com/rest/2.0/ocr/v1/idcard';
    const form = {
        image,
        id_card_side: 'front',
        detect_direction: true,
        detect_risk: true,
        detect_photo: true,
        detect_rectify: true
    };
    let result = await postForm(url, form, access_token);
    if (result.error_code == 100 || result.error_code == 110 || result.error_code == 111) {
        access_token = await helper.getAccessToken(app, true);
        result = await postForm(url, form, access_token);
    }
    if (result && !result.error_code) {
        let concise = {};
        for (const key in result.words_result) {
            if (key == '出生') {
                concise.birthday = result.words_result[key].words;
            }
            if (key == '公民身份号码') {
                concise.no = result.words_result[key].words;
            }
            if (key == '民族') {
                concise.ethnicity = result.words_result[key].words;
            }
            if (key == '姓名') {
                concise.name = result.words_result[key].words;
            }
            if (key == '性别') {
                concise.gender = result.words_result[key].words;
            }
            if (key == '住址') {
                concise.address = result.words_result[key].words;
            }
        }
        result = {
            origin: result,
            concise: concise
        };
    }
    return result;
};

/**
 * 解析身份证正面
 * @param {*} image
 */
const idcardBack = async function (image) {
    let access_token = await helper.getAccessToken(app);
    image = image.replace(/data:image\/(.*);base64,/, "");
    const url = 'https://aip.baidubce.com/rest/2.0/ocr/v1/idcard';
    const form = {
        image,
        id_card_side: 'back',
        detect_direction: true,
        detect_risk: true,
        detect_photo: true,
        detect_rectify: true
    };
    let result = await postForm(url, form, access_token);
    if (result.error_code == 100 || result.error_code == 110 || result.error_code == 111) {
        access_token = await helper.getAccessToken(app, true);
        result = await postForm(url, form, access_token);
    }
    if (result && !result.error_code) {
        let concise = {};
        for (const key in result.words_result) {
            if (key == '签发机关') {
                concise.signingOrganization = result.words_result[key].words;
            }
            if (key == '签发日期') {
                concise.start = result.words_result[key].words;
            }
            if (key == '失效日期') {
                concise.end = result.words_result[key].words;
            }
        }
        result = {
            origin: result,
            concise: concise
        };
    }
    return result;
};

module.exports = class {
    constructor(conf) {
        app = conf;
        this.idcard = idcardFront;
        this.idcardFront = idcardFront;
        this.idcardBack = idcardBack;
    }
};