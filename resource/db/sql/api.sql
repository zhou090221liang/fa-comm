create table if not exists api_log(
    id char(22) primary key not null,
    host varchar(50) not null,
    qid char(22) NOT NULL,
    pid char(20) NOT NULL,
    ip char(30) NOT NULL,
    url text,
    path text,
    method char(50),
    query text,
    params text,
    body text,
    headers text,
    req_time datetime,
    res_status int,
    res_message text,
    res_time datetime
);