create table if not exists FACOMMAPILOG(
    id char(22) primary key not null comment '主键',
    host varchar(50) not null comment '当前服务器IP地址，用于区分不同项目的引用',
    qid char(22) NOT NULL comment '请求编号',
    pid char(20) NOT NULL comment '进程编号',
    ip char(30) NOT NULL comment '客户端IP地址',
    url text comment 'Api接口地址',
    path text comment '请求路晋',
    method char(50) comment '请求方式',
    query text comment 'querystring参数',
    params text comment '请求路由自定义参数',
    originBody text comment '原始请求数据包',
    body text comment '请求数据包',
    headers text comment '请求头信息',
    req_time datetime comment '请求时间',
    res_status int comment '响应状态码',
    res_message text comment '响应消息内容',
    res_time datetime comment '响应时间'
);