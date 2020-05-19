var i = 0;
function out() {
    console.log('测试' + i);
    if (i < 5) {
        i++
        setTimeout(() => {
            out();
        }, 1000);
    }
}

out();