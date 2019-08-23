const fac = require('../index');
const conn = fac.createRedisConn();
async function get() {
    const set = await conn.set('test_ket', fac.convert.toString(new Date().valueOf()), 3);
    let get = await conn.get('test_ket');
    console.log(get);
    await fac.process.sleep(4000); get = await conn.get('test_ket');
    console.log(get);
}
get();