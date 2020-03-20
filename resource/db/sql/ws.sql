create table if not exists socket_log(
    id char(22) primary key not null,
    `from` varchar(50) NOT NULL,
    `to` varchar(50) NOT NULL,
    pid char(20) NOT NULL,
    url text,
    body text,
    send_time datetime
);