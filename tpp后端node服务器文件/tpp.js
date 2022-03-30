const request = require('request');
	const http = require('http');
	const qs = require('querystring');
	const mysql = require('mysql');
	const md5 = require('md5-node');
	const decodeImage = require('jimp');
	const qrcodeReader = require('qrcode-reader');
	const fs = require('fs');
	const url = require('url');
	const mainParms = {
		session_time_out: 60, //session有效期(分钟)
		host: "122.112.254.40", //您的主机域名
		id: 1, //您的id
		payurl: "wxp://f2f0CYCNxDDXkQOo9XHfOF9HiWiEyajgwsttCCYxjJRdZ_U", //您的收款二维码
		order_time_out: 5 //订单有效期
	};
	var connection = mysql.createConnection({
		host: 'localhost',
		user: 'root',
		password: '740113',
		port: '3306',
		database: 'tpp'
	});
	connection.connect();
	//---------格式化时间的工具
	Date.prototype.format = function(fmt) {
		var o = {
			"M+": this.getMonth() + 1,
			//月份 
			"d+": this.getDate(),
			//日 
			"h+": this.getHours(),
			//小时 
			"m+": this.getMinutes(),
			//分 
			"s+": this.getSeconds(),
			//秒 
			"q+": Math.floor((this.getMonth() + 3) / 3),
			//季度 
			"S": this.getMilliseconds() //毫秒 
		};
		if (/(y+)/.test(fmt)) {
			fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
		}
		for (var k in o) {
			if (new RegExp("(" + k + ")").test(fmt)) {
				fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k])
					.length)));
			}
		}
		return fmt;
	}
	var nowtime = new Date().format("yyyy-MM-dd hh:mm:ss"); //获取当前时间yyyy-MM-dd hh:mm:ss




	//-----------获取cookie的工具
	function getcookie(req, name) {
		if (req.headers.cookie) {
			let cookiestr = req.headers.cookie;
			let cookiearr1 = cookiestr.split(";");
			for (let v of cookiearr1) {
				let arr = v.split("=");
				let arr0 = arr[0];
				if (arr0.trim() == name.trim()) {
					if (arr.length > 2) {
						let str = arr[1];
						for (let b = 2; b < arr.length; b++) {
							str = str + "=" + arr[b];
						}
						return str;
					} else {
						return arr[1];
					}
				}
			}
		}
		return null;
	}





	//查询session
	//session:需要查询的
	//allinfo:需要的其他数据
	//func1:session存在时执行的函数
	//func2:session不存在时执行的函数
	//errfunc:数据库操作出错时执行的函数
	function select_session(mainRes, allinfo, session, func1, func2, errfunc) {
		let Sql = "SELECT * FROM userinfo WHERE usession = '" + session + "'";
		connection.query(Sql, function(err, result) {
			if (err) {
				errfunc(mainRes, allinfo, err);
				return;
			}

			if (!(result.length === 0)) { //session存在
				func1(mainRes, allinfo, result);

			} else {
				func2(mainRes, allinfo);
			}

		});
	}
	//创建创世上级
	function csh() { //数据库初始化(首次使用本系统时执行，只需执行一次)
		let username = "yonggo" //你的用户名
		let password = "s632716" //你的密码
		let nt = new Date();
		let nowtime = nt.getTime();
		let invitation_code = md5(nowtime); //我的邀请码md5加密方法md5(nowtime)
		let key = md5(username + password + invitation_code); //通讯秘钥MD5加密方法md5(username+password+Invitation_code)(注册时)
		let session = md5(username + password + nowtime); //计算session
		let Sql =
			"INSERT INTO userinfo(username,password,ukey,invitation_code,invitation_code_up,usession,sessiontime,logondate) VALUES('" +
			username + "','" + password + "','" + key + "','" + invitation_code + "','" + invitation_code + "','" +
			session + "','" + nowtime + "','" + nowtime + "')";
		console.log(Sql);
		connection.query(Sql, function(err, result) {
			if (err) {
				console.error(err.message);
				return;
			}
			console.log("初始化成功");
		});
	}

	function isoverdue(mainRes, allinfo, time, func1, func2) {
		let ntime = new Date();
		let seconds = ((parseInt(time) / 1000 + mainParms.session_time_out * 60) * 1000 - ntime.getTime()) / 1000;
		if (seconds <= 0) { //已过期
			func1(mainRes, allinfo);
		} else {
			func2(mainRes, allinfo);
		}

	}


	//登录方法
	function login(mainRes, allinfo) {
		if (allinfo.login_type == "1") { //判断登录的方式，单纯使用session登录还是使用用户名密码登录(1为前者，2为后者)
			select_session(mainRes, allinfo, allinfo.session, function(mainRes, allinfo, result) { //查询session
				isoverdue(mainRes, allinfo, result[0].sessiontime, function(mainRes, allinfo) {
					mainRes.end(JSON.stringify({
						code: -4,
						msg: "身份已过期,需要重新登录"
					}));
				}, function(mainRes, allinfo) {
					mainRes.end(JSON.stringify({
						code: 1,
						msg: "身份有效"
					}));
				})
			}, function(mainRes, allinfo) {
				mainRes.end(JSON.stringify({
					code: -1,
					msg: "身份无效"
				}));
			}, sqlerror);
		} else if (allinfo.login_type == "2") { //使用用户名密码登录

			let Sql = "SELECT * FROM userinfo WHERE username = '" + allinfo.username + "'";
			connection.query(Sql, function(err, result) {
				if (err) {
					console.error(err.message);
					return;
				}
				if (!(result.length === 0)) { //用户存在
					if (result[0].password == allinfo.password) { //密码正确
						//session的md5加密方法(username+password+nowtime)
						let nt = new Date();
						let nowtime = nt.getTime();
						let session = md5(allinfo.username + allinfo.password + nowtime); //计算session
						//更新session
						let Sql = "UPDATE `userinfo` SET `usession` = '" + session + "' , `sessiontime` = '" +
							nowtime + "' WHERE id = '" + result[0].id + "'";
						connection.query(Sql, function(err, result) {
							if (err) {
								console.error(err.message);
								return;
							}
							mainRes.end(JSON.stringify({
								code: 1,
								msg: "登录成功",
								session: session,
								sessiontime: nowtime
							}));
						});

					} else {
						mainRes.end(JSON.stringify({
							code: -5,
							msg: "登录失败:密码错误"
						}));
					}

				} else {
					mainRes.end(JSON.stringify({
						code: -6,
						msg: "登录失败:用户不存在"
					}));
				}
			});
		} else {
			mainRes.end(JSON.stringify({
				code: -3,
				msg: "登录失败:无效的登录方式"
			}));
		}
	}

	//注册方法
	function logon(mainRes, allinfo) {

		let Sql = "SELECT * FROM userinfo WHERE invitation_code = '" + allinfo.invitation_code_up + "'";
		connection.query(Sql, function(err, result1) {
			if (err) {
				console.error(err.message);
				return;
			}
			if (!(result1.length === 0)) { //上级用户存在

				let Sql = "SELECT * FROM userinfo WHERE username = '" + allinfo.username + "'";
				connection.query(Sql, function(err, result2) {
					if (err) {
						console.error(err.message);
						return;
					}
					if (result2.length === 0) { //用户不存在
						let nt = new Date();
						let nowtime = nt.getTime();
						let invitation_code = md5(allinfo.invitation_code_up +
						nowtime); //我的邀请码md5加密方法md5(invitation_code_up+nowtime)
						let key = md5(allinfo.username + allinfo.password +
						invitation_code); //通讯秘钥MD5加密方法md5(username+password+Invitation_code)(注册时)
						let session = md5(allinfo.username + allinfo.password + nowtime); //计算session
						let Sql =
							"INSERT INTO userinfo(username,password,ukey,invitation_code,invitation_code_up,usession,sessiontime,logondate,rate) VALUES(?,?,?,?,?,?,?,?,?)";
						let addSqlParams = [allinfo.username, allinfo.password, key, invitation_code,
							allinfo.invitation_code_up, session, nowtime, nowtime, 5
						];
						connection.query(Sql, addSqlParams, function(err, result) {
							if (err) {
								console.error(err.message);
								return;
							}
							mainRes.end(JSON.stringify({
								code: 1,
								msg: "注册成功",
								session: session,
								sessiontime: nowtime,
								key: key,
								invitation_code: invitation_code
							}));

						});

					} else {
						mainRes.end(JSON.stringify({
							code: -2,
							msg: "注册失败:用户名已存在"
						}));
					}
				});

			} else { //上级用户不存在(不允许注册)
				mainRes.end(JSON.stringify({
					code: -3,
					msg: "注册失败:上级用户不存在(请确认是否输入了有效的邀请码)"
				}));
			}
		});


	}


	//数据库操作报错时的处理方法
	function sqlerror(mainRes, allinfo, err) {
		if (mainRes) {
			mainRes.end(JSON.stringify({
				code: -100,
				msg: "服务器出错"
			}))
		}
		console.log(err.message);
	}

	//查询订单
	//mainRes
	//allinfo
	//session:商户session(必要)
	//type:查询的类型(1总订单,2成功的订单,3过期的或失败的订单,4待支付订单,5仅查询数量(前面1,2,3,4的数量均返回))(必要)
	//func1:查询成功后回调方法(必要)
	//errfunc
	function select_order(mainRes, allinfo, session, type, func1, errfunc) {
		//SELECT * FROM table WHERE c = '0'
		//UPDATE `table` SET `c` = 0 WHERE d =0
		//INSERT INTO table(c) VALUES(?)

		//首先查询session是否有效
		select_session(mainRes, allinfo, session, function(mainRes, allinfo, result) {


			if (type == 1 || type == 2 || type == 3 || type == 4 || type == 5) {


				if (type == 5) {
					var orderinfo = {
						allnum: 0,
						state_1: 0,
						state0: 0,
						state1: 0,
						state2: 0,
						money: {
							state0: 0,
							state1: 0
						}
					};
					let Sql = "";
					if (result[0].id == mainParms.id) {
						Sql = "SELECT COUNT(*) as num,SUM(reallyPrice) as money FROM `order` WHERE mid=" + result[
							0].id + " OR isrecharge=1";
					} else {
						Sql = "SELECT COUNT(*) as num,SUM(reallyPrice) as money FROM `order` WHERE mid=" + result[
							0].id + " AND isrecharge=0";
					}
					connection.query(Sql, function(err, res) {
						if (err) {
							errfunc(mainRes, allinfo, err);
							return;
						}
						orderinfo.allnum = res[0].num;
						if (result[0].id == mainParms.id) {
							Sql =
								"SELECT COUNT(*) as num,SUM(reallyPrice) as money FROM `order` WHERE state = -1 AND (isrecharge=1 OR mid=" +
								result[0].id + ")";
						} else {
							Sql =
								"SELECT COUNT(*) as num,SUM(reallyPrice) as money FROM `order` WHERE state = -1 AND isrecharge=0 AND mid=" +
								result[0].id;
						}
						connection.query(Sql, function(err, res) {
							if (err) {
								errfunc(mainRes, allinfo, err);
								return;
							}
							orderinfo.state_1 = res[0].num;
							if (result[0].id == mainParms.id) {
								Sql =
									"SELECT COUNT(*) as num,SUM(reallyPrice) as money FROM `order` WHERE state = 0 AND (isrecharge=1 OR mid=" +
									result[0].id + ")";
							} else {
								Sql =
									"SELECT COUNT(*) as num,SUM(reallyPrice) as money FROM `order` WHERE state = 0 AND isrecharge=0 AND mid=" +
									result[0].id;
							}
							connection.query(Sql, function(err, res) {
								if (err) {
									errfunc(mainRes, allinfo, err);
									return;
								}
								orderinfo.state0 = res[0].num;
								orderinfo.money.state0 = res[0].money;
								if (result[0].id == mainParms.id) {
									Sql =
										"SELECT COUNT(*) as num,SUM(reallyPrice) as money FROM `order` WHERE (state = 1 OR state = 2) AND (isrecharge=1 OR mid=" +
										result[0].id + ")";
								} else {
									Sql =
										"SELECT COUNT(*) as num,SUM(reallyPrice) as money FROM `order` WHERE (state = 1 OR state = 2) AND isrecharge=0 AND mid=" +
										result[0].id;
								}
								connection.query(Sql, function(err, res) {
									if (err) {
										errfunc(mainRes, allinfo, err);
										return;
									}
									orderinfo.state1 = res[0].num;
									orderinfo.money.state1 = res[0].money;
									if (result[0].id == mainParms.id) {
										Sql =
											"SELECT COUNT(*) as num,SUM(reallyPrice) as money FROM `order` WHERE state = 2 AND (isrecharge=1 OR mid=" +
											result[0].id + ")";
									} else {
										Sql =
											"SELECT COUNT(*) as num,SUM(reallyPrice) as money FROM `order` WHERE state = 2 AND isrecharge=0 AND mid=" +
											result[0].id;
									}
									connection.query(Sql, function(err, res) {
										if (err) {
											errfunc(mainRes, allinfo, err);
											return;
										}
										orderinfo.state2 = res[0].num;
									});
									func1(mainRes, allinfo, orderinfo, null);
								});
							});
						});
					});

				} else {
					let Sql = "";
					if (type == 1) {
						if (result[0].id == mainParms.id) {
							Sql = "SELECT * FROM `order`  WHERE  mid=" + result[0].id + " OR isrecharge=1";
						} else {
							Sql = "SELECT * FROM `order`  WHERE  mid=" + result[0].id + " AND isrecharge=0";
						}
					}
					if (type == 2) {
						if (result[0].id == mainParms.id) {
							Sql =
								"SELECT * FROM `order`  WHERE (state = 1 OR state = 2) AND (isrecharge=1 OR mid=" +
								result[0].id + ")";
						} else {
							Sql =
								"SELECT * FROM `order`  WHERE (state = 1 OR state = 2) AND isrecharge=0 AND mid=" +
								result[0].id;
						}
					}
					if (type == 3) {
						if (result[0].id == mainParms.id) {
							Sql = "SELECT * FROM `order`  WHERE state = -1 AND (isrecharge=1 OR mid=" + result[0]
								.id + ")";
						} else {
							Sql = "SELECT * FROM `order`  WHERE state = -1 AND isrecharge=0 AND mid=" + result[0]
								.id;
						}
					}
					if (type == 4) {
						if (result[0].id == mainParms.id) {
							Sql = "SELECT * FROM `order`  WHERE state = 0 AND (isrecharge=1 OR mid=" + result[0]
								.id + ")";
						} else {
							Sql = "SELECT * FROM `order`  WHERE state = -1 AND isrecharge=0 AND mid=" + result[0]
								.id;
						}
					}
					connection.query(Sql, function(err, res) {
						if (err) {
							errfunc(mainRes, allinfo, err);
							return;
						}
						func1(mainRes, allinfo, null, res);
					});
				}
			}




		}, function(mainRes, allinfo) {
			mainRes.end(JSON.stringify({
				code: -2,
				msg: "身份已过期,需要重新登录"
			}));
		}, errfunc);

	}
	//清理过期订单
	//userid:商户id|session
	//type:1标记过期,2删除过期订单,3标记充值余额的过期订单,4删除充值余额的过期订单
	//func1:处理成功后回调方法
	//func1:商户不存在或session无效回调方法
	function clearorder(mainRes, allinfo, userid, type, func1, func2) {
		let Sql = "";
		if (type == 1) {
			Sql = "SELECT * FROM `userinfo` WHERE id=" + userid;
		} else if (type == 2) {
			Sql = "SELECT * FROM `userinfo` WHERE usession='" + userid + "'";
		} else if (type == 3 || type == 4) {
			Sql = "SELECT * FROM `userinfo` WHERE id=" + mainParms.id;
		}
		let ntime = new Date;
		let nowtime = ntime.getTime();
		connection.query(Sql, function(err, result) {
			if (err) {
				sqlerror(mainRes, allinfo, err);
				return;
			}
			if (!(result.length === 0)) {
				let ordertimeout = result[0].order_time_out;
				let ntime = new Date;
				let Sql = "";
				if (type == 1) {
					Sql = "SELECT * FROM `order` WHERE (createdate/1000+" + ordertimeout + "*60<" + ntime
					.getTime() + "/1000) AND state=0 AND mid =" + result[0].id; //过期的订单
				} else if (type == 2) {
					Sql = "SELECT * FROM `order` WHERE (createdate/1000+" + ordertimeout + "*60<" + ntime
					.getTime() + "/1000) AND state=-1 AND mid =" + result[0].id; //过期的订单
				} else if (type == 3) {
					Sql = "SELECT * FROM `order` WHERE (createdate/1000+" + ordertimeout + "*60<" + ntime
					.getTime() + "/1000) AND state=0 AND isrecharge = 1"; //过期的订单
				} else if (type == 4) {
					Sql = "SELECT * FROM `order` WHERE (createdate/1000+" + ordertimeout + "*60<" + ntime
					.getTime() + "/1000) AND state=-1 AND isrecharge = 1"; //过期的订单
				} else {

					func1(mainRes, allinfo, result);
					return;
				}

				connection.query(Sql, function(err, result1) {
					if (err) {
						errfunc(mainRes, allinfo, err);
						return;
					}
					if (!(result1.length === 0)) {
						var Sql = "";
						var k = 0;
						for (let o of result1) {

							if (type == 1 || type == 3) {
								Sql = "UPDATE `order` SET `state` = -1 WHERE id =" + o.id; //标记过期
							} else if (type == 2 || type == 4) {
								Sql = "DELETE FROM `order` WHERE `id` = " + o.id; //删除过期
							} else {
								func1(mainRes, allinfo, result);
								return;
							}
							connection.query(Sql, function(err, result2) {
								if (err) {
									return;
								}
								if (k + 1 == result1.length) {
									func1(mainRes, allinfo, result);
								}
								k++;
							});

						}
					} else {
						func1(mainRes, allinfo, result);
					}
				});

			} else {
				func2(mainRes, allinfo, result);
			}
		});
	}




	function createOrder(mainRes, allinfo, errfunc) {

		clearorder(mainRes, allinfo, allinfo.mid, 1, function(mainRes, allinfo, result1) {
			//计算商户sign是否真实md5(mid+payid+param+price+通讯密钥)
			let sign_ = md5(allinfo.mid + allinfo.payid + allinfo.param + allinfo.price + result1[0].ukey);
			if (sign_ != allinfo.sign) {
				mainRes.end(JSON.stringify({
					code: -5,
					msg: "sign不合法"
				}));
				return;
			}
			let Sql = "SELECT * FROM `collection_code` WHERE mid = " + allinfo.mid + " AND isok = 1";
			connection.query(Sql, function(err, result0) {
				if (err) {
					errfunc(mainRes, allinfo, err);
					return;
				}
				if (!(result0.length === 0)) { //如果已上传收款码

					var reallyprice_type = result1[0].reallyprice_type;
					if (!(allinfo.notifyurl)) { //allinfo如果没有notifyurl
						if (result1[0].notifyurl) {
							allinfo.notifyurl = result1[0].notifyurl;
						} else {
							mainRes.end(JSON.stringify({
								code: -1,
								msg: "未设置异步通知接口,请先设置您的异步通知接口"
							}));
							return;
						}
					}
					if (!(allinfo.returnurl)) { //allinfo如果没有returnurl
						if (result1[0].returnurl) {
							allinfo.returnurl = result1[0].returnurl;
						} else {
							mainRes.end(JSON.stringify({
								code: -1,
								msg: "未设置同步跳转接口,请先设置您的同步跳转接口"
							}));
							return;
						}
					}
					let Sql = "SELECT * FROM `order` WHERE state = 0 AND payid = '" + allinfo.payid + "'";
					connection.query(Sql, function(err, result2) {
						if (err) {
							errfunc(mainRes, allinfo, err);
							return;
						}
						if (result2.length === 0) { //商户订单不存在，创建新订单
							let Sql = "";

							let ntime = new Date();

							if (reallyprice_type == 0) { //实际金额递减
								Sql = "SELECT * FROM `order` WHERE (createdate/1000+" + result1[0]
									.order_time_out + "*60>" + ntime.getTime() +
									"/1000) AND price = " + allinfo.price +
									"  order by reallyprice asc"; //根据实际支付金额升序获取数据
							} else { //实际金额递增
								Sql = "SELECT * FROM `order` WHERE (createdate/1000+" + result1[0]
									.order_time_out + "*60>" + ntime.getTime() +
									"/1000) AND price = " + allinfo.price +
									" order by reallyprice desc"; //根据实际支付金额倒序获取数据
							}
							connection.query(Sql, function(err, result3) {
								if (err) {
									errfunc(mainRes, allinfo, err);
									return;
								}


								let ntime = new Date();
								var mid = allinfo.mid;
								var payid = allinfo.payid;
								var orderid = new Date().format("yyyyMMddhhmmss");
								var type = 1; //暂时只支持微信
								var price = parseFloat(allinfo.price);
								var sign = allinfo.sign;
								var param = allinfo.param;
								var ishtml = allinfo.ishtml;
								var notifyurl = allinfo.notifyurl;
								var returnurl = allinfo.returnurl;
								var reallyprice = 0;
								var createdate = ntime.getTime();
								if (!(result3.length === 0)) { //有其他待支付订单
									if (reallyprice_type == 0) { //实际金额递减
										reallyprice = parseFloat(result3[0].reallyprice) -
											0.01;
									} else { //实际金额递增
										reallyprice = parseFloat(result3[0].reallyprice) +
											0.01;
									}
								} else {
									reallyprice = price;
								}
								let Sql =
									"INSERT INTO `order`(mid,payid,orderid,type,price,sign,param,ishtml,notifyurl,returnurl,reallyprice,createdate,order_time_out) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)";
								let addSqlParams = [mid, payid, orderid, type, price, sign,
									param, ishtml, notifyurl, returnurl, reallyprice
									.toFixed(2), createdate, result1[0].order_time_out
								];
								connection.query(Sql, addSqlParams, function(err,
								result4) {
									if (err) {
										errfunc(mainRes, allinfo, err);
										return;
									}
									mainRes.end(JSON.stringify({
										code: 1,
										msg: "成功",
										data: {
											mid: mid,
											payid: payid,
											orderid: orderid,
											paytype: type,
											price: price,
											reallyprice: reallyprice
												.toFixed(2),
											payurl: result0[0].payurl,
											order_time_out: result1[0]
												.order_time_out,
											date: createdate,
										}
									}));

								});

							});
						} else {
							let ntime = new Date();
							let seconds = ((parseInt(result2[0].createdate / 1000) + mainParms
								.session_time_out * 60) * 1000 - ntime.getTime()) / 1000;
							if (seconds <= 0) { //已过期


								let Sql = "UPDATE `order` SET `state` = -1 WHERE id =" + result2[0]
									.id;
								connection.query(Sql, function(err, result) {
									if (err) {
										console.error(err.message);
										return;
									}
									mainRes.end(JSON.stringify({
										code: -2,
										msg: "商户订单已存在,并且已过期"
									}));

								});
							} else {
								mainRes.end(JSON.stringify({
									code: -2,
									msg: "商户订单已存在,但未过期"
								}));
							}

						}

					});


				} else {
					mainRes.end(JSON.stringify({
						code: -4,
						msg: "商户还未配置收款码"
					}));
				}
			});
		}, function(mainRes, allinfo) {
			mainRes.end(JSON.stringify({
				code: -3,
				msg: "商户不存在"
			}));
		});


	}

	function checkOrder(mainRes, orderid) {

		Sql = "SELECT * FROM `order` WHERE orderid = '" + orderid + "'";
		connection.query(Sql, function(err, result) {
			if (err) {
				sqlerror(mainRes, null, err);
				return;
			}
			if (!(result.length === 0)) { //订单存在
				let ntime = new Date();
				let seconds = ((parseInt(result[0].createdate / 1000) + mainParms.session_time_out * 60) * 1000 -
					ntime.getTime()) / 1000;
				if (seconds <= 0) { //已过期

					let Sql = "UPDATE `order` SET `state` = -1 WHERE id =" + result[0].id;
					connection.query(Sql, function(err, result) {
						if (err) {
							console.error(err.message);
							return;
						}
					});
					mainRes.end(JSON.stringify({
						code: -3,
						msg: "订单已过期",
						data: null
					}));
					return;
				}
				if (result[0].state == 1 || result[0].state == 2) { //已支付
					let data = "";
					if (result[0].isrecharge == 0 && result[0].ishtml == 1) {
						data = "http://" + result[0].returnurl + "/?payid=" + result[0].payid + "&param=" + result[
								0].param + "&price=" + result[0].price + "&reallyPrice=" + result[0].reallyprice +
							"&sign=" + result[0].sign; //如果以后增加其他收款方式这里需要修改type
					}
					mainRes.end(JSON.stringify({
						code: 1,
						msg: "成功",
						data: data
					}));
				} else {
					mainRes.end(JSON.stringify({
						code: -1,
						msg: "支付失败或还未支付",
						data: null
					}));
				}

			} else {
				mainRes.end(JSON.stringify({
					code: -2,
					msg: "订单不存在",
					data: null
				}));
			}

		});

	}
	//用户扣取手续费
	//result:订单数据
	//func1扣费成功后回调
	//func1扣费失败后回调
	function consumption(mainRes, result, func1, func2) { //这里的result是订单信息
		let Sql = "SELECT * FROM `userinfo` WHERE  id = " + result[0].mid;
		connection.query(Sql, function(err, result0) { //这里的result0是用户信息
			if (err) {
				sqlerror(mainRes, null, err);
				return;
			}
			let rate = result0[0].rate;
			let price = result[0].price;
			let money = result0[0].money;
			let service_charge = rate * price / 100;
			if (money != 0 && money > rate * price / 100) { //手续费充足
				money = money - rate * price / 100;
				let Sql = "UPDATE `userinfo` SET `money` = " + money + " WHERE id =" + result[0].mid;
				connection.query(Sql, function(err, result2) {
					if (err) {
						sqlerror(mainRes, null, err);
						return;
					}
					let Sql = "UPDATE `order` SET `service_charge` = " + service_charge + " WHERE id =" +
						result[0].id;
					connection.query(Sql, function(err, result3) {
						if (err) {
							sqlerror(mainRes, null, err);
							return;
						}

						func1(mainRes, result);

					});

				});

			} else { //手续费不足
				func2(mainRes, result0, result);
			}
		});

	}

	//订单补单异步通知(补单)
	function order_notify(mainRes, session, orderid) {
		select_session(mainRes, null, session, function(mainRes, allinfo, result) {
			let Sql = "SELECT * FROM `order` WHERE  id = " + orderid;
			connection.query(Sql, function(err, result1) {
				if (err) {
					sqlerror(mainRes, null, err);
					return;
				}
				if (!(result1.length === 0)) { //订单存在
					if (result1[0].isrecharge == 1) {

						let Sql = "UPDATE `order` SET `state` = 1 WHERE id =" + result1[0].id;
						connection.query(Sql, function(err, r) {
							if (err) {
								sqlerror(mainRes, null, err);
								return;
							}

							let Sql = "SELECT * FROM `userinfo` WHERE id =" + result1[0].mid;
							connection.query(Sql, function(err, result3) {
								if (err) {
									sqlerror(mainRes, null, err);
									return;
								}
								if (!(result3.length === 0)) {
									let money = parseFloat(result3[0].money) + parseFloat(
										result1[0].price);
									let Sql =
										"UPDATE `userinfo` SET`isok` = 0, `money` = " +
										money + " WHERE id =" + result1[0].mid;
									connection.query(Sql, function(err, result2) {
										if (err) {
											sqlerror(mainRes, null, err);
											return;
										}

										mainRes.end(JSON.stringify({
											code: 1,
											msg: "余额充值补单成功"
										}));
									});
								}


							});
						});
						return;
					}


					request({
						url: "http://" + result1[0].notifyurl + "/callback?" + qs.stringify({
							mid: result[0].id,
							payid: result1[0].payid,
							param: result1[0].param,
							price: result1[0].price,
							reallyprice: parseFloat(result1[0].reallyprice),
							sign: md5(result[0].id + result1[0].payid + result1[0].param +
									result1[0].price + parseFloat(result1[0].reallyprice) +
									result[0].ukey
									) // 	校验签名，计算方式 = md5(mid+payid + param  + price + reallyprice + 通讯密钥)
						}),
						method: "GET",
						headers: {
							'Accept': 'application/json, text/javascript, */*; q=0.01',
							"content-type": "application/json",
						}
					}, function(error, response, body) {
						if (!error && response.statusCode == 200) {
							body = JSON.parse(body);
							if (body.code == 1) { //code 	整数 	返回代码（1：成功，-1：调用失败）
								let Sql = "UPDATE `order` SET `state` = 1 WHERE id =" + result1[0]
									.id;
								connection.query(Sql, function(err, result2) {
									if (err) {
										sqlerror(mainRes, null, err);
										return;
									}
								});
								mainRes.end(JSON.stringify({
									code: 1,
									msg: "异步通知成功"
								}));
								return;
							} else { //异步通知失败
								mainRes.end(JSON.stringify({
									code: -2,
									msg: "异步通知失败"
								}));
							}
						} else { //异步通知失败
							mainRes.end(JSON.stringify({
								code: -2,
								msg: "异步通知失败"
							}));
						}

					});


				} else {
					mainRes.end(JSON.stringify({
						code: -3,
						msg: "订单不存在"
					}));
				}

			});




		}, function(mainRes, allinfo) {
			mainRes.end(JSON.stringify({
				code: -4,
				msg: "身份无效"
			}));
		}, sqlerror);
	}

	//type:1为pc端，2为app端
	function PcPush2(mainRes, info, wtype) {

		let Sql = "";

		var mid = 0;
		if (wtype == 1) {
			Sql = "SELECT * FROM `userinfo` WHERE  id = " + info.user_id;
			mid = info.user_id;
		} else if (wtype == 2) {
			Sql = "SELECT * FROM `userinfo` WHERE  id = " + info.id;
			mid = info.id;
		} else {
			mainRes.end(JSON.stringify({
				code: -3,
				msg: "参数有误"
			}));
			return;
		}
		connection.query(Sql, function(err, result0) {
			if (err) {
				sqlerror(mainRes, null, err);
				return;
			}
			if (!(result0.length === 0)) { //用户存在
				//校验sign
				//md5(type+price+time+key)电脑端收款回调
				let type = 1;
				var price = info.price;
				let time = wtype == 1 ? info.time : info.t;
				var key = result0[0].ukey;
				let sign_ = md5(type + price + time + key);

				if (sign_ != info.sign) {
					mainRes.end(JSON.stringify({
						code: -1,
						msg: "sign校验不通过"
					}));
					return;
				}

				let Sql = "SELECT * FROM `order` WHERE reallyprice=" + parseFloat(info.price) + " AND state = 0 ";
				connection.query(Sql, function(err, result1) {
					if (err) {
						mainRes.end(JSON.stringify({
							code: -100,
							msg: "服务器错误"
						}));
						return;
					}
					if (!(result1.length === 0)) { //订单存在
						if (result1[0].isrecharge == 0) { //不是余额充值，而是商户订单



							consumption(mainRes, result1, function(mainRes, result1) {
								request({
									url: "http://" + result1[0].notifyurl + "/callback?" +
										qs.stringify({
											mid: mid,
											payid: result1[0].payid,
											param: result1[0].param,
											price: result1[0].price,
											reallyprice: parseFloat(info.price),
											sign: md5(mid + result1[0].payid + result1[
														0].param + result1[0].price +
													parseFloat(info.price) + key
													) // 	校验签名，计算方式 = md5(mid+payid + param  + price + reallyprice + 通讯密钥)
										}),
									method: "GET",
									headers: {
										'Accept': 'application/json, text/javascript, */*; q=0.01',
										"content-type": "application/json",
									}
								}, function(error, response, body) {
									if (!error && response.statusCode == 200) {
										let Sql =
											"UPDATE `order` SET `state` = 1 WHERE id =" +
											result1[0].id;
										connection.query(Sql, function(err, result2) {
											if (err) {
												sqlerror(mainRes, null, err);
												return;
											}
										});
										mainRes.end(JSON.stringify({
											code: 1,
											msg: "交易成功并且异步通知成功"
										}));
										return;
									} else { //异步通知失败
										mainRes.end(JSON.stringify({
											code: -2,
											msg: "异步通知失败"
										}));
									}
									let Sql = "UPDATE `order` SET `state` = 2 WHERE id =" +
										result1[0].id;
									connection.query(Sql, function(err, result2) {
										if (err) {
											sqlerror(mainRes, null, err);
											return;
										}
									});

								});
							}, function(mainRes, result, result1) { //result是用户信息，result1是订单信息
								let Sql = "UPDATE `order` SET `state` = 2 WHERE id =" + result1[0]
									.id;
								connection.query(Sql, function(err, result2) {
									if (err) {
										sqlerror(mainRes, null, err);
										return;
									}
									let Sql =
										"UPDATE `userinfo` SET `isok` = -2 WHERE id =" +
										result[0].id;
									connection.query(Sql, function(err, result2) {
										if (err) {
											sqlerror(mainRes, null, err);
											return;
										}
										mainRes.end(JSON.stringify({
											code: -5,
											msg: "手续费不足"
										}));
									});
								});
							});
						} else { //余额充值

							let Sql = "UPDATE `order` SET `state` = 1 WHERE id =" + result1[0].id;
							connection.query(Sql, function(err, result2) {
								if (err) {
									sqlerror(mainRes, null, err);
									return;
								}

								let Sql = "SELECT * FROM `userinfo` WHERE id =" + result1[0].mid;
								connection.query(Sql, function(err, result3) {
									if (err) {
										sqlerror(mainRes, null, err);
										return;
									}
									if (!(result3.length === 0)) {
										let money = parseFloat(result3[0].money) +
											parseFloat(result1[0].price);
										let Sql = "UPDATE `userinfo` SET `money` = " +
											money + " WHERE id =" + result1[0].mid;
										connection.query(Sql, function(err, result2) {
											if (err) {
												sqlerror(mainRes, null, err);
												return;
											}
											let Sql =
												"UPDATE `userinfo` SET `isok` = 0 WHERE id =" +
												result1[0].mid;
											connection.query(Sql, function(err,
												result2) {
												if (err) {
													sqlerror(mainRes, null,
														err);
													return;
												}
												mainRes.end(JSON
											.stringify({
													code: 1,
													msg: "交易成功"
												}));

											});


										});
									}


								});

							});

						}
					} else {
						mainRes.end(JSON.stringify({
							code: -3,
							msg: "订单不存在"
						}));
					}

				});


			} else {
				mainRes.end(JSON.stringify({
					code: -4,
					msg: "商户不存在"
				}));

			}

		});


	}



	//用于判断指定对象里是否有空值
	//obj:查询的对象
	//func1:参数没有空值的执行方法
	//func2:参数有空值后执行方法
	function paramtool(mainRes, obj, func1, func2) {
		for (let val of obj) {
			if (!(val)) { //如果是空值
				func2(mainRes, obj);
				return;
			}
		}
		func1(mainRes, obj);
	}

	function update_userinfo_info(mainRes, allinfo) {
		select_session(mainRes, allinfo, allinfo.session, function(mainRes, allinfo, result) {
			//SELECT * FROM `table` WHERE c = '0'
			//UPDATE `table` SET `c` = 0 WHERE d =0
			//INSERT INTO table(c) VALUES(?)
			//let addSqlParams = [c];
			//connection.query(Sql,addSqlParams,function(err, result) {
			if (allinfo.type == 1 || allinfo.type == 2 || allinfo.type == 3) {
				let userinfo = allinfo.userinfo;
				if (allinfo.type == 1) { //修改用户配置信息
					let Sql = "UPDATE `userinfo` SET `pname` = '" + userinfo.pname + "',`qq` = '" + userinfo.qq +
						"',`phonenumber` = '" + userinfo.phonenumber + "',`notifyurl` = '" + userinfo.notifyurl +
						"',`returnurl` = '" + userinfo.returnurl + "',`order_time_out` = '" + userinfo
						.order_time_out + "' WHERE id =" + result[0].id;
					connection.query(Sql, function(err, result) {
						if (err) {
							console.error(err.message);
							return;
						}
						mainRes.end(JSON.stringify({
							code: 1,
							msg: "修改配置信息成功"
						}));
					});
				} else if (allinfo.type == 2) { //修改用户密码
					if (allinfo.password) { //密码不为空
						let Sql = "UPDATE `userinfo` SET `password` = '" + allinfo.password + "' WHERE id =" +
							result[0].id;
						connection.query(Sql, function(err, result) {
							if (err) {
								console.error(err.message);
								return;
							}
							mainRes.end(JSON.stringify({
								code: 1,
								msg: "修改密码成功"
							}));
						});
					} else {
						mainRes.end(JSON.stringify({
							code: -4,
							msg: "新密码不能为空"
						}));
					}

				} else { //重置秘钥
					let username = result[0].username;
					let password = result[0].password;
					let invitation_code = result[0].invitation_code;
					let nt = new Date();
					let nowtime = nt.getTime();
					let key = md5(username + password + invitation_code + nowtime);
					let Sql = "UPDATE `userinfo` SET `ukey` = '" + key + "' WHERE id =" + result[0].id;
					connection.query(Sql, function(err, result) {
						if (err) {
							console.error(err.message);
							return;
						}
						mainRes.end(JSON.stringify({
							code: 1,
							msg: "重置秘钥成功"
						}));
					});

				}

			} else { //无效的请求类型

				mainRes.end(JSON.stringify({
					code: -3,
					msg: "无效的请求类型"
				}));
			}
		}, function(mainRes, allinfo) {
			mainRes.end(JSON.stringify({
				code: -2,
				msg: "身份过期"
			}));
		}, sqlerror);

	}

	function recharge(mainRes, allinfo) {
		select_session(mainRes, allinfo, allinfo.session, function(mainRes, allinfo, result) {
			clearorder(mainRes, allinfo, null, 3, function(mainRes, allinfo, resul) {
				var reallyprice_type = result[0].reallyprice_type; //金额递增或递减
				var reallyprice = 0; //实际金额
				let Sql = "SELECT * FROM `order` WHERE state = 0 AND isrecharge = 1 AND mid = " + result[0]
					.id;
				connection.query(Sql, function(err, result1) {
					if (err) {
						sqlerror(mainRes, allinfo, err);
						return;
					}

					var orderid = new Date().format("yyyyMMddhhmmss");
					//这里商户订单号和云端订单号设置成一样
					let Sql = "";
					if (reallyprice_type == 0) { //实际金额递减
						Sql = "SELECT * FROM `order` WHERE state = 0 AND price = " + allinfo
							.price + " order by reallyprice asc"; //根据实际支付金额升序获取数据
					} else { //实际金额递增
						Sql = "SELECT * FROM `order` WHERE state = 0 AND price = " + allinfo
							.price + " order by reallyprice desc"; //根据实际支付金额倒序获取数据
					}

					connection.query(Sql, function(err, result2) {
						if (err) {
							sqlerror(mainRes, allinfo, err);
							return;
						}
						if (!(result2.length === 0)) { //有相同价格的订单，需要改变实际价格
							if (reallyprice_type == 0) { //实际金额递减
								reallyprice = parseFloat(result2[0].reallyprice) - 0.01;
							} else { //实际金额递增
								reallyprice = parseFloat(result2[0].reallyprice) + 0.01;
							}
						} else { //如果没有，实际价格等于
							reallyprice = allinfo.price;
						}



						if (!(result1.length === 0)) { //已有待支付的充值订单
							var ntime = new Date();
							//一个商户一次只允许存在一个待充值订单
							let seconds = ((parseInt(result1[0].createdate / 1000) +
									mainParms.session_time_out * 60) * 1000 - ntime
								.getTime()) / 1000;
							if (seconds > 0 && allinfo.price == result1[0]
								.price) { //未过期,并且需要充值相同金额就返回该订单信息


								mainRes.end(JSON.stringify({
									"code": 1,
									"msg": "成功",
									"data": {
										"mid": result[0].id,
										"orderid": result1[0].orderid,
										"price": result1[0].price,
										"reallyprice": result1[0].reallyprice,
										"payurl": mainParms.payurl,
										"order_time_out": mainParms
											.order_time_out,
										"date": parseInt(result1[0].createdate)
									}
								}));


							} else { //否则更新订单,并返回该订单信息

								var ntime = new Date();
								let Sql = "UPDATE `order` SET `payid` = '" + orderid +
									"' ,`orderid` = '" + orderid + "', `price` = " +
									parseFloat(allinfo.price) + " ,`reallyprice` = " +
									parseFloat(reallyprice) + " ,`createdate` = '" + ntime
									.getTime() + "' WHERE id =" + result1[0].id;
								connection.query(Sql, function(err, result3) {
									if (err) {
										sqlerror(mainRes, allinfo, err);
										return;
									}
									mainRes.end(JSON.stringify({
										"code": 1,
										"msg": "成功",
										"data": {
											"mid": result[0].id,
											"orderid": orderid,
											"price": allinfo.price,
											"reallyprice": reallyprice,
											"payurl": mainParms.payurl,
											"order_time_out": mainParms
												.order_time_out,
											"date": ntime.getTime()
										}
									}));
								});
							}
						} else { //创建新订单

							var ntime = new Date();
							let Sql =
								"INSERT INTO `order`(mid,payid,price,orderid,reallyprice,createdate,isrecharge,param) VALUES(?,?,?,?,?,?,?,?)";
							let addSqlParams = [result[0].id, orderid, allinfo.price,
								orderid, reallyprice, ntime.getTime(), 1, "余额充值"
							];
							connection.query(Sql, addSqlParams, function(err, result3) {
								if (err) {
									sqlerror(mainRes, allinfo, err);
									return;
								}
								mainRes.end(JSON.stringify({
									"code": 1,
									"msg": "成功",
									"data": {
										"mid": result[0].id,
										"orderid": orderid,
										"price": allinfo.price,
										"reallyprice": reallyprice,
										"payurl": mainParms.payurl,
										"order_time_out": mainParms
											.order_time_out,
										"date": ntime.getTime()
									}
								}));
							});

						}
					});

				});




			}, function(mainRes, allinfo) {
				mainRes.end(JSON.stringify({
					code: -3,
					msg: "用户不存在"
				}));
			});


		}, function(mainRes, allinfo) {
			mainRes.end(JSON.stringify({
				code: -2,
				msg: "身份过期"
			}));
		}, sqlerror);

	}


	function qrdecode(res, allinfo, postData) {

		select_session(res, allinfo, allinfo.session, function(res, allinfo, result) {

			var file = qs.parse(postData, '\r\n', ':')
			let ntime = new Date();
			// 只处理图片文件
			if (file['Content-Type'].indexOf("image") !== -1) {
				//获取文件名
				var fileInfo = file['Content-Disposition'].split('; ');
				for (value in fileInfo) {
					if (fileInfo[value].indexOf("filename=") != -1) {
						fileName = fileInfo[value].substring(10, fileInfo[value].length - 1);

						if (fileName.indexOf('\\') != -1) {
							fileName = fileName.substring(fileName.lastIndexOf('\\') + 1);
						}
					}
				}

				// 获取图片类型(如：image/gif 或 image/png))
				var entireData = postData.toString();

				contentType = file['Content-Type'].substring(1);

				//获取文件二进制数据开始位置，即contentType的结尾
				var upperBoundary = entireData.indexOf(contentType) + contentType.length;
				var shorterData = entireData.substring(upperBoundary);

				// 替换开始位置的空格
				var binaryDataAlmost = shorterData.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

				// 去除数据末尾的额外数据，即: "--"+ boundary + "--"
				var binaryData = binaryDataAlmost.substring(0, binaryDataAlmost.indexOf('--' + allinfo.boundary +
					'--'));

				// 保存文件
				fs.writeFile(ntime.getTime() + fileName, binaryData, 'binary', function(err) {

					decodeImage.read(ntime.getTime() + fileName, function(err, image) {
						if (err) {
							throw new Error(err);
							return;
						}
						var qr = new qrcodeReader();
						qr.callback = function(errorWhenDecodeQR, qrresult) {
							if (errorWhenDecodeQR) {
								console.log(errorWhenDecodeQR);
								res.end(JSON.stringify({
									code: -2,
									msg: "错误"
								}));
								return;
							}
							if (!qrresult) {
								console.log("gone with wind");
							} else {
								fs.unlink(`${__dirname}/` + ntime.getTime() + fileName, (
									err) => {
										if (err) {
											console.log(err);
											res.end(JSON.stringify({
												code: -100,
												msg: "错误"
											}));
											return;
										}

										let Sql =
											"SELECT * FROM `collection_code` WHERE mid =" +
											result[0].id;
										connection.query(Sql, function(err, result1) {
											if (err) {
												console.error(err.message);
												return;
											}

											if (!(result1.length ===
												0)) { //已存在就更新二维码信息
												let Sql =
													"UPDATE `collection_code` SET `payurl` = '" +
													qrresult.result +
													"' WHERE mid = " + result1[0]
													.id;
												connection.query(Sql, function(err,
													result) {
													if (err) {
														console.error(err
															.message);
														return;
													}

													res.end(JSON.stringify({
														code: 1,
														payurl: qrresult
															.result
													}));
												});


											} else { //不存在就新增

												let Sql =
													"INSERT INTO `collection_code`(mid,payurl,add_time) VALUES(?,?,?)";
												let addSqlParams = [result[0].id,
													qrresult.result, ntime
													.getTime()
												];

												connection.query(Sql, addSqlParams,
													function(err, result) {
														if (err) {
															sqlerror(res,
																allinfo,
																err);
															return;
														}

														res.end(JSON.stringify({
															code: 1,
															payurl: qrresult
																.result
														}));
													});
											}


										});

									});
							}
						};
						qr.decode(image.bitmap);

					});
				});
			} else {

				res.end(JSON.stringify({
					code: -1,
					msg: "不是图片，无法处理"
				}));
			}

		}, function(res, allinfo) {
			res.end(JSON.stringify({
				code: -2,
				msg: "session无效"
			}));
		}, sqlerror);
	}



	function appHeart(mainRes, allinfo) {

		let Sql = "SELECT * FROM `userinfo` WHERE id = " + allinfo.id;
		connection.query(Sql, function(err, result) {
			if (err) {
				sqlerror(mainRes, allinfo);
				return;
			}
			if (!(result.length === 0)) {
				let key = result[0].ukey;
				let sign = md5(allinfo.t + key);
				if (allinfo.sign != sign) {
					mainRes.end("身份校验错误，配置信息错误");
				} else {
					let ntime = new Date();

					let Sql = "UPDATE `userinfo` SET `appheart` = '" + ntime.getTime() + "' WHERE id =" + allinfo
						.id;
					connection.query(Sql, function(err, result) {
						if (err) {
							sqlerror(mainRes, allinfo);
							return;
						}

						mainRes.end("与校际通握手成功");
					});
				}

			} else {
				mainRes.end("配置信息错误：用户不存在");
			}


		});

	}



	http.createServer(function(req, res) {
		res.writeHead(200, {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Headers': 'Origin,Token, No-Cache, uniqid, X-Requested-With, If-Modified-Since, Pragma, Last-Modified, Cache-Control, Expires, Content-Type, X-E4M-With',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Credentials': 'true',
			'Content-Type': 'application/json; charset=UTF-8',
			'Access-Control-Expose-Headers': 'uniqid'
		});
		var requset_url = req.url;
		var get_query_obj = ''; //get请求参数对象
		var pathname = url.parse(requset_url).pathname; //请求的路径
		var post_query_obj = ''; //post请求参数对象
		var postData = '';
		var data_type = req.headers['content-type'];





		//127.0.0.1/123/456
		//type 微信1 QQ4 支付宝2
		//域名地址/key/用户编号
		//    /appHeart?id=456&t=1648095335&sign=26ed1e9814c1c99d0037a94a04489f5d
		// 		{
		// 		  id: '456',
		// 		  t: '1648095335',
		// 		  sign: '26ed1e9814c1c99d0037a94a04489f5d'
		// 		}
		// //    md5(t+key)电脑端心跳检测

		//   /appHeart?t=1648097177717&sign=60773b3fdcb5a7d4ab6f71a04917278f&id=456
		// {
		//   t: '1648097177717',
		//   sign: '60773b3fdcb5a7d4ab6f71a04917278f',
		//   id: '456'
		// }
		//		md5(t+key)app端心跳检测

		//    /api/server/PcPush2?user_id=456&time=1648091014&type=1&price=0.01&sign=5b9f7fbdf27c7a4440acc6f93d08e716
		// 		{
		// 		  user_id: '456',
		// 		  time: '1648091014',
		// 		  type: '1',
		// 		  price: '0.01',
		// 		  sign: '5b9f7fbdf27c7a4440acc6f93d08e716'
		// 		}
		// //    md5(type+price+time+key)电脑端收款回调

		//		/appPush?t=1648114731857&type=1&price=0.01&sign=de80e145227e4bacb98264e0bef5b69a&id=456
		// 		{
		// 		  t: '1648114731857',
		// 		  type: '1',
		// 		  price: '0.01',
		// 		  sign: 'de80e145227e4bacb98264e0bef5b69a',
		// 		  id: '456'
		// 		}
		// //	md5(type+price+t+key)app收款回调

		//--------数据库操作


		//SELECT * FROM table WHERE c = '0'
		//UPDATE `table` SET `c` = 0 WHERE d =0
		//INSERT INTO table(c) VALUES(?)
		// let Sql = "";
		// //let addSqlParams = [c];
		// //connection.query(Sql,addSqlParams,function(err, result) {
		// connection.query(Sql,function(err, result) {
		//     if (err) {
		//         console.error(err.message);
		//         return;
		//     }
		// });









		//-------------------------GET请求----------------------------------
		if (req.method == 'GET') {

			get_query_obj = url.parse(requset_url, true).query;
			if (pathname == "/api/server/PcPush2") { //pc收款回调
				if (get_query_obj.user_id && get_query_obj.sign && get_query_obj.type && get_query_obj.time &&
					get_query_obj.price) {

					PcPush2(res, get_query_obj, 1);
				} else {
					res.end(JSON.stringify({
						code: -1,
						msg: "失败:参数不全"
					}));
				}
			}
			if (pathname == "/appPush") { //app收款回调
				if (get_query_obj.id && get_query_obj.sign && get_query_obj.type && get_query_obj.t &&
					get_query_obj.price) {

					PcPush2(res, get_query_obj, 2);
				} else {
					res.end(JSON.stringify({
						code: -1,
						msg: "失败:参数不全"
					}));
				}
			}
			if (pathname == "/appHeart") { //心跳检测

				if (get_query_obj.t && get_query_obj.sign && get_query_obj.id) {
					appHeart(res, get_query_obj);
				} else {
					res.end(JSON.stringify({
						code: -1,
						msg: "失败:参数不全"
					}));
				}
			}
			if (pathname == "/select_session") { //查询session有效性
				if (get_query_obj.session) {
					select_session(res, null, get_query_obj.session, function(res, allinfo, result) {
						res.end(JSON.stringify({
							code: 1,
							msg: "session有效"
						}));
					}, function(res, allinfo) {
						res.end(JSON.stringify({
							code: -2,
							msg: "session无效"
						}));
					}, sqlerror);
				} else {
					res.end(JSON.stringify({
						code: -1,
						msg: "失败:参数不全"
					}));
				}
			}


		}
		//-------------------------POST请求----------------------------------
		else if ((req.method == 'POST')) {

			var fileName = ''; // 文件名
			// 边界字符串
			var boundary = "";

			if (pathname == "/qrdecode") {
				req.setEncoding('binary'); //请求接收编码二进制
				try {
					boundary = req.headers['content-type'].split('; ')[1].replace('boundary=', '');
				} catch (err) {
					res.end(JSON.stringify({
						code: -100,
						msg: "无效的content-type内容"
					}));
					return;
				}
			}


			if (!data_type) {
				res.end(JSON.stringify({
					code: -1,
					msg: "请在header头设置content-type为application/json或x-www-form-urlencoded"
				}));
				return;
			}
			req.on('data', (chunk) => {
				postData += chunk;
			});
			req.on('end', () => {
				if (data_type.indexOf("json") != -1) {
					//json数据
					post_query_obj = JSON.parse(postData);
				}
				if (data_type.indexOf("x-www-form-urlencoded") != -1) {
					//x-www-form-urlencoded数据

					post_query_obj = qs.parse(postData);
				}

				if (pathname == "/login") { //登录
					let allinfo = {
						username: "",
						password: "",
						session: "",
						login_type: 0
					}
					if (post_query_obj.login_type == "1" || post_query_obj.login_type == "2") {
						allinfo.login_type = post_query_obj.login_type;
						if (post_query_obj.login_type == "1") {
							if (post_query_obj.session) {
								allinfo.session = post_query_obj.session;
								login(res, allinfo);
							} else { //没有session
								res.end(JSON.stringify({
									code: -1,
									msg: "登录失败:无效的身份"
								}));
							}
						}
						if (post_query_obj.login_type == "2") {
							if (post_query_obj.username && post_query_obj.password) {
								allinfo.username = post_query_obj.username;
								allinfo.password = post_query_obj.password;
								login(res, allinfo);
							} else { //没有用户名或密码
								res.end(JSON.stringify({
									code: -2,
									msg: "登录失败:无效的用户名或密码"
								}));
							}
						}
					} else {
						res.end(JSON.stringify({
							code: -3,
							msg: "登录失败:无效的登录方式"
						}));
					}

				} else if (pathname == "/logon") { //注册
					let allinfo = {
						username: "",
						password: "",
						invitation_code_up: "",
					}
					if (post_query_obj.username && post_query_obj.password && post_query_obj
						.invitation_code_up) {
						post_query_obj.username ? allinfo.username = post_query_obj.username : allinfo
							.username = "";
						post_query_obj.password ? allinfo.password = post_query_obj.password : allinfo
							.password = "";
						post_query_obj.invitation_code_up ? allinfo.invitation_code_up = post_query_obj
							.invitation_code_up : allinfo.invitation_code_up = "";
						logon(res, allinfo);
					} else {
						res.end(JSON.stringify({
							code: -1,
							msg: "注册失败:请将信息填写完整"
						}));
					}

				} else if (pathname == "/qrdecode") { //解析二维码
					let allinfo = {
						session: "",
						boundary: ""
					};

					let query_get = url.parse(requset_url, true).query;
					if (query_get.session) {
						query_get.session ? allinfo.session = query_get.session : allinfo.session = "";
						boundary ? allinfo.boundary = boundary : allinfo.boundary = "";
						qrdecode(res, allinfo, postData);
					} else {
						res.end(JSON.stringify({
							code: -1,
							msg: "失败:参数不全"
						}));
					}



				} else if (pathname == "/select_order") { //查询订单数据
					let allinfo = {
						session: "",
						type: 0,
					}
					if (post_query_obj.session && post_query_obj.type) {
						allinfo.session = post_query_obj.session;
						allinfo.type = post_query_obj.type;
						select_order(res, allinfo, allinfo.session, allinfo.type, function(mainRes,
							allinfo, orderinfo, orderdata) {

							mainRes.end(JSON.stringify({
								code: 1,
								msg: "查询成功",
								orderinfo: orderinfo,
								orderdata: orderdata
							}));
						}, sqlerror);
					} else {
						res.end(JSON.stringify({
							code: -1,
							msg: "查询失败:参数不全"
						}));
					}

				} else if (pathname == "/createOrder") { //商户创建订单API接口(服务器-服务器)
					let allinfo = {
						mid: "",
						payid: "",
						type: 1, //这里写死为微信支付(以后再改)
						price: "",
						sign: "",
						param: "",
						ishtml: 0,
						notifyurl: "",
						returnurl: "",
						reallyprice_type: ""
					}
					if (post_query_obj.mid && post_query_obj.payid && post_query_obj.price &&
						post_query_obj.sign) {
						allinfo.mid = parseInt(post_query_obj.mid);
						allinfo.payid = post_query_obj.payid;
						allinfo.price = post_query_obj.price;
						allinfo.sign = post_query_obj.sign;
						post_query_obj.param ? allinfo.param = post_query_obj.param : allinfo.param = "";
						post_query_obj.ishtml ? allinfo.ishtml = post_query_obj.ishtml : allinfo.ishtml =
						0;
						post_query_obj.notifyurl ? allinfo.notifyurl = post_query_obj.notifyurl : allinfo
							.notifyurl = "";
						post_query_obj.returnurl ? allinfo.returnurl = post_query_obj.returnurl : allinfo
							.returnurl = "";
						createOrder(res, allinfo, sqlerror);
					} else {
						res.end(JSON.stringify({
							code: -1,
							msg: "创建失败:必要参数不全"
						}));
					}

				} else if (pathname == "/post_userinfo") { //查询商户信息
					if (post_query_obj.session) {
						select_session(res, null, post_query_obj.session, function(mainRes, allinfo,
							result) {
							let ntime = new Date();
							let seconds = ((parseInt(result[0].sessiontime / 1000) + mainParms
								.session_time_out * 60) * 1000 - ntime.getTime()) / 1000;
							if (seconds <= 0) { //已过期
								mainRes.end(JSON.stringify({
									code: -1,
									msg: "身份已过期,需要重新登录"
								}));
							} else {
								let info = {
									id: result[0].id,
									username: result[0].username,
									key: result[0].ukey,
									pname: result[0].pname,
									qq: result[0].qq,
									phonenumber: result[0].phonenumber,
									consumption: result[0].consumption,
									isok: result[0].isok,
									logondate: result[0].logondate,
									invitation_code: result[0].invitation_code,
									money: result[0].money,
									vip: result[0].vip,
									notifyurl: result[0].notifyurl,
									returnurl: result[0].returnurl,
									rate: result[0].rate,
									host: mainParms.host,
									session_time_out: mainParms.session_time_out,
									order_time_out: result[0].order_time_out
								};
								mainRes.end(JSON.stringify({
									code: 1,
									msg: "获取商户信息成功",
									data: info
								}));
							}

						}, function(mainRes) {
							mainRes.end(JSON.stringify({
								code: -2,
								msg: "身份不存在"
							}));
						}, sqlerror);
					} else {
						res.end(JSON.stringify({
							code: -3,
							msg: "查询失败:缺少身份"
						}));
					}

				} else if (pathname == "/checkOrder") { //查询订单状态(服务器-服务器)
					//orderid云端订单号，创建订单返回的
					if (post_query_obj.orderid) {
						checkOrder(res, post_query_obj.orderid);
					} else {
						res.end(JSON.stringify({
							code: -2,
							msg: "订单号无效"
						}));
					}

				} else if (pathname == "/clearorder") { //删除过期订单
					if (post_query_obj.session) {
						clearorder(res, null, post_query_obj.session, 2, function(mainRes, allinfo,
						result) {
							mainRes.end(JSON.stringify({
								code: 1,
								msg: "成功"
							}));
						}, function(mainRes, allinfo) {
							res.end(JSON.stringify({
								code: -1,
								msg: "身份无效"
							}));
						})
					} else {
						res.end(JSON.stringify({
							code: -1,
							msg: "身份无效"
						}));
					}
				} else if (pathname == "/update_userinfo_info") { //修改用户配置信息

					let allinfo = {
						"userinfo": {
							"pname": "",
							"qq": "",
							"phonenumber": "",
							"notifyurl": "",
							"returnurl": "",
							"order_time_out": 5
						},
						"session": "",
						"type": 1
					}
					if (post_query_obj.session && post_query_obj.type) {
						if (post_query_obj.userinfo) {
							post_query_obj.userinfo.pname ? allinfo.userinfo.pname = post_query_obj
								.userinfo.pname : allinfo.userinfo.pname = "";
							post_query_obj.userinfo.qq ? allinfo.userinfo.qq = post_query_obj.userinfo.qq :
								allinfo.userinfo.qq = "";
							post_query_obj.userinfo.phonenumber ? allinfo.userinfo.phonenumber =
								post_query_obj.userinfo.phonenumber : allinfo.userinfo.phonenumber = "";
							post_query_obj.userinfo.notifyurl ? allinfo.userinfo.notifyurl = post_query_obj
								.userinfo.notifyurl : allinfo.userinfo.notifyurl = "";
							post_query_obj.userinfo.returnurl ? allinfo.userinfo.returnurl = post_query_obj
								.userinfo.returnurl : allinfo.userinfo.returnurl = "";
							post_query_obj.userinfo.order_time_out ? allinfo.userinfo.order_time_out =
								post_query_obj.userinfo.order_time_out : allinfo.userinfo.order_time_out =
								5; //默认为5分钟
						}
						post_query_obj.password ? allinfo.password = post_query_obj.password : allinfo
							.password = "";
						post_query_obj.type ? allinfo.type = post_query_obj.type : allinfo.type = 0;
						post_query_obj.session ? allinfo.session = post_query_obj.session : allinfo
							.session = 0;
						update_userinfo_info(res, allinfo);
					} else {
						res.end(JSON.stringify({
							code: -1,
							msg: "必要参数不全"
						}));
					}

				} else if (pathname == "/recharge") { //充值余额

					let allinfo = {
						"mid": 0,
						"price": 0,
						"session": ""
					}
					if (post_query_obj.mid && post_query_obj.price && post_query_obj.session) {
						recharge(res, post_query_obj);
					} else {
						res.end(JSON.stringify({
							code: -1,
							msg: "必要参数不全"
						}));
					}

				} else if (pathname == "/order_notify") { //订单补单异步通知(手动补单)

					if (post_query_obj.orderid && post_query_obj.session) {
						order_notify(res, post_query_obj.session, post_query_obj.orderid)
					} else {
						res.end(JSON.stringify({
							code: -1,
							msg: "必要参数不全"
						}));
					}

				} else {
					res.end();
				}
			});
		}
		//------------------------其他请求-------------------------- 
		else {
			res.end();
		}

	}).listen(80);
	console.log("80端口服务已启动,第三方支付服务器运行正常")
