/** 
 * 启动、停止、重启
 * 停止/重启 要考虑是否正在运行
 * 修改任务，必须先停止任务
 * 启动任务，先初始化
*/

const fac = require('../../../index');
const log = fac.createLog('fa-comm.api');
const path = require('path');
const fs = require('fs');

let conf;
try {
    conf = JSON.parse(process.argv[2]);
} catch (e) { }
if (!conf) {
    try {
        conf = require(process.argv[2]);
    } catch (e) { }
}
conf = conf || {};

const sqlite3 = new fac.sqlite3(conf.sqlite3file, false);
const cron = require('node-cron');

//任务id对应的schedule对象
const schedule = [];

/**
 * 初始化任务
 * @param {*} id
 * @returns
 */
const initTask = async function (id) {
    //查找任务
    const _schedule = await sqlite3.get('select * from cron_config where id = ?', [id]);
    if (!_schedule) {
        throw '任务不存在';
    }
    //任务是否已经被初始化
    for (let i = 0; i < schedule.length; i++) {
        if (schedule[i].id == id) {
            if (schedule[i].status != 0) {
                throw '任务正在运行无法被初始化';
            }
            //移除任务，重新初始化
            schedule.remove(i);
            break;
        }
    }
    //初始化任务
    const t = {
        id: _schedule.id,
        //任务状态 1启动 0停止 -1正在等待停止 2正在执行
        status: 0,
        name: _schedule.name,
        //任务计划
        schedule: _schedule.schedule,
        //任务类型 bash/node
        exec_type: _schedule.exec_type,
        //任务运行目录
        exec_path: _schedule.exec_path,
        //任务运行启动文件
        exec_file: _schedule.exec_file,
        //任务创建时间
        create_time: _schedule.create_time,
        //任务初始化时间
        init_time: new Date().Format(),
        //任务启动时间
        start_time: null,
        //任务停止时间
        stop_time: null,
        //任务对象
        task: cron.schedule(_schedule.schedule, async function () {
            let instance = {
                id: fac.guid.v22,
                cron_id: _schedule.id,
                start_time: new Date().Format()
            };
            try {
                //任务状态 1启动 0停止 -1正在等待停止 2正在执行
                await sqlite3.run('update cron_config set status = 2 where id = ?', [_schedule.id]);
                await sqlite3.run('insert into cron_instance(id,cron_id,start_time)values(?,?,?);', [
                    instance.id,
                    instance.cron_id,
                    instance.start_time
                ]);


                const runTask = await sqlite3.get('select * from cron_config where id = ?', [_schedule.id]);
                instance.stdout = '';
                instance.stderr = '';
                let { spawn } = require('child_process');
                const exec_file = path.join(runTask.exec_path, runTask.exec_file);
                if (!fs.existsSync(exec_file)) {
                    await sqlite3.run("update cron_instance set err_info = '可执行文件不存在' where id = ?", [
                        instance.id,
                    ]);
                }
                const command = `${runTask.exec_type} ${exec_file}`;
                console.info(`运行命令：${command}`);
                let proc = spawn(process.execPath, [exec_file], {
                    cwd: runTask.exec_path,
                    env: {
                        index: 0
                    }
                });
                proc.stdout.on('data', async (data) => {
                    instance.stdout += data.toString();
                });
                proc.stderr.on('data', async (data) => {
                    instance.stderr += data.toString();
                });
                proc.on('close', async (code) => {
                    await sqlite3.run('update cron_config set status = 1 where id = ?', [_schedule.id]);
                    instance.end_time = new Date().Format();
                    instance.code = code;
                    await sqlite3.run('update cron_instance set end_time = ?,stdout = ?,stderr = ?,code = ? where id = ?', [
                        instance.end_time,
                        instance.stdout,
                        instance.stderr,
                        instance.code,
                        instance.id,
                    ]);
                });

            } catch (e) {
                instance.err_info = e.message;
                await sqlite3.run('update cron_instance set err_info = ? where id = ?', [
                    instance.err_info,
                    instance.id,
                ]);
            }
        }, {
            scheduled: false
        })
    };
    //修改数据库信息
    await sqlite3.run('update cron_config set status = ?,init_time = ? where id = ?', [
        t.status,
        t.init_time,
        t.id
    ]);
    schedule.push(t);
    return t;
}

/**
 * 启动
 */
