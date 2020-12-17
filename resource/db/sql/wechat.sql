create table if not exists wechat(
    account_id varchar(2000) primary key not null,
    appid varchar(2000) not null,
    appsecret varchar(2000) not null,
    api_url varchar(2000),
    token varchar(2000),
    js_domain varchar(2000),
    oauth_url varchar(2000),
    access_token varchar(2000),
    access_token_expires_in datetime
);