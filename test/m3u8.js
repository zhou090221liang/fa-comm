(async function () {
    const path = require('path');
    const comm = require('../index');
    //将夜第一集（不完整）
    const url = 'https://video.buycar5.cn/20200905/mrrtZ4od/index.m3u8';
    //斗罗大陆第一集
    // const url = 'https://video.buycar5.cn/20200813/uNqvsBhl/index.m3u8';
    // const m3u8Obj = await comm.m3u8.parse(url);
    // console.log(m3u8Obj);

    await comm.m3u8.cache(url, path.join(__dirname, './m3u8chche/' + new Date().valueOf() + '/'), 16);
})();