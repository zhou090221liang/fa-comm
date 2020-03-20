create table if not exists upload(
    id char(32) primary key not null,
    size bigint,
    form varchar(200),
    origin_name varchar(500),
    type varchar(200),
    boundary varchar(500),
    file_name varchar(500),
    path text,
    md5 char(32),
    batch char(22),
    upload_time datetime,
    extend text
);