require('../index');

var s = "我们的";
console.log(s, "的字节长度:", s.getByteLength());

var d = new Date();
console.log("格式化后的时间:", d.format());

var a = ["a", "c"];
a.insert(1, "b");
console.log("插入元素后的数组:", a);

var ss1 = 1;
var ss2 = "a";
var ss3 = { "a": 1 };
console.log("toText:", ss1.toText(), ss2.toText(), ss3.toText());

var url = "http://www.baidu.com";
console.log("isUrl:", url.isUrl());

var id = "320586198711011120";
console.log("isChineseCitizenIdCardNumber:", id.isChineseCitizenIdCardNumber(), id.isChineseCitizenIdCardNumber(1), id.isChineseCitizenIdCardNumber(2));

var hump = "aBcDe";
console.log("toLine:", hump.toLine());

var text = "这是明文";
console.log("sha1:", text.sha1());
console.log("md5:", text.md5());
var text1 = text.aes();
console.log("aes 加密:", text1);
console.log("aes 解密:", text1.fromAes());

