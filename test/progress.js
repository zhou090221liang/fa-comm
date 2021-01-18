const progress = require('../lib/comm/progress');
const random = require('../lib/comm/random');
const process = require('../lib/comm/process');

(async function () {
    const progressBar = new progress({
        title: '文件下载中',
        showPercentage: true,
        showProgress: true,
        showLocation: true,
        showSpeed: true,
        speedText: '速度',
        speedUnit: 'byte',
        autoSpeedUnit: true,
        showRemainingTime: true,
        remainingTimeText: '预计剩余',
        showDuration: true,
        durationText: '已用时间',
        length: 25
    });
    let text = '自定义文本显示区域';
    let current = 0;
    let total = random.getRandomNum(9000000, 9000000000);

    /** 模拟下载1 */
    progressBar.render(total, current, text);
    while (true) {
        current += random.getRandomNum(50000, 20000000);
        if (current > total) {
            current = total;
        }
        progressBar.render(total, current, text);
        if (current == total) {
            //下载完成，清除当前任务信息
            progressBar.clear();
            break;
        }
        await process.sleep(100, 1500);
    }
    console.info('下载1完成');
    /** 模拟下载1 */

    /** 模拟下载2 */
    current = 0;
    progressBar.render(total, current, text);
    while (true) {
        current += random.getRandomNum(50000, 20000000);
        if (current > total) {
            current = total;
        }
        progressBar.render(total, current, text);
        if (current == total) {
            //下载完成，清除当前任务信息
            progressBar.clear();
            break;
        }
        await process.sleep(100, 1500);
    }
    console.info('下载2完成');
    /** 模拟下载2 */
})();