const live = require('../index').live;

(async function () {
    const weater = await live.getWeater();
    const huangli = await live.getHuangLi();

    console.log('weater:', weater);
    console.log('huangli:', huangli);
})();