# h1 帮助文档
引用方式：
```
const comm = require('fa-comm');
```

## 通用操作类 Convert
---
***
### 转换成JSON对象 toJson
#### 输入参数
* obj [*]

#### 输出参数
* [JSON]

代码示例：
```
const json = comm.convert.toJson('{"name":"张三"}');
console.log(json,typeof json);
//{"name":"张三"} object
```
---
### 将Api请求包尝试转成JSON格式（xml或string转成JSON对象） requestData2Json
#### 输入参数
* data [*]

#### 输出参数
* \[JOSN || ""]

代码示例：
```
const json = comm.convert.toJson('{"name":"张三"}');
console.log(json,typeof json);
//{"name":"张三"} object
```
