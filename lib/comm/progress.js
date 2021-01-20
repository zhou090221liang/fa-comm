// 这里用到一个很实用的 npm 模块，用以在同一行打印文本
const slog = require('single-line-log').stdout;
const verify = require('./verify');
const convert = require('./convert');

module.exports = class ProgressBar {
    /**
     *Creates an instance of ProgressBar.
    * @param {JSON} configuration 配置信息，可以包括：\
    * title：String类型，标题，默认空\
    * length：Number类型，进度条的占位长度，需要大于0的一个正整数，默认25\
    * showPercentage：Boolean类型，表示是否显示当前的百分比，默认true\
    * showProgress：Boolean类型，表示是否显示进度条信息，默认true\
    * showLocation：Boolean类型，表示是否显示当前位置，默认false\
    * showDuration：Boolean类型，表示是否显示持续的时间，默认false\
    * showRemainingTime：Boolean类型，表示是否显示预计剩余时间，默认false\
    * showSpeed：Boolean类型，表示是否显示当前速度，速度计算方式为第一次调用render/show方法后，开始自动计时，默认false\
    * speedUnit：String类型，速度的单位，会自动加上"/s"\
    * autoSpeedUnit：Boolean类型，表示是否自动转换单位，注意，该配置项只能用于文件上传下载等操作，render/show方法传入的值单位必须是字节，默认false
    */
    constructor(configuration) {
        //title = "传输中",showPercentage = 0,show bar_length = 25
        configuration = configuration && verify.isJson(configuration) ? configuration : ((function () {
            try {
                return JSON.parse(configuration);
            } catch (e) {
                return {};
            }
        })());
        //标题
        configuration.title = configuration.title || "";
        //是否显示百分比
        configuration.showPercentage = configuration.showPercentage != undefined ? configuration.showPercentage : true;
        //是否显示进度条
        configuration.showProgress = configuration.showProgress != undefined ? configuration.showProgress : true;
        //是否显示当前位置
        configuration.showLocation = configuration.showLocation != undefined ? configuration.showLocation : false;
        //是否显示速度
        configuration.showSpeed = configuration.showSpeed != undefined ? configuration.showSpeed : false;
        //显示速度的文本
        configuration.speedText = configuration.speedText || "当前速度";
        //速度单位
        configuration.speedUnit = configuration.speedUnit || '';
        //是否自动转换单位，注意，该配置项只能用于文件上传下载等操作，render/show方法传入的值单位必须是字节
        configuration.autoSpeedUnit = configuration.autoSpeedUnit != undefined ? configuration.autoSpeedUnit : false;
        //是否显示预计剩余时间
        configuration.showRemainingTime = configuration.showRemainingTime != undefined ? configuration.showRemainingTime : false;
        //显示速度的文本
        configuration.remainingTimeText = configuration.remainingTimeText || "预计剩余时间";
        //是否显示已用时间
        configuration.showDuration = configuration.showDuration != undefined ? configuration.showDuration : false;
        //显示已用时间的文本
        configuration.durationText = configuration.durationText || "持续时间";
        //进度条长度
        configuration.length = configuration.length && configuration.length && !isNaN(configuration.length) > 0 ? parseInt(configuration.length) : 25;
        this.configuration = configuration;
        /**
         * 清除上次记录的开始时间，用于新任务的开始
         */
        this.clear = this.clearTask = function () {
            this.configuration.startTime = null;
            slog.clear();
            console.info("");
        };
        /**
         * 当行输出进度信息
         * @param {*} current 当前已经完成的数量
         * @param {*} total 任务数量总数
         * @param {*} describe 其他自定义显示文本
         */
        this.render = this.show = function (total = 100, current = 0, describe = '') {
            //最终显示文本
            let cmdText = '';
            //速度文本
            let speedText = '';
            //预计剩余
            let remainingTime = '';
            //已用时间
            let useTimeText = '';

            //计算速度
            if (this.configuration.showSpeed || this.configuration.showRemainingTime || this.configuration.showDuration) {
                //记录开始时间
                if (!this.configuration.startTime) {
                    this.configuration.startTime = new Date().getTime();
                }
                let nowTime = new Date().getTime();
                let useTime = (nowTime - this.configuration.startTime) / 1000;
                if (this.configuration.showDuration) {
                    useTimeText = convert.arrive_timer_format(useTime);
                }
                if (this.configuration.showRemainingTime) {
                    let myg = useTime / current;
                    let unUseTime = parseInt((total - current) * myg);
                    remainingTime = convert.arrive_timer_format(unUseTime);
                }
                if (this.configuration.showSpeed) {
                    let speed = parseInt(current / useTime);
                    if (this.configuration.autoSpeedUnit) {
                        //自动格式化字节单位
                        speed = convert.sizeFormat(speed);
                        speedText = speed + "/s";
                    } else {
                        speedText = speed + this.configuration.speedUnit + "/s";
                    }
                }
            }
            //拼接上标题
            cmdText += `${this.configuration.title} `;
            // 计算进度(子任务的 完成数 除以 总数)
            let percent = (current / total).toFixed(4);
            //拼接百分比
            if (this.configuration.showPercentage) {
                cmdText += `${(100 * percent).toFixed(2)}% `;
            }
            //拼接进度条控件
            if (this.configuration.showProgress) {
                // 计算需要多少个 █ 符号来拼凑图案
                var cell_num = Math.floor(percent * this.configuration.length);
                // 拼接黑色条
                var cell = '';
                for (var i = 0; i < cell_num; i++) {
                    cell += '█';
                }
                // 拼接灰色条
                var empty = '';
                for (var i = 0; i < this.configuration.length - cell_num; i++) {
                    empty += '░';
                }
                cmdText += `${cell}${empty} `;
            }
            //拼接当前位置
            if (this.configuration.showLocation) {
                cmdText += `${current}/${total} `;
            }
            //拼接速度
            if (this.configuration.showSpeed) {
                cmdText += `${this.configuration.speedText}:${speedText} `;
            }
            //拼接已用时间
            if (this.configuration.showDuration) {
                cmdText += `${this.configuration.durationText}:${useTimeText} `;
            }
            //拼接预计剩余
            if (this.configuration.showRemainingTime) {
                cmdText += `${this.configuration.remainingTimeText}:${remainingTime} `;
            }
            //拼接最后自定义文本
            // 在单行输出文本
            slog(cmdText);
        };
    }
}