const comm = require('../../index');
const path = require('path');
const daemon = comm.process.daemons(path.join(__filename, '../business.js'));
daemon.on("stdout", function (data) {
    console.log(`${data}`);
}).on("stderr", function (data) {
    console.error(`${data}`);
});