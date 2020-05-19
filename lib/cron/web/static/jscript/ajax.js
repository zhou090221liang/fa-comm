var $ajax = function (options) {
    options = options || {};
    options.type = options.type || 'GET';
    var success = options.success && typeof options.success == 'function' ? options.success : function (data) {
        console.log(data);
    };
    options.success = function (data) {
        data = JSON.parse(data);
        success(data);
    };
    var user = window.sessionStorage['user'];
    // options.beforesend = function (xhr) {
    //     xhr.setRequestHeader('Authorization', "user " + encodeURIComponent(user));
    // };
    options.headers = options.headers || {};
    options.headers['Authorization'] = "user " + encodeURIComponent(user);
    $.ajax(options);
}