const start = async function (id) {
    // if (id) {
    //启动单一任务
    let task = null;
    try {
        task = await initTask(id);
    } catch (e) {
        log.warn('初始化任务异常：' + e.message);
        return new fac.sdk.UnifiedStyleErrorMessage(e.message);
    }
    //启动
    task.status = 1;
    task.start_time = new Date().Format();
    await sqlite3.run('update cron_config set status = ?,start_time = ? where id = ?', [
        task.status,
        task.start_time,
        task.id
    ]);
    task.task.start();
    return new fac.sdk.UnifiedStyleMessage();
    // } else {
    //     //启动所有任务
    //     const all = await sqlite3.all('select id from cron_config');
    //     for (const t of all) {
    //         const task = null;
    //         try {
    //             task = await initTask(t.id);
    //         } catch (e) {
    //             log.warn('(启动所有)初始化任务(' + t.name + ')异常：' + e.message);
    //             // return new fac.sdk.UnifiedStyleErrorMessage(e.message);
    //         }
    //         //启动
    //         task.status = 1;
    //         task.start_time = new Date();
    //         await sqlite3.run('update cron_config set status = ?,start_time = ? where id = ?', [
    //             task.status,
    //             task.start_time,
    //             task.id
    //         ]);
    //         task.task.start();
    //     }
    //     return new fac.sdk.UnifiedStyleMessage();
    // }
}

/**
 * 停止
 */
const stop = async function (id) {
    const runTask = schedule.find(item => item.id == id);
    if (!runTask) {
        return new fac.sdk.UnifiedStyleErrorMessage('任务不存在');
    }
    if (runTask.status == 2) {
        return new fac.sdk.UnifiedStyleErrorMessage('运行中的任务无法停止');
    }
    runTask.status = 0;
    runTask.stop_time = new Date().Format();
    await sqlite3.run('update cron_config set status = ?,stop_time = ? where id = ?', [
        runTask.status,
        runTask.stop_time,
        runTask.id
    ]);
    runTask.task.stop();
    return new fac.sdk.UnifiedStyleMessage();
}

/**
 * 运行一次
 * @param {*} id
 * @returns
 */
const once = async function (id) {
    let task = null;
    try {
        task = await initTask(id);
    } catch (e) {
        log.warn('初始化任务异常：' + e.message);
        return new fac.sdk.UnifiedStyleErrorMessage(e.message);
    }

    let instance = {
        id: fac.guid.v22,
        cron_id: id,
        start_time: new Date().Format()
    };

    try {
        //任务状态 1启动 0停止 -1正在等待停止 2正在执行
        // await sqlite3.run('update cron_config set status = 2 where id = ?', [id]);
        await sqlite3.run('insert into cron_instance(id,cron_id,start_time)values(?,?,?);', [
            instance.id,
            instance.cron_id,
            instance.start_time
        ]);
        const runTask = await sqlite3.get('select * from cron_config where id = ?', [id]);
        instance.stdout = '';
        instance.stderr = '';
        let { spawn } = require('child_process');
        const exec_file = path.join(runTask.exec_path, runTask.exec_file);
        if (!fs.existsSync(exec_file)) {
            await sqlite3.run("update cron_instance set err_info = '可执行文件不存在' where id = ?", [
                instance.id,
            ]);
            return new fac.sdk.UnifiedStyleErrorMessage('可执行文件不存在');
        }
        const command = `${runTask.exec_type} ${exec_file}`;
        console.info(`运行命令：${command}`);
        let proc = spawn(process.execPath, [exec_file], {
            cwd: runTask.exec_path,
            env: {
                index: 0
            }
        });
        proc.stdout.on('data', async (data) => {
            instance.stdout += data.toString();
        });
        proc.stderr.on('data', async (data) => {
            instance.stderr += data.toString();
        });
        proc.on('close', async (code) => {
            await sqlite3.run('update cron_config set status = 1 where id = ?', [id]);
            instance.end_time = new Date().Format();
            instance.code = code;
            await sqlite3.run('update cron_instance set end_time = ?,stdout = ?,stderr = ?,code = ? where id = ?', [
                instance.end_time,
                instance.stdout,
                instance.stderr,
                instance.code,
                instance.id,
            ]);
        });

    } catch (e) {
        instance.err_info = e.message;
        await sqlite3.run('update cron_instance set err_info = ? where id = ?', [
            instance.err_info,
            instance.id,
        ]);
    }

    return new fac.sdk.UnifiedStyleMessage();
}

module.exports = {
    start,
    stop,
    once
}