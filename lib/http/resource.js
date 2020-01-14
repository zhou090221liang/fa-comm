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
const log = fac.createLog('fa-comm.resource');
const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = fac.createMysqlConn(conf.mysql);
const formidable = require('formidable');
let facomm_upload;

const table = `\
    create table if not exists facomm_upload(\
        id char(32) primary key not null comment '主键,资源ID', \
        size bigint comment '文件大小', \
        form varchar(200) comment '上传表单名称', \
        origin_name varchar(500) comment '原始文件名称', \
        type varchar(200) comment '文件类型', \
        boundary varchar(500) comment '边界', \
        file_name varchar(500) comment '服务器上存放的文件名称', \
        path text comment '服务器上存放的文件路径', \
        md5 char(32) comment '文件的MD5值,用于相同文件校验', \
        batch char(22) comment '上传批次,用于标记是否同一个接口上传的多个文件', \
        upload_time datetime comment '文件上传时间', \
        extend text comment '扩展参数,可用于保存JSON等数据,实现自定义业务需求,上传文件时,可指定'
    );\
`;

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
            size: req.total_size,
            query: req.query
        });
        //判断接口
        if (req.method.toUpperCase() == "POST") {
            //上传文件
            try {
                let extend = decodeURIComponent(req.url).substring(1);
                extend = extend || req.headers['extend'];
                const start = new Date(), progress = new fac.progress('上传进度');
                let totalSize = 0;
                const form = new formidable.IncomingForm();
                form.encoding = 'utf-8';
                form.uploadDir = conf.path;
                form.maxFileSize = conf.size;
                form.hash = 'md5';
                form.on('progress', function (completed, total) {
                    totalSize = total;
                    progress.render({
                        completed,
                        total
                    });
                });
                form.parse(req, async function (err, fields, files) {
                    try {
                        if (err) {
                            log.error('文件上传失败(formidable):', err);
                            res.writeHead(500);
                            res.end(err.message || "");
                        } else {
                            end = new Date();
                            let speed = 0;
                            const now = ((new Date()) - start) / 1000;
                            if (now) {
                                speed = totalSize / now;
                            } else {
                                speed = totalSize;
                            }
                            console.log();
                            log.info(`文件接收完成,共${fac.fs.formatSize(totalSize)},总用时：${now}秒,平均速度:${fac.fs.formatSize(speed)}/s`);
                            const result = new Array();
                            for (const key in files) {
                                if (files[key].name && files[key].size && files[key].path && files[key].type && files[key].lastModifiedDate && files[key].hash) {
                                    files[key].id = fac.guid.v32;
                                    files[key].totalSize = req.total_size;
                                    files[key].form = key;
                                    files[key].origin_name = files[key].name;
                                    files[key].content_type = files[key].type;
                                    files[key].boundary = req.ct.substring(req.ct.indexOf('boundary=') + 9 || 0);
                                    files[key].file_name = path.win32.basename(files[key].path);
                                    files[key].path = files[key].path.replace(files[key].file_name, '');
                                    files[key].md5 = files[key].hash;
                                    files[key].batch = fac.guid.v22;
                                    files[key].upload_time = new Date().format('yyyy-MM-dd hh:mm:ss');
                                    files[key].extend = extend;
                                    const exists = await mysql.query("select * from facomm_upload where md5 = @md5@ order by upload_time", files[key]);
                                    if (exists && exists.length) {
                                        if (fs.existsSync(exists[0].path + exists[0].file_name)) {
                                            //已经有相同MD5的文件存在
                                            log.warn(`已经存在相同的文件(文件MD5),删除实体文件`);
                                            fs.unlinkSync(files[key].path + files[key].file_name);
                                            files[key].file_name = exists[0].file_name;
                                        } else {
                                            //修改文件名
                                            log.warn(`已经存在相同的文件(文件MD5),但原始文件已经丢失,将其余同文件修改成当前的文件名`);
                                            await mysql.query("update facomm_upload set file_name = @file_name@ where md5 = @md5@", files[key]);
                                        }
                                    }
                                    const _result = await facomm_upload.insert(files[key]);
                                    if (_result && _result.insertId) {
                                        result.push({
                                            id: files[key].id,
                                            size: files[key].size,
                                            form: files[key].form,
                                            name: files[key].origin_name,
                                            type: files[key].content_type,
                                            time: files[key].upload_time
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
            // if (!req.path.replace('/', '').isGuid()) {
            //     log.warn('404,接口地址错误');
            //     res.writeHead(404);
            //     res.end('api not exists');
            // } else {
            if (req.path.replace('/', '').isGuid()) {
                let guid = req.path.replace(/\//g, '');
                let file_info = await facomm_upload.select(guid);
                if (!file_info) {
                    //没有上传记录
                    log.warn('没有文件', guid, '的上传记录');
                    res.writeHead(404);
                    res.end('fileinfo not exists');
                }
                else {
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
                            res.setHeader('Content-Length', file_info.size);
                            fs.createReadStream(file_info.path + file_info.file_name).pipe(res);
                        }
                        else if (req.query && req.query.action && (req.query.action == "attribute" || req.query.action == "attr")) {
                            res.writeHead(200, { 'Content-Type': 'application/json;charset:utf8;' });
                            res.end(JSON.stringify({
                                code: 0,
                                message: {
                                    id: file_info.id,
                                    total_size: file_info.total_size,
                                    size: file_info.size,
                                    origin_name: file_info.origin_name,
                                    content_type: file_info.content_type,
                                    batch: file_info.batch,
                                    extend: file_info.extend,
                                    upload_time: file_info.upload_time
                                }
                            }));
                        } else {
                            if (file_info.content_type.startWith('video/') ||
                                file_info.content_type.startWith('audio/') ||
                                file_info.content_type.startWith('image/') ||
                                file_info.content_type.startWith('text/')) {
                                res.setEncoding = 'utf-8';
                                res.writeHead(200, { 'Content-Type': file_info.content_type });
                                var rs = fs.createReadStream(file_info.path + file_info.file_name);
                                rs.on('data', function (filestream) {
                                    res.write(filestream);
                                });
                                rs.on('end', function () {
                                    res.end();
                                });
                            } else {
                                log.warn('非文本/视频/音频/图片无法进行预览');
                                res.setEncoding = 'utf-8';
                                res.writeHead(404);
                                // res.end('Non text / video / audio / picture cannot be previewed');
                                res.end();
                            }
                        }
                    }
                }
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
                var rs = fs.createReadStream(path.join(__dirname, './resource.html'),{
                    encoding:'utf8'
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
        res.writeHead(500)
        res.end(e.message);
    }
});
server.on('listening', async function () {
    //创建数据表
    await mysql.query(table);
    //获取文件上传表
    facomm_upload = await mysql.getTable('facomm_upload');
    //创建必要的文件夹
    fac.fs.mkdirSync(conf.path);
    log.info(`fa-comm.resource Server Start Listening on port:${conf.port}`);
});
//开始监听
server.listen(conf.port);