# 日志表
create table if not exists facomm_apilog(
    id char(22) primary key not null comment '主键',
    qid char(22) NOT NULL COMMENT '请求序列号',
    pid char(20) NOT NULL COMMENT '进程编号',
    ip char(30) NOT NULL COMMENT '客户端IP地址',
    url text comment '请求地址',
    method char(50) comment '请求方式',
    query text comment '请求参数',
    params text comment '请求参数',
    body text comment '请求包',
    headers text comment '请求头',
    req_type char(10) comment '请求业务协议',
    req_auth char(32) comment '请求认证信息',
    req_user char(22) comment '请求业务用户',
    req_time datetime comment '请求时间',
    res_status int comment '响应状态码',
    res_message text comment '响应内容',
    res_time datetime comment '响应时间'
);

# 权限配置表
create table if not exists `facomm_role_permission` (
  `id` int AUTO_INCREMENT NOT NULL COMMENT '主键',
  `key` varchar(22) not null COMMENT '路由键,如list、detail、add、edit、del、audit、import、export、enabled、disabled、download、sync',
  `value` char(22) DEFAULT NULL COMMENT '路由值,如列表、详情、新增、修改、删除、审核、导入、导出、启用、禁用、下载、同步',
  `uid` char(22)  DEFAULT NULL COMMENT '操作人',
  `time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '操作时间',
  `is_delete` smallint(6) DEFAULT '0' COMMENT '是否已删除',
  PRIMARY KEY (`id`)
);

INSERT IGNORE INTO `facomm_role_permission`(id,`key`,`value`) VALUES (1,'list','列表');
INSERT IGNORE INTO `facomm_role_permission`(id,`key`,`value`) VALUES (2,'detail','详情');
INSERT IGNORE INTO `facomm_role_permission`(id,`key`,`value`) VALUES (3,'add','新增');
INSERT IGNORE INTO `facomm_role_permission`(id,`key`,`value`) VALUES (4,'edit','修改');
INSERT IGNORE INTO `facomm_role_permission`(id,`key`,`value`) VALUES (5,'del','删除');
INSERT IGNORE INTO `facomm_role_permission`(id,`key`,`value`) VALUES (6,'audit','审核');
INSERT IGNORE INTO `facomm_role_permission`(id,`key`,`value`) VALUES (7,'import','导入');
INSERT IGNORE INTO `facomm_role_permission`(id,`key`,`value`) VALUES (8,'export','导出');
INSERT IGNORE INTO `facomm_role_permission`(id,`key`,`value`) VALUES (9,'enabled','启用');
INSERT IGNORE INTO `facomm_role_permission`(id,`key`,`value`) VALUES (10,'disabled','禁用');
INSERT IGNORE INTO `facomm_role_permission`(id,`key`,`value`) VALUES (11,'download','下载');
INSERT IGNORE INTO `facomm_role_permission`(id,`key`,`value`) VALUES (12,'sync','同步');

# 模块表
CREATE TABLE IF NOT EXISTS facomm_menu (
  `id` char(22)  NOT NULL COMMENT '模块编号',
  `name` varchar(50)  DEFAULT NULL COMMENT '模块名称',
  `icon` char(38)  DEFAULT NULL COMMENT '图标',
  `sort` smallint(6) DEFAULT '0' COMMENT '排序',
  `uid` char(22)  DEFAULT NULL COMMENT '操作人',
  `time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '操作时间',
  `is_delete` smallint(6) DEFAULT '0' COMMENT '是否已删除',
  PRIMARY KEY (`id`)
);

# 菜单表
CREATE TABLE IF NOT EXISTS facomm_menu (
  `id` char(22)  NOT NULL COMMENT '菜单编号',
  `name` varchar(50)  DEFAULT NULL COMMENT '菜单名称',
  `icon` char(38)  DEFAULT NULL COMMENT '图标',
  `sort` smallint(6) DEFAULT '0' COMMENT '排序',
  `module_id` char(22)  DEFAULT NULL COMMENT '模块编号',
  `url` varchar(200)  DEFAULT NULL COMMENT '菜单地址',
  `uid` char(22)  DEFAULT NULL COMMENT '操作人',
  `time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '操作时间',
  `is_delete` smallint(6) DEFAULT '0' COMMENT '是否已删除',
  PRIMARY KEY (`id`)
);

# 角色定义表
create table if not exists facomm_role (
  `id` char(22) NOT NULL COMMENT '角色编号',
  `name` varchar(50) DEFAULT NULL COMMENT '角色名称',
  `is_super` smallint(6) DEFAULT '0' COMMENT '是否超级管理员',
  `notes` text  COMMENT '说明',
  `uid` char(22) DEFAULT NULL COMMENT '操作人',
  `time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '操作时间',
  `is_delete` smallint(6) DEFAULT '0' COMMENT '是否已删除',
  PRIMARY KEY (`id`)
);

INSERT IGNORE INTO `facomm_role` VALUES ('0000000000000000000001','超级管理员',1,'无所不能,一般只开放给程序员',NULL,NOW(),0);
INSERT IGNORE INTO `facomm_role` VALUES ('0000000000000000000003','Api',0,'默认无任何权限,需要手动配置,也是普通用户创建后默认使用的权限',NULL,NOW(),0);

