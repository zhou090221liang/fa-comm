const guid = require('../index').guid;

console.log("v22:", guid.v22);
console.log("v32", guid.v32);
console.log("v36:", guid.v36);
console.log("v38:", guid.v38);
console.log("empty:", guid.empty);
console.log("newid:", guid.newid());
console.log("newid 22:", guid.newid(22));
console.log("newid 32:", guid.newid(32));
console.log("newid 36:", guid.newid(36));
console.log("newid 38:", guid.newid(38));
console.log("emptyid:", guid.emptyid());