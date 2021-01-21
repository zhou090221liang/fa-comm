const dateComm = require('../lib/comm/date');

console.log('本月第一天：', dateComm.getFirstDateOfMonth().format('yyyy-MM-dd hh:mm:ss'));
console.log('本月最后一天：', dateComm.getLastDateOfMonth().format('yyyy-MM-dd hh:mm:ss'));

console.log('2021-02 月第一天：', dateComm.getFirstDateOfMonth('2021-02-01').format('yyyy-MM-dd hh:mm:ss'));
console.log('2021-02 月最后一天：', dateComm.getLastDateOfMonth('2021-02-01').format('yyyy-MM-dd hh:mm:ss'));

console.log('本年第一天：', dateComm.getFirstDateOfYear().format('yyyy-MM-dd hh:mm:ss'));
console.log('本年最后一天：', dateComm.getLastDateOfYear().format('yyyy-MM-dd hh:mm:ss'));

console.log('本周的周起止时间：', dateComm.getCurrentWeek().map(item => item.format('yyyy-MM-dd hh:mm:ss')));
console.log('2020-02-28 周的周起止时间：', dateComm.getCurrentWeek('2020-02-28').map(item => item.format('yyyy-MM-dd hh:mm:ss')));

console.log('当月的月的起止时间：', dateComm.getCurrentMonth().map(item => item.format('yyyy-MM-dd hh:mm:ss')));
console.log('2021-02 当月的月的起止时间：', dateComm.getCurrentMonth('2021-02').map(item => item.format('yyyy-MM-dd hh:mm:ss')));

console.log('获取指定日期所在的季度的开始的月份：', dateComm.getQuarterSeasonStartMonth().format('yyyy-MM-dd hh:mm:ss'));
console.log('2021-05-01 所在的季度的开始的月份：', dateComm.getQuarterSeasonStartMonth('2021-05-01').format('yyyy-MM-dd hh:mm:ss'));

console.log('获取指定日期所在的季度的时间范围：', dateComm.getQuarterSeason().map(item => item.format('yyyy-MM-dd hh:mm:ss')));
console.log('2021-05-01 所在的季度的时间范围：', dateComm.getQuarterSeason('2021-05-01').map(item => item.format('yyyy-MM-dd hh:mm:ss')));

console.log('获取当前月份的月天数：'+dateComm.getMonthDays());
console.log('获取2020-02-01所在月份的月天数：'+dateComm.getMonthDays('2020-02-01'));
console.log('获取2021-02-01所在月份的月天数：'+dateComm.getMonthDays('2021-02-01'));

console.log('获取指定日期上个月的第一天：', dateComm.getPriorMonthFirstDay().format('yyyy-MM-dd hh:mm:ss'));
console.log('2021-03-01 上个月的第一天：', dateComm.getPriorMonthFirstDay('2021-03-01').format('yyyy-MM-dd hh:mm:ss'));

console.log('获取指定日期上个月的时间范围：', dateComm.getPreviousMonth().map(item => item.format('yyyy-MM-dd hh:mm:ss')));
console.log('2021-03-01 上个月的时间范围：', dateComm.getPreviousMonth('2021-03-01').map(item => item.format('yyyy-MM-dd hh:mm:ss')));

console.log('获取指定日期上一周的时间范围：', dateComm.getPreviousWeek().map(item => item.format('yyyy-MM-dd hh:mm:ss')));
console.log('2021-01-01 上一周的时间范围：', dateComm.getPreviousWeek('2021-01-01').map(item => item.format('yyyy-MM-dd hh:mm:ss')));

console.log('获取去年的时间范围：', dateComm.getPreviousYear().map(item => item.format('yyyy-MM-dd hh:mm:ss')));
console.log('2020-01-01 上一年的时间范围：', dateComm.getPreviousYear('2020-01-01').map(item => item.format('yyyy-MM-dd hh:mm:ss')));