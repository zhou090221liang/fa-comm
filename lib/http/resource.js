/** 资源服务 */

let conf;
try {
    conf = JSON.parse(process.argv[2]);
} catch (e) { }
if (!conf) {
    try {
        conf = require(process.argv[2]);
    } catch (e) { }
}
const fac = require('../../index');
const log = fac.createLog('resource');
const http = require('http');
const fs = require('fs');
const path = require('path');
const formidable = require('formidable');

/**
 * 创建HTTP Server
 * @param {*} req
 * @param {*} res
 */
server = http.createServer(async (req, res) => {
    try {
        //允许跨域请求
        res.setHeader("Access-Control-Allow-Origin", "*");
        //接受GET和POST请求
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
        //允许的请求头部
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Content-Length, Authorization, Accept,X-Requested-With,Cookies,extend');
        //OPTIONS
        if (req.method.toUpperCase() === 'OPTIONS') {
            res.end();
            return;
        }
        //解码请求URL参数
        req.url = decodeURIComponent(req.url);
        //上传文件大小
        req.ct = req.headers && (req.headers['Content-Type'] || req.headers['content-type']) ? (req.headers['Content-Type'] || req.headers['content-type']) : '';
        req.total_size = req.headers && (req.headers['Content-Length'] || req.headers['content-length']) ? (req.headers['Content-Length'] || req.headers['content-length']) : 0;
        //请求地址
        req.path = req.url.split('?')[0];
        //请求参数
        req.query = fac.req.getQuery(req.url.split('?')[1]);
        log.info('收到请求:', {
            url: req.url,
            headers: JSON.stringify(req.ct),
            total_size: req.total_size,
            query: req.query
        });
        //判断接口
        if (req.method.toUpperCase() == "POST") {
            //上传文件
            try {
                let extend = (decodeURIComponent(req.url).substring(1) || req.headers['extend']) || "";
                const progress = new fac.progress.singleProgressBar({
                    title: '上传中',
                    showLocation: true,
                    showDuration: true,
                    showRemainingTime: true,
                    showSpeed: true,
                    autoSpeedUnit: true
                })
                const form = new formidable.IncomingForm();
                form.encoding = 'utf-8';
                form.uploadDir = conf.path;
                form.maxFileSize = (conf.size || 10 * 1024 * 1024);
                form.hash = 'md5';
                form.on('progress', function (completed, total) {
                    progress.render(completed, total);
                });
                form.parse(req, async function (err, fields, files) {
                    try {
                        progress.clear();
                        if (err) {
                            log.error('文件上传失败(formidable):', err);
                            res.writeHead(500);
                            res.end(err.message || "");
                        } else {
                            const result = new Array();
                            const batch = fac.guid.v22;
                            for (const key in files) {
                                if (files[key].name && files[key].size && files[key].path && files[key].type && files[key].lastModifiedDate && files[key].hash) {
                                    files[key].id = fac.guid.v32;
                                    files[key].total_size = req.total_size;
                                    files[key].form = key;
                                    files[key].origin_name = files[key].name;
                                    files[key].content_type = files[key].type;
                                    files[key].boundary = req.ct.substring(req.ct.indexOf('boundary=') + 9 || 0);
                                    files[key].file_name = path.win32.basename(files[key].path);
                                    files[key].path = files[key].path.replace(files[key].file_name, '');
                                    files[key].md5 = files[key].hash;
                                    files[key].batch = batch;
                                    files[key].upload_time = new Date().format('yyyy-MM-dd hh:mm:ss');
                                    files[key].extend = extend;
                                    //判断是否存在相同md5的文件 file-guid
                                    const fg = path.join(conf.path, './' + files[key].md5 + '.fg');
                                    const fi = path.join(conf.path, './' + files[key].id + '.fi');
                                    if (fs.existsSync(fg)) {
                                        log.warn(`已经存在相同的文件(文件MD5),删除刚上传的实体文件,制造一个fi文件，并返回`);
                                        fs.unlinkSync(files[key].path + files[key].file_name);
                                        let existsFileInfo = fs.readFileSync(fg).toString().decrypt();
                                        //file-info
                                        const _fi = path.join(conf.path, './' + existsFileInfo + '.fi');
                                        existsFileInfo = JSON.parse(fs.readFileSync(_fi).toString().decrypt());
                                        existsFileInfo = {
                                            id: files[key].id,
                                            total_size: existsFileInfo.total_size,
                                            form: files[key].form,
                                            origin_name: files[key].origin_name,
                                            content_type: existsFileInfo.content_type,
                                            upload_time: files[key].upload_time,
                                            boundary: files[key].boundary,
                                            file_name: existsFileInfo.file_name,
                                            path: existsFileInfo.path,
                                            md5: files[key].md5,
                                            batch: files[key].batch,
                                            extend: files[key].extend,
                                        };
                                        fs.writeFileSync(fi, JSON.stringify(existsFileInfo).encrypt());
                                        result.push({
                                            id: existsFileInfo.id,
                                            total_size: existsFileInfo.total_size,
                                            form: existsFileInfo.form,
                                            origin_name: existsFileInfo.origin_name,
                                            content_type: existsFileInfo.content_type,
                                            upload_time: existsFileInfo.upload_time,
                                            md5: existsFileInfo.md5,
                                            batch: existsFileInfo.batch,
                                            extend: existsFileInfo.extend,
                                        });
                                    } else {
                                        log.warn(`不存在相同的文件(文件MD5),正常保存`);
                                        fs.writeFileSync(fg, files[key].id.encrypt());
                                        let notExistsFileInfo = {
                                            id: files[key].id,
                                            total_size: files[key].total_size,
                                            form: files[key].form,
                                            origin_name: files[key].origin_name,
                                            content_type: files[key].content_type,
                                            upload_time: files[key].upload_time,
                                            boundary: files[key].boundary,
                                            file_name: files[key].file_name,
                                            path: files[key].path,
                                            md5: files[key].md5,
                                            batch: files[key].batch,
                                            extend: files[key].extend,
                                        };
                                        fs.writeFileSync(fi, JSON.stringify(notExistsFileInfo).encrypt());
                                        result.push({
                                            id: notExistsFileInfo.id,
                                            total_size: notExistsFileInfo.total_size,
                                            form: notExistsFileInfo.form,
                                            origin_name: notExistsFileInfo.origin_name,
                                            content_type: notExistsFileInfo.content_type,
                                            upload_time: notExistsFileInfo.upload_time,
                                            md5: notExistsFileInfo.md5,
                                            batch: notExistsFileInfo.batch,
                                            extend: notExistsFileInfo.extend,
                                        });
                                    }
                                }
                            }
                            log.info('文件上传成功:', result);
                            res.end(JSON.stringify(result));
                        }
                    }
                    catch (e) {
                        log.error('文件上传失败:', e);
                        res.writeHead(500);
                        res.end(e.message || "");
                    }
                });
            }
            catch (e) {
                log.error('文件上传失败:', e);
                res.writeHead(500);
                res.end(err.message || "");
            }
        } else {
            //其余接口
            if (req.path.replace('/', '').isGuid()) {
                let guid = req.path.replace(/\//g, '');
                const fi = path.join(conf.path, './' + guid + '.fi');
                if (!fs.existsSync(fi)) {
                    //没有上传记录
                    log.warn('没有文件', guid, '的上传记录');
                    res.writeHead(404);
                    res.end('fileinfo not exists');
                }
                else {
                    const file_info = JSON.parse(fs.readFileSync(fi).toString().decrypt());
                    if (!fs.existsSync(file_info.path + file_info.file_name)) {
                        //实体文件不存在
                        log.warn('实体文件', guid, '不存在');
                        res.writeHead(404);
                        res.end('file not exists');
                    } else {
                        if (req.query && req.query.action && (req.query.action == "download" || req.query.action == "down")) {
                            res.setEncoding = 'utf-8';
                            res.setHeader('Content-Type', 'application/octet-stream');
                            res.setHeader('Content-Disposition', 'attachment; filename=' + encodeURIComponent(file_info.origin_name));
                            res.setHeader('Content-Length', file_info.total_size);
                            fs.createReadStream(file_info.path + file_info.file_name).pipe(res);
                        }
                        else if (req.query && req.query.action && (req.query.action == "attribute" || req.query.action == "attr")) {
                            res.writeHead(200, { 'Content-Type': 'application/json;charset:utf8;' });
                            res.end(JSON.stringify({
                                code: 0,
                                message: {
                                    id: file_info.id,
                                    total_size: file_info.total_size,
                                    form: file_info.form,
                                    origin_name: file_info.origin_name,
                                    content_type: file_info.content_type,
                                    batch: file_info.batch,
                                    extend: file_info.extend,
                                    upload_time: file_info.upload_time
                                }
                            }));
                        } else {
                            res.setEncoding = 'utf-8';
                            if (file_info.content_type.startWith('video/') ||
                                file_info.content_type.startWith('audio/') ||
                                file_info.content_type.startWith('image/') ||
                                file_info.content_type.startWith('text/') ||
                                // file_info.content_type == 'application/log' ||
                                file_info.content_type == 'application/pdf') {
                                res.writeHead(200, { 'Content-Type': file_info.content_type });
                                var rs = fs.createReadStream(file_info.path + file_info.file_name);
                                rs.on('data', function (filestream) {
                                    res.write(filestream);
                                });
                                rs.on('end', function () {
                                    res.end();
                                });
                            } else if (file_info.content_type == 'application/log') {
                                res.writeHead(200, { 'Content-Type': 'text/plan;charset=utf-8' });
                                var text = fs.readFileSync(file_info.path + file_info.file_name);
                                res.end(text);
                            } else {
                                log.warn('非文本/视频/音频/图片无法进行预览');
                                // res.setEncoding = 'utf-8';
                                res.writeHead(404);
                                // res.end('Non text / video / audio / picture cannot be previewed');
                                res.end();
                            }
                        }
                    }
                }
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
                var rs = fs.createReadStream(path.join(__dirname, './resource.html'), {
                    encoding: 'utf8'
                });
                rs.on('data', function (filestream) {
                    res.write(filestream);
                });
                rs.on('end', function () {
                    res.end();
                });
            }
        }
    } catch (e) {
        log.error('请求处理异常:' + e.message + ',发送错误statusCode:' + (e.code || 500) + '到客户端');
        res.writeHead(500);
        res.end(e.message);
    }
});
server.on('listening', async function () {
    //创建必要的文件夹
    fac.fs.mkdirSync(conf.path);
    log.info(`fa-comm.resource Server Start Listening on port:${conf.port}`);
});
//开始监听
server.listen(conf.port);