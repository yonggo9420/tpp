
---
title: 校际通第三方支付系统 v1.0.0
language_tabs:
  - shell: Shell
  - http: HTTP
  - javascript: JavaScript
  - ruby: Ruby
  - python: Python
  - php: PHP
  - java: Java
  - go: Go
toc_footers: []
includes: []
search: true
code_clipboard: true
highlight_theme: darkula
headingLevel: 2
generator: "@tarslib/widdershins v4.0.5"

---

# 校际通第三方支付系统

> v1.0.0

# 校际通第三方支付系统/普通业务API

## POST 订单补单异步通知(手动补单)

POST /order_notify

> Body 请求参数

```json
{
  "session": "string",
  "orderid": 0
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|object| 否 |none|
|» session|body|string| 是 |session|
|» orderid|body|integer| 是 |订单id|

> 返回示例

> 成功

```json
{
  "code": 1,
  "msg": "异步通知成功"
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|成功|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|说明|
|---|---|---|---|---|
|» code|integer|true|none|状态码|
|» msg|string|true|none|信息|

#### 枚举值

|属性|值|
|---|---|
|code|1|
|code|-1|
|code|-2|
|code|-3|
|code|-4|

## POST 余额充值

POST /recharge

根据session判断用户
第一次下单后未支付并且在第一个订单过期之前重新下单会进行判断
如果价格相同那么就返回第一次未过期的订单信息
如果价格不相同就更新该订单并返回更新后的订单信息
如果是第一次就创建新订单

> Body 请求参数

```json
{
  "code": 76,
  "msg": "officia laboris in amet",
  "orderinfo": {
    "mid": 55,
    "orderid": "11",
    "price": 46,
    "reallyprice": 69,
    "payurl": "http://aetako.bi/hezajd",
    "order_time_out": 768129633463,
    "date": 19941205
  }
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|object| 否 |none|
|» mid|body|integer| 是 |none|
|» price|body|integer| 是 |none|
|» session|body|string| 是 |none|

> 返回示例

> 成功

```json
{
  "code": 1,
  "msg": "成功",
  "data": {
    "mid": 2,
    "orderid": "20220327165157",
    "price": 27,
    "reallyprice": 27,
    "payurl": "wxp://f2f0CYCNxDDXkQOo9XHfOF9HiWiEyajgwsttCCYxjJRdZ_U",
    "order_time_out": 5,
    "date": 1648371117267
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|成功|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|说明|
|---|---|---|---|---|
|» code|integer|true|none|状态码|
|» msg|string|true|none|信息|
|» orderinfo|object|false|none|创建订单成功后返回的订单信息|
|»» mid|integer|true|none|商户ID|
|»» orderid|string|true|none|订单号|
|»» price|number|true|none|订单价格|
|»» reallyprice|number|true|none|实际需支付价格|
|»» payurl|string|true|none|支付二维码|
|»» order_time_out|integer|true|none|订单有效时间|
|»» date|integer|true|none|订单创建时间|

#### 枚举值

|属性|值|
|---|---|
|code|-1|
|code|-2|
|code|1|

## POST 查询订单

POST /select_order

> Body 请求参数

```yaml
type: "5"
session: a5f320909642ba0975ab9964bce1f497

```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|object| 否 |none|
|» type|body|string| 是 |查询的类型(1总订单,2成功的订单,3过期的或失败的订单,4待支付订单,5仅查询数量(前面1,2,3,4的数量均返回))(必要)|
|» session|body|string| 是 |商户session(必要)|

> 返回示例

> 成功

```json
{
  "code": 1,
  "msg": "查询成功",
  "data": {
    "allnum": 6,
    "state_1": 0,
    "state0": 1,
    "state1": 5,
    "state2": 0,
    "money": {
      "allnum": 0.06,
      "state0": 0.01,
      "state1": 0.05
    }
  }
}
```

```json
{
  "code": 1,
  "msg": "查询成功",
  "orderinfo": null,
  "orderdata": [
    {
      "id": 22,
      "mid": 2,
      "payid": "21648275829786",
      "type": 1,
      "price": 0.01,
      "sign": "25bb5f9403f90f9dd0bde339c8300d5d",
      "param": "\"pay_notify\"",
      "isHtml": 0,
      "notifyurl": "127.0.0.1",
      "returnurl": "127.0.0.1",
      "orderid": "20220326142349",
      "reallyprice": 0.01,
      "state": 0,
      "createdate": "1648275829794",
      "overdate": null
    }
  ]
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|成功|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|说明|
|---|---|---|---|---|
|» code|integer|true|none|状态码|
|» msg|string|true|none|信息|
|» orderdata|[object]¦null|false|none|type=(1/2/3/4返回的是array[订单数据])|
|» orderinfo|object¦null|false|none|type=(5返回如下信息)|
|»» allnum|integer|false|none|总订单数|
|»» state_1|integer|false|none|过期的或失败的订单数|
|»» state0|integer|false|none|待支付订单数|
|»» state1|integer|false|none|成功的订单数|
|»» state2|integer|false|none|成功但通知失败的订单数|
|»» money|object|false|none|订单收入数据|
|»»» state0|number|false|none|待支付订单收入|
|»»» state1|number|false|none|成功的订单收入|

#### 枚举值

|属性|值|
|---|---|
|code|1|
|code|-1|
|code|-2|

## POST 二维码解码

POST /qrdecode

> Body 请求参数

```yaml
string

```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|string(binary)| 否 |none|

> 返回示例

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|成功|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|说明|
|---|---|---|---|---|
|» code|integer|true|none|状态码|
|» payurl|string|false|none|二维码内容|

#### 枚举值

|属性|值|
|---|---|
|code|1|
|code|-1|
|code|-2|

## POST 注册

POST /logon

我的邀请码md5加密方法md5(上级邀请码+现在的时间戳13位)
通讯秘钥md5加密方法md5(用户名+密码+我的邀请码)(注册时)
SESSIONmd5加密方法md5(用户名+密码+现在的时间戳13位)

> Body 请求参数

```yaml
username: test
password: "123456"
invitation_code_up: 47d3f380d5f52583f0c436e955ada20b

```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|object| 否 |none|
|» username|body|string| 是 |用户名|
|» password|body|string| 是 |密码|
|» invitation_code_up|body|string| 是 |上级邀请码|

> 返回示例

> 成功

```json
{
  "code": 1,
  "msg": "注册成功",
  "session": "8eb2f2ea486938160df21b4bbde47a8a",
  "sessiontime": 1648299626744,
  "key": "80c2ab04718bb427617c20f1afd99072",
  "invitation_code": "03bc8653209459fa745a8424bf3c99b7"
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|成功|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|说明|
|---|---|---|---|---|
|» code|integer|true|none|状态码|
|» msg|string|true|none|信息|
|» session|string|false|none|注册成功后返回session|
|» sessiontime|integer|false|none|session的创建时间戳(13位)|
|» key|string|false|none|通讯秘钥|
|» invitation_code|string|false|none|我的邀请码|

## POST 一键删除过期订单

POST /clearorder

> Body 请求参数

```json
{
  "session": "979a2b17b6dd1cf15f3f164fcec92e22"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|object| 否 |none|
|» session|body|string| 是 |session|

> 返回示例

> 成功

```json
{
  "code": 1,
  "msg": "成功"
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|成功|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|说明|
|---|---|---|---|---|
|» code|integer|true|none|状态码|
|» msg|string|true|none|信息|

#### 枚举值

|属性|值|
|---|---|
|code|-1|
|code|1|

## POST 登录

POST /login

> Body 请求参数

```yaml
username: yonggo
password: s632716
login_type: "2"
session: string

```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|object| 否 |none|
|» username|body|string| 否 |用户名|
|» password|body|string| 否 |密码|
|» login_type|body|string| 是 |登录类型(1查询session有效性|2使用username和password登录)|
|» session|body|string| 否 |session|

> 返回示例

> 登录成功

```json
{
  "code": 1,
  "msg": "登录成功",
  "session": "a5f320909642ba0975ab9964bce1f497",
  "sessiontime": 1648298535973
}
```

```json
{
  "code": 1,
  "msg": "身份有效"
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|登录成功|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|说明|
|---|---|---|---|---|
|» code|integer|true|none|状态码|
|» msg|string|true|none|返回信息|
|» session|string|false|none|登录成功后返回session|
|» sessiontime|integer|false|none|session的创建时间戳(13位)|

#### 枚举值

|属性|值|
|---|---|
|code|1|
|code|-1|
|code|-2|
|code|-4|
|code|-3|
|code|-5|
|code|-6|

## POST 查询商户信息

POST /post_userinfo

> Body 请求参数

```yaml
session: c524cfb50384a991030873cb453a64a2

```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|object| 否 |none|
|» session|body|string| 否 |session|

> 返回示例

> 成功

```json
{
  "code": 1,
  "msg": "获取用户信息成功",
  "data": {
    "id": 2,
    "username": "yonggo",
    "key": "6d25c81b7704ab82aafcaf9376e393bc",
    "pname": null,
    "qq": null,
    "phonenumber": null,
    "consumption": 0,
    "isok": 0,
    "logondate": "1648261802374",
    "invitation_code": "47d3f380d5f52583f0c436e955ada20b",
    "money": 0,
    "vip": 0,
    "notifyurl": "127.0.0.1",
    "rate": 5,
    "host": "101.43.167.178",
    "session_time_out": 30
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|成功|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|说明|
|---|---|---|---|---|
|» code|integer|true|none|状态码|
|» msg|string|true|none|信息|
|» data|object¦null|false|none|商户信息|
|»» id|integer|true|none|商户id|
|»» username|string|true|none|用户名|
|»» key|string|true|none|通讯秘钥|
|»» pname|string,null|false|none|真实姓名|
|»» qq|string,null|false|none|QQ|
|»» phonenumber|string,null|false|none|电话号码|
|»» consumption|number|true|none|消费金额|
|»» isok|integer|true|none|账号状态(-1封禁,0正常)|
|»» logondate|string|true|none|注册时间(时间戳)|
|»» invitation_code|string|true|none|我的邀请码|
|»» money|number|true|none|余额|
|»» vip|integer|true|none|商户等级|
|»» notifyurl|string,null|false|none|异步通知接口|
|»» returnurl|string,null|false|none|同步跳转接口|
|»» rate|integer|true|none|费率|
|»» host|string|true|none|第三方支付系统服务器主机名|
|»» session_time_out|integer|true|none|session有效时间(分钟)|
|»» order_time_out|integer|true|none|订单有效时间(分钟)|

#### 枚举值

|属性|值|
|---|---|
|code|-1|
|code|1|
|code|-2|
|code|-3|

## POST 修改用户信息

POST /update_userinfo_info

通讯秘钥md5加密方法md5(用户名+密码+我的邀请码+当前时间戳(13位))(重置秘钥时)

> Body 请求参数

```json
{
  "userinfo": {
    "pname": "陆洋",
    "qq": "825941587",
    "phonenumber": 18677055316,
    "notifyurl": "217.105.81.148",
    "returnurl": "249.218.190.119",
    "order_time_out": 82
  },
  "session": "aliqua",
  "type": 1
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|object| 否 |none|
|» userinfo|body|object| 否 |用户信息|
|»» pname|body|string| 否 |姓名|
|»» qq|body|string| 否 |QQ|
|»» phonenumber|body|integer| 否 |电话号码|
|»» notifyurl|body|string| 否 |异步通知接口|
|»» returnurl|body|string| 否 |同步跳转接口|
|»» order_time_out|body|integer| 否 |订单有效时间(分钟)|
|» session|body|string| 是 |session|
|» password|body|string¦null| 否 |新密码|
|» type|body|integer| 是 |类型1为修改配置信息2为修改密码3为重置秘钥|

#### 枚举值

|属性|值|
|---|---|
|» type|1|
|» type|2|
|» type|3|

> 返回示例

> 成功

```json
{
  "code": 1,
  "msg": "修改配置信息成功"
}
```

```json
{
  "code": 1,
  "msg": "修改密码成功"
}
```

```json
{
  "code": 1,
  "msg": "重置秘钥成功"
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|成功|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|说明|
|---|---|---|---|---|
|» code|integer|true|none|状态码|
|» msg|string|true|none|信息|

# 校际通第三方支付系统/支付系统核心API

## POST 创建订单

POST /createOrder

商户创建订单API接口(服务器-服务器)
sign加密方法md5(商户id+商户订单号+自定义参数+订单价格+通讯密钥)

> Body 请求参数

```yaml
mid: "2"
payid: "1648306925"
param: pay_notify
price: "0.01"
sign: efa416f0e4f6a3573c405d79eba1c7f6
ishtml: string
notifyurl: string
returnurl: string

```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|object| 否 |none|
|» mid|body|string| 是 |商户ID|
|» payid|body|string| 是 |商户订单号，可以是时间戳，不可重复|
|» param|body|string| 否 |自定义参数，传输参数，将会原样返回到异步和同步通知接口|
|» price|body|string| 是 |订单价格|
|» sign|body|string| 是 |加密方法md5(商户id+商户订单号+自定义参数+订单价格+通讯密钥)|
|» ishtml|body|string| 否 |传入1则自动跳转到支付页面，不传或“0”返回创建结果的json数据|
|» notifyurl|body|string| 否 |传入则设置该订单的异步通知接口为该参数，不传或传空则使用后台设置的接口|
|» returnurl|body|string| 否 |传入则设置该订单的同步跳转接口为该参数，不传或传空则使用后台设置的接口|

> 返回示例

> 成功

```json
{
  "code": 1,
  "msg": "成功",
  "data": {
    "mid": 2,
    "payid": "1648306925",
    "orderid": "20220326232724",
    "paytype": 1,
    "price": 0.01,
    "reallyprice": 0.02,
    "payurl": "wxp://f2f0CYCNxDDXkQOo9XHfOF9HiWiEyajgwsttCCYxjJRdZ_U",
    "state": 0,
    "order_time_out": 5,
    "date": 1648308444654
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|成功|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|说明|
|---|---|---|---|---|
|» code|integer|true|none|状态码|
|» msg|string|true|none|信息|
|» data|object|false|none|订单创建成功后返回的数据|
|»» mid|integer|true|none|商户ID|
|»» payid|string|true|none|商户订单号|
|»» orderid|string|true|none|云端订单号，可用于查询订单是否支付成功|
|»» paytype|integer|true|none|微信支付为1 支付宝支付为2|
|»» price|number|true|none|订单金额|
|»» reallyprice|number|true|none|实际需付金额|
|»» payurl|string|true|none|支付二维码内容|
|»» order_time_out|integer|true|none|订单有效时间（分钟）|
|»» date|integer|true|none|订单创建时间时间戳（13位）|

#### 枚举值

|属性|值|
|---|---|
|code|-1|
|code|-2|
|code|-3|
|code|-4|
|code|-5|
|code|1|

## GET 心跳检测

GET /appHeart

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|query|string| 否 |商户ID|
|t|query|string| 否 |当前时间戳(13位)|
|sign|query|string| 否 |签名加密方法md5(t+key)|

> 返回示例

> 成功

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|成功|Inline|

### 返回数据结构

## GET PC收款回调(补单)

GET /api/server/PcPush2

监控软件监听到了微信收款就请求数据到本API
本API会将根据收款金额和商户ID来确定更新指定订单
如果收款金额不准确将有可能造成无法准确找到订单，导致目标订单无法结单
这个时候需要商户手动补单
补单会将实际收款金额定为订单价格
调用本API会触发一个异步通知，需要配置异步通知接口

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|user_id|query|string| 是 |商户ID|
|time|query|string| 是 |当前时间戳|
|type|query|string| 是 |微信为1|
|price|query|string| 是 |收款金额(如果是补单即订单金额)|
|sign|query|string| 是 |电脑端收款回调加密方法md5(type+price+time+key)|

> 返回示例

> 成功

```json
{
  "code": 1,
  "msg": "交易成功并且异步通知成功"
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|成功|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|说明|
|---|---|---|---|---|
|» code|integer|true|none|状态码|
|» msg|string|true|none|信息|

#### 枚举值

|属性|值|
|---|---|
|code|-1|
|code|1|
|code|-2|
|code|-3|
|code|-4|
|code|-5|

## POST 查询订单状态

POST /checkOrder

> Body 请求参数

```yaml
orderid: "20220326232724"

```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|object| 否 |none|
|» orderid|body|string| 是 |云端订单号，创建订单返回的|

> 返回示例

> 成功

```json
{
  "code": 1,
  "msg": "成功",
  "data": "http://127.0.0.1/?payid=21648342529607&param=&price=0.01&reallyPrice=0.03&sign=3c020071b0085c6ec451fdc68303147c"
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|成功|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|说明|
|---|---|---|---|---|
|» code|integer|true|none|状态码|
|» msg|string|true|none|信息|
|» data|string¦null|false|none|如果code为-1，则data为null，如果是充值余额返回空字符串，否则为该订单支付完成后的跳转地址（带回调参数）|

#### 枚举值

|属性|值|
|---|---|
|code|-1|
|code|-2|
|code|-3|
|code|1|

## GET app收款回调

GET /appPush

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|query|string| 否 |商户id|
|t|query|string| 否 |时间戳(13位)|
|type|query|string| 否 |收款类型|
|price|query|string| 否 |收款金额|
|sign|query|string| 否 |sign|

> 返回示例

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|成功|Inline|

### 返回数据结构

# 校际通第三方支付系统/商户服务器API

## GET 收款异步通知API

GET /callback

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|mid|query|string| 是 |商户ID|
|payid|query|string| 是 |商户订单号|
|param|query|string| 是 |创建订单的时候传入的参数|
|price|query|string| 是 |订单金额|
|reallyprice|query|string| 是 |实际支付金额|
|sign|query|string| 是 |校验签名，计算方式 = md5(mid+payid + param+ price + reallyprice + 通讯密钥)|

> 返回示例

> 成功

```json
{
  "code": 1
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|成功|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|说明|
|---|---|---|---|---|
|» code|integer|true|none|none|

#### 枚举值

|属性|值|
|---|---|
|code|1|
|code|-1|

# 数据模型
