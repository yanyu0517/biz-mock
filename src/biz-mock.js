'use strict';

require('colors');

var MockJs = require('mockjs'),
    extend = require('extend'),
    fs = require('fs'),
    fse = require('fs-extra'),
    path = require('path'),
    request = require('request'),
    director = require('director'),
    co = require('co'),
    thunkify = require('thunkify'),
    Url = require('url'),
    watch = require('watch'),
    router = new director.http.Router();

var CONFIG_FILE_NAME = 'mockConfig.json';
var CONFIG_PATH_OLD = '/config';
var CONFIG_PATH_NEW = '/mock/config';
var currentConfigPath;

var defaultOptions = {
    as: '.action',
    silent: false,
    methods: ['post', 'get'],
    root: process.cwd()
};


var logger = {
    info: console.log,
    request: function(req, res, error) {
        var date = new Date();
        if (error) {
            logger.info(
                '[%s] "%s %s" Error (%s): "%s"',
                date, req.method.red, req.url.red,
                error.status.toString().red, error.message.red);
        } else {
            logger.info(
                '[%s] "%s %s" "%s"',
                date, req.method.cyan, req.url.cyan,
                req.headers['user-agent']);
        }
    }
};

//将参数对象转为字符串
function serialize(obj) {
    if (typeof obj === 'string') {
        return obj;
    }

    var result = [];
    var enc = encodeURIComponent;

    for (var key of Object.keys(obj)) {
        // console.log(key, '---',obj[key])
        if (obj[key]) {
            result.push([enc(key), enc(obj[key])].join('='));
        }

    }
    return result.join('&');
}

function Mock() {
    this.thunkGetJsonData = thunkify(this._getJsonData);
    this.thunkGetTemplateData = thunkify(this._getTemplateData);
    this.thunkGetCookieData = thunkify(this._getCookieData);
    this.thunkGetCustomData = thunkify(this._getCustomData);
    this.thunkGetMockserverData = thunkify(this._getMockserverData);
}

Mock.prototype.start = function(options) {
    this.options = extend(true, defaultOptions, options || {});

    var mockConfig = this.options.mockConfig,
        root = this.options.root;

    if (!mockConfig) {
        try {
            var oldConfig = path.join(root, CONFIG_PATH_OLD, CONFIG_FILE_NAME);
            var newConfig = path.join(root, CONFIG_PATH_NEW, CONFIG_FILE_NAME);
            // check new config path first, if not exists, try oldpath
            if (fs.existsSync(newConfig)) {
                this.options.mockConfig = require(newConfig);
                currentConfigPath = path.join(root, CONFIG_PATH_NEW);
                logger.info('read config file from /mock/config/mockConfig.json success'.green);
            } else {
                this.options.mockConfig = require(oldConfig);
                currentConfigPath = path.join(root, CONFIG_PATH_OLD);
                logger.info("[depreciate] the mockConfig.json file is already move into /mock/config/ in latest version, it will nolonger read /config/mockConfig.json by default when you not sepcify an config value.".yellow);
            }
        } catch (e) {
            logger.info("Can't find mock config file, mock feature isn't available");
        }
    }else if(typeof mockConfig === 'string'){
        //may pass a string path
        if(!path.isAbsolute(mockConfig)){
            mockConfig = path.join(root, mockConfig);
        }

        try{
            this.options.mockConfig = require(mockConfig);
        }catch(e){
            logger.info(`Can't find mock config file from ${mockConfig}, mock feature isn't available`);
        }
    }

    if (this.options.silent) {
        logger = {
            info: function() {},
            request: function() {}
        };
    }
    this._initRouter();
    this.hasStart = true;
    watchConfig();
};

//init router
Mock.prototype._initRouter = function() {
    var as = this.options.as,
        methods = this.options.methods,
        me = this,
        suffixes = [],
        mockConfig = this.options.mockConfig;

    //deal with suffix
    if (typeof as === 'string' && as !== '') {
        //support multiple suffix. eg: .action,.do
        suffixes = as.split(',');

        //fullfill with dot, support write suffix without dot prefix.
        suffixes = suffixes.map(function(suffix) {
            return suffix.replace(/^\.?/, '');
        });
    } else {
        suffixes.push('');
    }

    for (var i = 0; i < suffixes.length; i++) {
        var suffix = suffixes[i],
            noSuffix = !! !suffix,
            reg = noSuffix ?
                new RegExp('/(.*)') :
                new RegExp('/(.*)\\.' + suffix);
        for (var j = 0; j < methods.length; j++) {
            router[methods[j]].call(router, reg, function(url) {
                mockConfig && me._mockTo.call(me, url, this.req, this.res);
            });
        }
    }

};

Mock.prototype.initFolder = function(dest) {
    var src = path.join(__dirname, '../mock'),
        destPath = dest || process.cwd();

    // copy mock folder
    fse.copySync(src, destPath + '/mock');
    console.log('copy ' + src + ' to ' + destPath + '/mock');
};

Mock.prototype.dispatch = function(req, res) {
    if (!this.hasStart) {
        logger.info('You first have to call mock.start()'.red);
    }
    return router.dispatch(req, res);
};

