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

## 功能

- 拦截ajax请求
- 三种mock数据源，json，模板和cookie
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

    /config/mockConfig.json

mock静态文件目录：

	//mock jsondata folder
    /mock/data/

	//mock templatedata folder
    /mock/template/

### start()

**start([options])**

初始化mock配置，启动mock功能

`options`

- `as`:拦截ajax请求的后缀，默认是`'.action'`。可以拦截多种后缀的ajax，在`as`参数中多个后缀用`,`分隔

- `mockConfig`:配置文件json对象，默认路径是`process.cwd(), '/config/mockConfig.json'`

- `silent`:是否打印各种log，默认是`false`

- `methods`:拦截ajax请求的method，默认是`['post', 'get']`

### dispatch()

**dispatch(req, res)**

拦截ajax请求，并返回mock数据

## mockConfig

### mockConfig.json:

	{
    "dataSource": ["cookie", "template", "json"],
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
    }
}

### mock数据源

`dataSource`是mock数据源的集合，目前有原生提供三种数据源cookie，template和json

数据源在集合中的排序规定了数据源的优先级，索引越小，优先级越高。如上面例子中，会首先查找cookie数据源，如果cookie数据源没有数据，那么会查找template数据源，仍然没有，继续查找json数据源。三种数据源都没有的话，会返回404

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

另外需要在config/mockConfig.json的dataSource注册mock数据源