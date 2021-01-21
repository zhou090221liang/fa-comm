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

console.log('获取当前月份的月天数：' + dateComm.getMonthDays());
console.log('获取2020-02-01所在月份的月天数：' + dateComm.getMonthDays('2020-02-01'));
console.log('获取2021-02-01所在月份的月天数：' + dateComm.getMonthDays('2021-02-01'));

console.log('获取指定日期上个月的第一天：', dateComm.getPriorMonthFirstDay().format('yyyy-MM-dd hh:mm:ss'));
console.log('2021-03-01 上个月的第一天：', dateComm.getPriorMonthFirstDay('2021-03-01').format('yyyy-MM-dd hh:mm:ss'));

console.log('获取指定日期下个月的第一天：', dateComm.getNextMonthFirstDay().format('yyyy-MM-dd hh:mm:ss'));
console.log('2020-12-01 下个月的第一天：', dateComm.getNextMonthFirstDay('2020-12-01').format('yyyy-MM-dd hh:mm:ss'));

console.log('获取指定日期上个月的时间范围：', dateComm.getPreviousMonth().map(item => item.format('yyyy-MM-dd hh:mm:ss')));
console.log('2021-03-01 上个月的时间范围：', dateComm.getPreviousMonth('2021-03-01').map(item => item.format('yyyy-MM-dd hh:mm:ss')));

console.log('获取指定日期下个月的时间范围：', dateComm.getNextMonth().map(item => item.format('yyyy-MM-dd hh:mm:ss')));
console.log('2021-03-01 下个月的时间范围：', dateComm.getNextMonth('2021-03-01').map(item => item.format('yyyy-MM-dd hh:mm:ss')));

console.log('获取指定日期上一周的时间范围：', dateComm.getPreviousWeek().map(item => item.format('yyyy-MM-dd hh:mm:ss')));
console.log('2021-01-01 上一周的时间范围：', dateComm.getPreviousWeek('2021-01-01').map(item => item.format('yyyy-MM-dd hh:mm:ss')));

console.log('获取指定日期下一周的时间范围：', dateComm.getNextWeek().map(item => item.format('yyyy-MM-dd hh:mm:ss')));
console.log('2021-01-01 下一周的时间范围：', dateComm.getNextWeek('2021-01-01').map(item => item.format('yyyy-MM-dd hh:mm:ss')));

console.log('获取去年的时间范围：', dateComm.getPreviousYear().map(item => item.format('yyyy-MM-dd hh:mm:ss')));
console.log('2020-01-01 上一年的时间范围：', dateComm.getPreviousYear('2020-01-01').map(item => item.format('yyyy-MM-dd hh:mm:ss')));

console.log('获取明年的时间范围：', dateComm.getNextYear().map(item => item.format('yyyy-MM-dd hh:mm:ss')));
console.log('2020-01-01 下一年的时间范围：', dateComm.getNextYear('2020-01-01').map(item => item.format('yyyy-MM-dd hh:mm:ss')));

console.log('获取上一毫秒：', dateComm.dateAddMilliseconds(-1).format('yyyy-MM-dd hh:mm:ss'));
console.log('获取下一毫秒：', dateComm.dateAddMilliseconds(1).format('yyyy-MM-dd hh:mm:ss'));

console.log('获取上一秒：', dateComm.dateAddSeconds(-1).format('yyyy-MM-dd hh:mm:ss'));
console.log('获取下一秒：', dateComm.dateAddSeconds(1).format('yyyy-MM-dd hh:mm:ss'));

console.log('获取上一分：', dateComm.dateAddMinutes(-1).format('yyyy-MM-dd hh:mm:ss'));
console.log('获取下一分：', dateComm.dateAddMinutes(1).format('yyyy-MM-dd hh:mm:ss'));

console.log('获取上一时：', dateComm.dateAddHours(-1).format('yyyy-MM-dd hh:mm:ss'));
console.log('获取下一时：', dateComm.dateAddHours(1).format('yyyy-MM-dd hh:mm:ss'));

console.log('获取昨天：', dateComm.dateAddDays(-1).format('yyyy-MM-dd hh:mm:ss'));
console.log('获取明天：', dateComm.dateAddDays(1).format('yyyy-MM-dd hh:mm:ss'));

console.log('获取上周：', dateComm.dateAddWeeks(-1).format('yyyy-MM-dd hh:mm:ss'));
console.log('获取下周：', dateComm.dateAddWeeks(1).format('yyyy-MM-dd hh:mm:ss'));

console.log('获取上月：', dateComm.dateAddMonths(-1).format('yyyy-MM-dd hh:mm:ss'));
console.log('获取下月：', dateComm.dateAddMonths(1).format('yyyy-MM-dd hh:mm:ss'));

console.log('获取去年：', dateComm.dateAddYears(-1).format('yyyy-MM-dd hh:mm:ss'));
console.log('获取明年：', dateComm.dateAddYears(1).format('yyyy-MM-dd hh:mm:ss'));