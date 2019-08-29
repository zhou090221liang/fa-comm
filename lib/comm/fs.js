const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const archiver = require('archiver');

/**
 * 同步创建文件夹，可递归创建
 * @param {String} dir 需要创建的文件夹路径
 * @returns
 */
const mkdirSync = (dir) => {
    if (fs.existsSync(dir)) {
        return true;
    } else {
        if (mkdirSync(path.dirname(dir))) {
            fs.mkdirSync(dir);
            return true;
        }
    }
};
exports.mkdirSync = mkdirSync;

/**
 * 创建空白文件
 * @param {String} file 文件路径
 */
const mkfileSync = (file) => {
    if (!fs.existsSync(file)) {
        const _path = path.dirname(file);
        mkdirSync(_path);
        fs.writeFileSync(file, '');
    }
};
exports.mkfileSync = mkfileSync;

/** 
 * 递归删除文件夹
*/
var deleteFolderRecursive = function (path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file) {
            var curPath = path + "/" + file;
            if (fs.statSync(curPath).isDirectory()) { // recurse 
                deleteFolderRecursive(curPath);
            } else { // delete file 
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};
exports.unlinkSync = exports.deleteFolderRecursive = deleteFolderRecursive;

/**
 * 递归获取文件名
 * @param {String} dir
 * @returns
 */
function findfilesSync(dir) {
    let result = [];
    function finder(_path) {
        let files = fs.readdirSync(_path);
        files.forEach((val, index) => {
            let fPath = path.join(_path, val);
            let stats = fs.statSync(fPath);
            if (stats.isDirectory()) finder(fPath);
            if (stats.isFile()) result.push(fPath);
        });

    }
    finder(dir);
    return result;
}
exports.findfilesSync = exports.statSync = findfilesSync;

/**
 * 获取文件md5
 * @param {*} file
 * @returns
 */
function md5(file) {
    return new Promise(function (resolve, reject) {
        let stream = fs.createReadStream(file);
        let fsHash = crypto.createHash('md5');
        stream.on('data', function (d) {
            fsHash.update(d);
        });
        stream.on('end', function () {
            let md5 = fsHash.digest('hex');
            resolve(md5);
        });
    });
}
exports.md5 = md5;

/**
 * 将字节单位转换成最直观的单位
 * @param {Int} bytes 字节单位的值
 */
function formatSize(bytes) {
    if (isNaN(bytes)) {
        return '';
    }
    var symbols = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var exp = Math.floor(Math.log(bytes) / Math.log(2));
    if (exp < 1) {
        exp = 0;
    }
    var i = Math.floor(exp / 10);
    bytes = bytes / Math.pow(2, 10 * i);

    if (bytes.toString().length > bytes.toFixed(2).toString().length) {
        bytes = bytes.toFixed(2);
    }
    return bytes + ' ' + symbols[i];
}
exports.formatSize = formatSize;

/**
 * 将文件夹打包压缩成zip
 * @param {Array<String>} files 被打包的文件全路径
 * @param {String} filepath 被打包的文件夹
 * @param {String} filename 打包压缩后的文件名全路径,如:/xxx.zip
 * @returns
 */
function zip(filepath, filename) {
    return new Promise(function (resolve, reject) {
        let output = fs.createWriteStream(filename);
        let archive = archiver('zip', {
            zlib: { level: 9 }
        });
        output.on('close', function () {
            resolve();
        });
        archive.on('warning', function (err) {
            reject(err);
        });
        archive.on('error', function (err) {
            reject(err);
        });
        archive.pipe(output);
        archive.directory(filepath, false);
        archive.finalize();
    });
}
exports.zip = zip;