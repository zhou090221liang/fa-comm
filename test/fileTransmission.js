const fileTransmissionController = require('../lib/comm/fileTransmission');
// import * as fileTransmissionController '../lib/comm/fileTransmission';

const smbConf = {
    share: "\\\\127.0.0.1\\share",
    domain: "domain",
    username: "username",
    password: "password"
};
const ftpConf = {
    "host": "127.0.0.1",
    "port": 21,
    "user": "user",
    "password": "password",
    "secure": true
};

(async function () {
    // const smbClient = await new fileTransmissionController.default("smb", smbConf);
    // const ftpClient = await new fileTransmissionController.default("ftp", ftpConf);

    const smbClient = await new fileTransmissionController("smb", smbConf);
    const ftpClient = await new fileTransmissionController("ftp", ftpConf);

    await ftpClient.download("remote", "local");
    await smbClient.download("remote", "local");

    smbClient.close();
    ftpClient.close();
})();