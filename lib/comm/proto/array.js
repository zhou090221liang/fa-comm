/**
 * 在数组的指定位置插入元素
 * @param {*} index
 * @param {*} item
 */
Array.prototype.insert = function (index, item) {
    this.splice(index || 0, 0, item || undefine);
};