# 角色配置表
create table if not exists `facomm_role_define` (
  `id` char(22) NOT NULL COMMENT '主键',
  `role_id` char(22) DEFAULT NULL COMMENT '角色id',
  `menu_id` char(22) DEFAULT NULL COMMENT '菜单id',
  `permission` int(11) DEFAULT '0' COMMENT '权限总值',
  `uid` char(22) DEFAULT NULL COMMENT '操作人',
  `time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '操作时间',
  `is_delete` smallint(6) DEFAULT '0' COMMENT '是否已删除',
  PRIMARY KEY (`id`)
);

# 账号表
create table if not exists facomm_account (
  `id` char(22) NOT NULL COMMENT '主键',
  `name` varchar(200)  NOT NULL COMMENT '名称',
  `login_id` varchar(36) NOT NULL COMMENT '登录名',
  `login_pwd` char(36) NULL COMMENT '登录密码 admin为16位MD5加密 其他为没有-的uuid',
  `type` int not NULL COMMENT '账号类型 1 admin 2 openapi 3 api',
  `role_id` char(22) DEFAULT NULL COMMENT '所属角色',
  `is_delete` smallint(6) DEFAULT '0' COMMENT '是否已删除',
  PRIMARY KEY (`id`)
);

INSERT IGNORE INTO `facomm_account` VALUES ('0000000000000000000001','超级管理员','admin','49BA59ABBE56E057',1,'0000000000000000000001',0);

# 登录日志表
CREATE TABLE IF NOT EXISTS `facomm_login_info` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `account_id` char(22)  NULL COMMENT '账号编号',
  `login_id` varchar(16)  NULL COMMENT '登录名',
  `login_pwd` char(16)  NULL COMMENT '登录密码 16位MD5加密',
  `ip` char(20)  NULL COMMENT '客户端IP',
  `time` datetime DEFAULT NULL COMMENT '登录时间',
  `result` smallint(6) DEFAULT NULL COMMENT '登录结果 1:成功 0:失败',
  `token` char(32)  NULL COMMENT 'token值',
  PRIMARY KEY (`id`)
);

# 系统配置表
CREATE TABLE IF NOT EXISTS `facomm_config` (
  `key` varchar(50) not NULL COMMENT '键',
  `value` varchar(2000)  NULL COMMENT '值',
  `notes` varchar(200)  NULL COMMENT '配置说明',
  `uid` char(32)  NULL COMMENT '操作人',
  `time` datetime DEFAULT NULL COMMENT '操作时间',
  PRIMARY KEY (`key`)
);

INSERT IGNORE INTO `facomm_config`(`key`,`value`,`notes`) VALUES ('admin_token_check','1','是否开启Admin的Token(登录)验证机制,1或0');
INSERT IGNORE INTO `facomm_config`(`key`,`value`,`notes`) VALUES ('admin_token_check_timeout','1800','Admin的Token超时时间,单位秒');
INSERT IGNORE INTO `facomm_config`(`key`,`value`,`notes`) VALUES ('admin_token_check_timeout_auto_delay','1','Admin的Token超时时间,是否自动延期(每次请求)');
INSERT IGNORE INTO `facomm_config`(`key`,`value`,`notes`) VALUES ('openapi_token_check','1','是否开启OpenApi的Token验证机制,1或0');
INSERT IGNORE INTO `facomm_config`(`key`,`value`,`notes`) VALUES ('openapi_token_check_timeout','86400','OpenApi的Token超时时间,单位秒');
INSERT IGNORE INTO `facomm_config`(`key`,`value`,`notes`) VALUES ('openapi_token_check_timeout_auto_delay','0','OpenApi的Token超时时间,是否自动延期(每次请求)');
INSERT IGNORE INTO `facomm_config`(`key`,`value`,`notes`) VALUES ('api_token_check','1','是否开启Api的Token验证机制,1或0');
INSERT IGNORE INTO `facomm_config`(`key`,`value`,`notes`) VALUES ('api_token_check_timeout','86400','Api的Token超时时间,单位秒');
INSERT IGNORE INTO `facomm_config`(`key`,`value`,`notes`) VALUES ('api_token_check_timeout_auto_delay','1','Api的Token超时时间,是否自动延期(每次请求)');

INSERT IGNORE INTO `facomm_config`(`key`,`value`,`notes`) VALUES ('admin_ip_check','0','是否开启Admin的Ip每分钟请求次数限制');
INSERT IGNORE INTO `facomm_config`(`key`,`value`,`notes`) VALUES ('admin_ip_check_count','0','Admin的Ip每分钟请求限制次数,0为不允许');
INSERT IGNORE INTO `facomm_config`(`key`,`value`,`notes`) VALUES ('openapi_ip_check','1','是否开启OpenApi的Ip每分钟请求次数限制');
INSERT IGNORE INTO `facomm_config`(`key`,`value`,`notes`) VALUES ('openapi_ip_check_count','12','OpenApi的Ip每分钟请求限制次数,0为不允许');
INSERT IGNORE INTO `facomm_config`(`key`,`value`,`notes`) VALUES ('api_ip_check','1','是否开启Api的Ip每分钟请求次数限制');
INSERT IGNORE INTO `facomm_config`(`key`,`value`,`notes`) VALUES ('api_ip_check_count','45','Api的Ip每分钟请求限制次数,0为不允许');
