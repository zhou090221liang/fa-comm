const ip = require('../index').ip;

(async function () {
    console.log('current ip:', ip.local);
    const addr = await ip.info();
    console.log('info:', addr);
})();