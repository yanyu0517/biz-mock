# biz-mock

[![NPM version](https://img.shields.io/npm/v/biz-mock.svg)](https://www.npmjs.com/package/biz-mock)
[![NPM downloads total](https://img.shields.io/npm/dt/biz-mock.svg)](https://www.npmjs.com/package/biz-mock)
[![NPM license](https://img.shields.io/npm/l/biz-mock.svg)](https://www.npmjs.com/package/biz-mock)
[![Build Status](https://travis-ci.org/yanyu0517/biz-mock.svg?branch=master)](https://travis-ci.org/yanyu0517/biz-mock)
[![bitHound Overalll Score](https://www.bithound.io/github/yanyu0517/biz-mock/badges/score.svg)](https://www.bithound.io/github/yanyu0517/biz-mock)
[![Coverage Status](https://coveralls.io/repos/yanyu0517/biz-mock/badge.svg?branch=master&service=github)](https://coveralls.io/github/yanyu0517/biz-mock?branch=master)
[![Dependency Status](https://david-dm.org/yanyu0517/biz-mock.svg)](https://david-dm.org/yanyu0517/biz-mock)
[![devDependency Status](https://david-dm.org/yanyu0517/biz-mock/dev-status.svg)](https://david-dm.org/yanyu0517/biz-mock#info=devDependencies)

biz-mock支持通过json静态数据，随机模板数据，cookie原酸数据，生成模拟数据

配合独立的server，能够减少前端开发对后端环境的依赖

[![NPM Stat](https://nodei.co/npm/biz-mock.png?downloads=true)](https://nodei.co/npm/biz-mock)

## 功能

- 拦截ajax请求
- 四种mock数据源，json，模板和cookie以及mockserver
- 支持自定义拦截器

## 安装

    npm install biz-mock --save

## 使用

    var mock = require('biz-mock');

biz-mock首先需要初始化配置文件，以及mock静态文件目录

- [initFolder](#initFolder)

初始化完成后，开启mock功能

- [start](#start)

拦截ajax请求

- [dispatch](#dispatch)
	
## API

### initFolder()

**initFolder([destPath])**

向指定路径复制配置文件以及mock静态文件目录

配置文件[mockConfig.json](#mockConfig)：

    /mock/config/mockConfig.json

mock静态文件目录：

	//mock jsondata folder
    /mock/data/

	//mock templatedata folder
    /mock/template/

### start()

**start([options])**

初始化mock配置，启动mock功能

`options`

- `as`:拦截ajax请求的后缀，默认是`'.action'`。可以拦截多种后缀的ajax，在`as`参数中多个后缀用`,`分隔。如请求不带.*后缀，可以配置成空字符串。

- `mockConfig`:配置文件json对象，默认路径是`options.root` + `/mock/config/mockConfig.json`

- `silent`:是否打印各种log，默认是`false`

- `methods`:拦截ajax请求的method，默认是`['post', 'get']`

- `root`:base路径，默认是`process.cwd()`

### dispatch()

**dispatch(req, res)**

拦截ajax请求，并返回mock数据

## mockConfig

### mockConfig.json:

	{
    "dataSource": ["cookie", "mockserver", "template", "json"],
    "json": {
        "path": "/mock/data/",
        "wrap": false
    },
    "cookie": {
        "host": "http://zhitou.xuri.p4p.sogou.com/",
        "rejectUnauthorized": false,
        "secureProtocol": "SSLv3_method",
        "cookie": ""
    },
    "template": {
        "path": "/mock/template/"
    },
    "mockserver": {
        "host": "http://localhost:8080/",
        "mockserverParams": {
        },
        "rejectUnauthorized": false,
        "secureProtocol": "SSLv3_method",
        "proxy": ""
    }
}

### mock数据源

`dataSource`是mock数据源的集合，目前有原生提供四种数据源cookie，template和json以及mockserver

数据源在集合中的排序规定了数据源的优先级，索引越小，优先级越高。如上面例子中，会首先查找cookie数据源，如果cookie数据源没有数据，接着是mockserver数据源，如果还没有，那么会查找template数据源，仍然没有，继续查找json数据源。四种数据源都没有的话，会返回404

1.json

json是静态数据源

    "json": {
    	"path": "/mock/data/",
   		"wrap": false
    }

path：静态数据源文件目录

wrap，数据外层是否被包裹（兼容处理）

包裹格式：

    {
	    "enabled": true,
	    "value": "success",
	    "success": {}
    }
2.template

template是通过数据模板生成模拟数据

生成器选用[http://mockjs.com/](http://mockjs.com/ "Mock.js")

3.cookie

cookie是通过在配置文件中拷贝cookie，实现免登陆直接请求数据

配置文件如下：

    "cookie": {
	    "host": ,
	    "secureProtocol": ,
	    "cookie": ,
		"proxy":
    }

- host：访问域名，支持http和https
- secureProtocol：SSL协议，根据安装的OpenSSL设置。比如SSLv3_method，即设置为SSL第三版。具体可参考[SSL_METHODS](https://www.openssl.org/docs/manmaster/ssl/ssl.html#DEALING_WITH_PROTOCOL_METHODS "SSL_METHODS")
- cookie: cookie
- proxy:代理
- 


json和template路径与请求路径一致，例：

请求:/query/table.action

json路径/mock/data/query/table.json

template路径/mock/data/query/table.template

4. mockserver

mockserver是通过配置mock服务地址以及mock服务需要的额外请求参数来获得mock服务器提供的响应结果

配置文件如下:

```
    "mockserver": {
        "host": "http://localhost:8080/",
        "mockserverParams": {

        },
        "rejectUnauthorized": false,
        "secureProtocol": "SSLv3_method",
        "proxy": ""
    }
```

- host：mock域名
- secureProtocol：SSL协议，根据安装的OpenSSL设置。比如SSLv3_method，即设置为SSL第三版。具体可参考[SSL_METHODS](https://www.openssl.org/docs/manmaster/ssl/ssl.html#DEALING_WITH_PROTOCOL_METHODS "SSL_METHODS")
- proxy:代理
- mockserverParams： mock服务器可能需要的额外参数，拼接于请求url后

为了使mockserver在没有相应响应时不影响继续使用其他mock源，特约定，在响应状态码为200时才使用mockserver的响应数据，不然使用其他mock源

### 如何自定义mock数据源

mock数据源实现getData方法

    exports.getData = function(url, req, res, cb){
    	return data
    }

方法参数：

- url：http请求，注意，不带后缀
- req: request
- res: response
- cb: biz-server采用co控制异步操作的流程，自定义数据源会被thunkify，cb是co的回调函数，`cb(error, data)`

方法返回：

- json数据

另外需要在/mock/config/mockConfig.json的dataSource注册mock数据源

## 更新日志

### 0.0.5 
- 修复suffix设置为''时存在的问题
- 修复suffix逻辑中正则表达式匹配不准确的问题
- 修复cookie模式下当request header中content-type为application/json时出错的情况
- 优化/config/mockConfig.json文件的目录结构，将其移入/mock/config/mockConfig.json
- 修改initFolder逻辑，不再生成/config目录
- 初始化时，当未设置config文件路径时，优先使用/mock/config/mockConfig.json, 同时如果新的不存在则兼容老的路径，并给出dperaciate提示。建议升级后进行迁移，简化工程目录
- 新增配置项的热更新，避免切换数据源时需要重新启动应用
- 代码格式化

### 0.1.1
- 增加新的mock源：mockserver
- 更改package.json的test脚本，使windows环境也能启动
