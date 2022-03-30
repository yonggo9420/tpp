
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for bill
-- ----------------------------
DROP TABLE IF EXISTS `bill`;
CREATE TABLE `bill`  (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `userid` int(11) NULL DEFAULT NULL COMMENT '商户id',
  `type` int(11) NULL DEFAULT NULL COMMENT '操作(1为充值,2为消费)',
  `money` float NOT NULL DEFAULT 0 COMMENT '金额',
  `overtime` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '处理时间(时间戳)',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for collection_code
-- ----------------------------
DROP TABLE IF EXISTS `collection_code`;
CREATE TABLE `collection_code`  (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `mid` int(11) NULL DEFAULT NULL COMMENT '商户id',
  `type` int(11) NOT NULL DEFAULT 1 COMMENT '收款码类型(微信1  支付宝2   QQ4)',
  `payurl` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '收款码解析信息',
  `isok` int(11) NOT NULL DEFAULT 1 COMMENT '是否使用(0为不使用,1为使用)',
  `remarks` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注',
  `add_time` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '上传时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for order
-- ----------------------------
DROP TABLE IF EXISTS `order`;
CREATE TABLE `order`  (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `mid` int(11) NULL DEFAULT NULL COMMENT '【必传】商户ID',
  `payid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '【必传】商户订单号，可以是时间戳，不可重复',
  `type` int(11) NOT NULL DEFAULT 1 COMMENT '【必传】微信支付1 ',
  `price` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '【必传】订单金额',
  `sign` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '【必传】签名，计算方式为 md5(userid+payId+param+type+price+通讯密钥)',
  `param` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '【可选】传输参数，将会原样返回到异步和同步通知接口',
  `ishtml` int(11) NULL DEFAULT NULL COMMENT '【可选】传入1则自动跳转到支付页面，不传或“0”返回创建结果的json数据',
  `notifyurl` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '【可选】传入则设置该订单的异步通知接口为该参数，不传或传空则使用后台设置的接口',
  `returnurl` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '【可选】传入则设置该订单的同步跳转接口为该参数，不传或传空则使用后台设置的接口',
  `orderid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '服务器订单号',
  `reallyprice` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '实际需付金额',
  `state` int(11) NOT NULL DEFAULT 0 COMMENT '订单状态：-1|订单过期 0|等待支付 1|完成 2|支付完成但通知失败',
  `createdate` bigint(20) NULL DEFAULT NULL COMMENT '订单创建时间时间戳（13位）',
  `overdate` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '订单处理时间',
  `isrecharge` int(11) NOT NULL DEFAULT 0 COMMENT '是否是余额充值(0不是,1是)',
  `order_time_out` int(11) NULL DEFAULT NULL COMMENT '订单有效时间(分钟)',
  `service_charge` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '手续费',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT =1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for userinfo
-- ----------------------------
DROP TABLE IF EXISTS `userinfo`;
CREATE TABLE `userinfo`  (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'id',
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '用户名',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '密码',
  `ukey` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '通讯秘钥',
  `pname` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '真实姓名',
  `qq` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'QQ',
  `phonenumber` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '电话号码',
  `consumption` float NOT NULL DEFAULT 0 COMMENT '消费金额',
  `usession` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'session',
  `sessiontime` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'session设置时间(时间戳)',
  `isok` int(11) NOT NULL DEFAULT 0 COMMENT '账号状态(-1封禁,0正常,-2手续费不足)',
  `logondate` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '注册时间(时间戳)',
  `invitation_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '我的邀请码',
  `invitation_code_up` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '上级邀请码',
  `money` float(11, 2) NOT NULL DEFAULT 1.00 COMMENT '余额',
  `vip` int(11) NOT NULL DEFAULT 0 COMMENT '商户等级',
  `rate` int(11) NOT NULL DEFAULT 0 COMMENT '费率(5-商户等级)',
  `notifyurl` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '异步通知接口',
  `returnurl` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '同步跳转接口',
  `reallyprice_type` int(11) NOT NULL DEFAULT 1 COMMENT '实际金额变化方法(0为递减,1为递增)',
  `order_time_out` int(11) NOT NULL DEFAULT 5 COMMENT '订单有效时间（分钟）',
  `appheart` bigint(20) NULL DEFAULT NULL COMMENT '最后一次心跳时间戳(13位)',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

SET FOREIGN_KEY_CHECKS = 1;
