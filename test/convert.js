const convert = require('../lib/comm/convert');

let json1 = { "a": "a" };
let json2 = { "b": "b" };
let json3 = { "a": ".a.", "c": { "c1": "c1", "c2": "c2" } };
let json4 = { "c": { "c2": "c02" } };

let json;
json = convert.combineJson();
json = convert.combineJson(json1);
json = convert.combineJson(json1, json2, json3, json4);