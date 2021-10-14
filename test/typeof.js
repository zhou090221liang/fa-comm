/**
 * 数据类型等校验
 */
const comm = require('../index');

//校验数据类型：
//能精确识别 Number String Boolean Array JSON Function Undefined NULL Date RegExp Error
const data = {
    _number1: 1,
    _number2: 1.1,
    _number3: 0,
    _number4: 1.0,
    _string: "abcdefg",
    _boolean1: true,
    _boolean2: false,
    _array1: ["1", "2"],
    _array2: [1, "2"],
    _array3: ["1", { "a": "a" }],
    _array4: [{ "a": "a1" }, { "a": "a2" }],
    _array5: [1, 2],
    _array6: [new Error(), new Error()],
    _array7: [null, null],
    _array8: [undefined, void 0],
    _array9: [function () { }, function () { }],
    _array10: [/^[a-zA-Z]{5,20}$/, /^[a-zA-Z]{5,20}$/],
    _array11: [new Date(), new Date()],
    _array12: [true, false],
    _json: { "a": "a" },
    _function: function () { },
    _undefined1: undefined,
    _undefined2: void 0,
    _null: null,
    _date: new Date(),
    _regExp: /^[a-zA-Z]{5,20}$/,
    _error: new Error()
};

(async function () {
    for (const key in data) {
        console.log(`获取当前数据"${key}"的值"${data[key]}"的数据类型类型为${comm.typeof(data[key])}`);
    }
    console.log("---------------------------------------------------------");
    for (const key in data) {
        console.log(`获取当前数据"${key}"的值"${data[key]}"的详细数据类型类型为${comm.typeof(data[key], true)}`);
    }
})();