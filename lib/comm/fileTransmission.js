/** 
 * 文件传输通用类，支持smb、ftp
*/

// smb 0.2.11
const smb = require('smb2');
// basic-ftp 5.0.2
const ftp = require('basic-ftp');
const path = require('path');
const fs = require('fs');
const convert = require('./convert');

const fileTransmissionController = class {
    /**
     * 获取一个实例化对象
     * @param {String} type 协议类型，目前支持smb和ftp
     * @param {JSON} options 连接信息
     * smb：{"share":"\\\\127.0.0.1\\share","domain":"domain","username":"username","password":"password"}
     * ftp：{"host": "127.0.0.1","port": 21,"user": "user","password": "password","secure": true}
     */
    constructor(type, options) {
        let self = this;
        return new Promise(async function (resolve, reject) {
            self.type = type;
            self.options = options;
            if (type == "smb") {
                self.client = new smb(options);
                proto(self);
                resolve(self);
            }
            else if (type == "ftp") {
                const client = new ftp.Client();
                client.ftp.verbose = true;
                if (options.secure) {
                    options.secureOptions = options.secureOptions || {};
                    options.secureOptions.rejectUnauthorized = false;
                }
                await client.access(options);
                self.client = client;
                proto(self);
                resolve(self);
            }
            else {
                self.client = null;
                reject(new Error("协议类型错误，目前支持smb和ftp"));
            }
        });
    }
}

function proto(self) {
    /**
     * 关闭连接
     */
    self.close = async function () {
        if (self.type == "smb") {
            self.client.close();
        }
        if (self.type == "ftp") {
            if (!self.client.closed) {
                self.client.close();
            }
        }
    }
    /**
     * 下载文件
     * @param {*} localPath 本地文件路径
     * @param {*} remotePath 远程文件路径
     */
    self.download = async function (remotePath, localPath) {
        if (self.type == "smb") {
            const readFile = convert.promisify(self.client.readFile, self.client);
            const file = await readFile(remotePath);
            fs.writeFileSync(localPath, file);
        }
        if (self.type == "ftp") {
            await self.client.downloadTo(localPath, remotePath);
        }
    }
}

module.exports = fileTransmissionController;