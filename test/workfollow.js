const comm = require('../index');

function showName(stdin) {
    console.log("你好:" + stdin);
}

function showAge(stdin) {
    console.log("你" + stdin + "岁了");
}

function showGoodbye(stdin) {
    console.log('再见');
}

const work = [{
    "id": "q1",
    "question": "你叫什么名字?",
    "answer": {
        "张三": {
            "next": "q2",
            "exec": showName
        },
        "不告诉你": {
            "exec": showGoodbye
        }
    },
    "default_answer": {
        "exec": showGoodbye
    }
}, {
    "id": "q2",
    "question": "你几岁了?",
    "answer": {
        "1": {
            "exec": showAge
        },
        "不告诉你": {
            "exec": showGoodbye
        }
    },
    "default_answer": {
        "exec": showGoodbye
    }
}];

(async function () {
   await comm.workfollow(work);
})();