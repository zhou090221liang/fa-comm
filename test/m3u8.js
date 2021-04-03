(async function () {
    const path = require('path');
    const comm = require('../index');
    const progressBar = new comm.progress.multipleProgressBar([{
        title: '总进度',
        showDuration: true,
        showRemainingTime: true
    }, {
        title: '单进度',
        showDuration: true,
        showRemainingTime: true,
        showSpeed: true,
        speedUnit: '个'
    }]);

    //将夜第一集（不完整）
    const url = 'https://video.buycar5.cn/20200905/mrrtZ4od/index.m3u8';
    //斗罗大陆第一集
    // const url = 'https://video.buycar5.cn/20200813/uNqvsBhl/index.m3u8';

    const m3u8Help = new comm.m3u8(url);

    // //转换成对象
    // const m3u8Obj = await m3u8Help.parse();
    // console.log(m3u8Obj);

    //缓存资源到本地1
    m3u8Help.cache(path.join(__dirname, './m3u8chche/' + new Date().valueOf() + '/'), 16);
    m3u8Help.cacheTaskProgress.on("progress", function (data) {
        progressBar.render([data.progress, data.detail.progress]);
    });

    // //缓存资源到本地2
    // await m3u8Help.cache(path.join(__dirname, './m3u8chche/' + new Date().valueOf() + '/'), 16);
    // console.log('完成');
})();