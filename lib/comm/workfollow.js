const readline = require('readline');
const verify = require('./verify');
// const os = require('os');

async function run(wf) {
    if (wf && verify.isJsonArray(wf)) {
        let rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        let now = wf[0];
        let _continue = true;
        let _answer;
        while (_continue) {
            _continue = false;
            _answer = await question(rl, now.question);
            if (now.answer[_answer]) {
                //回答内容存在
                if (now.answer[_answer] && now.answer[_answer].exec) {
                    //存在回答内容不存在的操作
                    if (Object.prototype.toString.call(now.answer[_answer].exec) == '[object AsyncFunction]') {
                        //回答内容存在，执行async函数
                        console.info("回答内容存在，执行async函数:" + now.answer[_answer].exec.name);
                        await now.answer[_answer].exec(answer);
                    } else {
                        //回答内容存在，执行sync函数
                        console.info("回答内容存在，执行sync函数:" + now.answer[_answer].exec.name);
                        now.answer[_answer].exec(_answer);
                    }
                    //是否存在下一步操作
                    if (now.answer[_answer].next) {
                        if (Object.prototype.toString.call(now.answer[_answer].next) == '[object AsyncFunction]') {
                            //该回答存在下一步，执行async函数
                            console.info("该回答" + _answer + "存在下一步，执行async函数:" + now.answer[_answer].next.name);
                            await now.answer[_answer].next();
                        }
                        else if (Object.prototype.toString.call(now.default_answer.next) == '[object Function]') {
                            //该回答存在下一步，执行sync函数
                            console.info("该回答" + _answer + "存在下一步，执行sync函数:" + now.answer[_answer].next.name);
                            now.answer[_answer].next();
                        }
                        //下一步非一个function，判断是否是另一个work对象
                        else if (typeof now.answer[_answer].next == 'string') {
                            const next = wf.find(item => item.id == now.answer[_answer].next);
                            if (next) {
                                _continue = true;
                                console.info("该回答" + _answer + "存在下一步，是一个对象:", next);
                                now = next;
                            } else {
                                console.warn("该回答" + _answer + ",next定义的work不存在".toWarn());
                                exit();
                            }
                        } else {
                            console.warn("该回答" + _answer + ",next定义错误(只能是id或asyncFunction或syncFunction)".toWarn());
                            exit();
                        }
                    } else {
                        console.warn("该回答" + _answer + ",未定义下一步操作".toWarn());
                        exit();
                    }
                } else {
                    //不存在回答内容不存在的操作
                    console.warn("未定义回答内容存在的情况".toWarn());
                    exit();
                }
            } else {
                //回答内容不存在
                if (now.default_answer && now.default_answer.exec) {
                    //存在回答内容不存在的操作
                    if (Object.prototype.toString.call(now.default_answer.exec) == '[object AsyncFunction]') {
                        //回答内容不存在，执行async函数
                        console.info("回答内容不存在，执行async函数:" + now.default_answer.exec.name);
                        await now.default_answer.exec(answer);
                    } else {
                        //回答内容不存在，执行sync函数
                        console.info("回答内容不存在，执行sync函数:" + now.default_answer.exec.name);
                        now.default_answer.exec(_answer);
                    }
                    //是否存在下一步操作
                    if (now.default_answer.next) {
                        if (Object.prototype.toString.call(now.default_answer.next) == '[object AsyncFunction]') {
                            //存在下一步，执行async函数
                            console.info("存在下一步，执行async函数:" + now.default_answer.next.name);
                            await now.default_answer.next();
                        }
                        else if (Object.prototype.toString.call(now.default_answer.next) == '[object Function]') {
                            //存在下一步，执行sync函数
                            console.info("存在下一步，执行sync函数:" + now.default_answer.next.name);
                            now.default_answer.next();
                        }
                        //下一步非一个function，判断是否是另一个work对象
                        else if (typeof now.default_answer.next == 'string') {
                            const next = wf.find(item => item.id == now.default_answer.next);
                            if (next) {
                                _continue = true;
                                console.info("存在下一步，是一个对象:", next);
                                now = next;
                            } else {
                                console.warn("next定义的work不存在".toWarn());
                                exit();
                            }
                        } else {
                            console.warn("next定义错误(只能是id或asyncFunction或syncFunction)".toWarn());
                            exit();
                        }
                    } else {
                        console.warn("未定义下一步操作".toWarn());
                        exit();
                    }
                } else {
                    //不存在回答内容不存在的操作
                    console.warn("未定义回答内容不存在的情况".toWarn());
                    exit();
                }
            }
        }

        rl.on("close", function () {
            exit();
        });
    }
}

function question(rl, question) {
    return new Promise(function (resolve, reject) {
        rl.question(question, function (answer) {
            resolve(answer);
        });
    });
}

function exit() {
    process.exit(0);
}

module.exports = run;