Mock.prototype._mockTo = function(url, req, res) {
    var me = this;
    co(function * () {
        for (var i = 0; i < me.options.mockConfig.dataSource.length; i++) {
            var method = me._getMockData(me.options.mockConfig.dataSource[i]);
            var data = yield method.call(me, me.options.mockConfig.dataSource[i], url, req, res);
            if (typeof data !== 'undefined') {
                res.writeHead(200, {
                    'Content-Type': 'application/json'
                });

                if (typeof data === 'object') {
                    data = JSON.stringify(data);
                }

                res.end(data);
                logger.request(req, res);
                break;
            } else if (!data && i === me.options.mockConfig.dataSource.length - 1) {
                //最后一个仍然没有返回数据，那么则返回404
                res.writeHead(404);
                res.end('not found');
                logger.info("Can't find any data source".red);
            }
        }
        logger.info('Datasource is ' + me.options.mockConfig.dataSource[i].green);
    }).
    catch (function(err) {
        res.writeHead(404);
        res.end(err.stack);
        logger.request(req, res, err);
    });
};

Mock.prototype._getMockData = function(type) {
    var method;
    switch (type) {
        case 'json':
            method = this.thunkGetJsonData;
            break;
        case 'template':
            method = this.thunkGetTemplateData;
            break;
        case 'cookie':
            method = this.thunkGetCookieData;
            break;
        case 'mockserver':
            method = this.thunkGetMockserverData;
            break;
        default:
            method = this.thunkGetCustomData;
            break;
    }
    return method;
};


Mock.prototype._getJsonData = function(type, url, req, res, cb) {
    var pathStr = path.join(this.options.root, this.options.mockConfig.json.path + url + (this.options.mockConfig.json.suffix || '.json'));
    logger.info('Json data path is ' + pathStr.cyan);
    if (fs.existsSync(pathStr)) {
        var me = this;
        fs.readFile(pathStr, 'utf-8', function(err, data) {
            if (err) throw cb(err);
            var json;
            try {
                json = JSON.parse(data);
            } catch (e) {
                logger.info('Parse json failed!')
                cb(null);
                return;
            }
            if (me.options.mockConfig.json.wrap) {
                if (json.enabled) {
                    cb(null, JSON.stringify(json[json.value]));
                } else {
                    cb(null);
                }
            } else {
                return cb(null, data);
            }
        });
    } else {
        cb(null);
        logger.info("Can't find json data with the path '" + pathStr + "'");
    }
};

Mock.prototype._getTemplateData = function(type, url, req, res, cb) {
    var pathStr = path.join(this.options.root, this.options.mockConfig.template.path + url + '.template');
    logger.info('Template data path is ' + pathStr.cyan);
    if (fs.existsSync(pathStr)) {
        fs.readFile(pathStr, 'utf-8', function(err, data) {
            var mockData = MockJs.mock(new Function('return ' + data)());
            cb(null, JSON.stringify(mockData));
        });
    } else {
        cb(null);
        logger.info("Can't find template data with the path '" + pathStr + "'");
    }
};

Mock.prototype._getCookieData = function(type, url, req, res, cb) {
    var configs = this.options.mockConfig.cookie,
        headers = extend(true, {}, {
            cookie: configs.cookie
        }),
        url = Url.resolve(configs.host, req.url),
        options = {
            method: req.method || 'post',
            url: url,
            port: req.port,
            headers: headers,
            rejectUnauthorized: !! configs.rejectUnauthorized,
            secureProtocol: configs.secureProtocol || '',
            proxy: configs.proxy || ''
        };

    if (req.headers['content-type'] === 'application/json') { //support json input
        options.json = true;
        options.body = req.body;
    } else { //default to application/x-www-form-encoded
        options.form = req.body;
    }

    logger.info('Dispatch to ' + url.cyan);
    logger.info('request headers:', JSON.stringify(headers));

    request(options, function(error, res, body) {
        cb(error, body);
    });
};

Mock.prototype._getMockserverData = function(type, url, req, res, cb) {
    var configs = this.options.mockConfig.mockserver;
    var mockserverParams = configs.mockserverParams;
    //mockServer需要的参数
    var paramsString = serialize(mockserverParams);
    var connector = req.url.indexOf('?') > '-1' ? '&' : '?';
    var reqUrl = Url.resolve(configs.host, req.url);
    
    //存在参数时才需要添加后缀
    if (paramsString) {
        reqUrl = reqUrl + connector + paramsString;
    }
    var options = {
        method: req.method || 'post',
        url: reqUrl,
        port: req.port,
        rejectUnauthorized: !!configs.rejectUnauthorized,
        secureProtocol: configs.secureProtocol || '',
        proxy: configs.proxy || ''
    };
    if (req.headers['content-type'] === 'application/json') { //support json input
        options.json = true;
        options.body = req.body;
    } else { //default to application/x-www-form-encoded
        options.form = req.body;
    }

    logger.info('Dispatch to ' + url.cyan);
    request(options, function(error, res, body) {
        //响应码为200是视为服务正常响应了，不然视为异常，使用其他mock源的数据
        console.log(res.statusCode);
        console.log('--------------------------')
        if (res.statusCode == '200') {
            cb(error, body)
        } else {
            cb(error);
        }
    });
};

Mock.prototype._getCustomData = function(type, url, req, res, cb) {
    try {
        var mockSource = require(type);
        mockSource.getData(url, req, res, cb);
    } catch (e) {
        logger.info("Can't find mock source " + type);
    }
};

var mock = new Mock();

 // hmr
function watchConfig() {
    watch.createMonitor(currentConfigPath, function(monitor) {
        monitor.on("changed", function(f, curr, prev) {
            // Handle file changes
            logger.info('mock config file is changed, execute update')
            try {
                var configPath = path.join(currentConfigPath, CONFIG_FILE_NAME);
                //remove config module cache ,next time require this module will reload
                delete require.cache[configPath];

                mock.options.mockConfig = require(configPath);
                logger.info('mockConfig file hot reload success!');
            } catch (e) {
                logger.info('mockConfig file hot reload failed');
            }
        });
    });
    logger.info('biz-mock config livereload is running!');
}

module.exports = mock;
