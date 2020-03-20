const conf = require('../conf');
let sqlite3 = require('../../lib/db/sqlite3');
sqlite3 = new sqlite3(conf.sqlite3DbName, false);
const _fs = require('../../lib/comm/fs');
const fs = require('fs');
const path = require('path');

module.exports = async function () {
    const files = _fs.findfilesSync(path.join(__dirname, './sql/'));
    for (const file of files) {
        const sql = fs.readFileSync(file).toString();
        await sqlite3.run(sql);
    }
};