const fac = require('../index');
const conn = fac.createMysqlConn({
    password: 'mysql_pwd',
    database: 'mms'
});
async function get() {
    const user = await conn.query('select * from base_user');
    console.log(user);
}
get();