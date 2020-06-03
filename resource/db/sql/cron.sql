create table if not exists cron_user(
    loginid char(5) primary key NOT NULL,
    loginpwd char(32) NOT NULL,
    is_change int NOT NULL
);

create table if not exists cron_config(
    id char(22) primary key not null,
    status int not null,
    name varchar(50) NOT NULL,
    schedule varchar(2000) NOT NULL,
    exec_path varchar(2000) NOT NULL,
    exec_file varchar(2000) NOT NULL,
    create_time datetime not null,
    init_time datetime,
    start_time datetime,
    stop_time datetime,
    process varchar(2000)
);

create table if not exists cron_instance(
    id char(22) primary key not null,
    cron_id char(22) not null,
    start_time datetime NOT NULL,
    end_time datetime,
    stdout text,
    stderr text,
    code varchar(50),
    err_info text
);