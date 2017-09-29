'use strict';

var path = require('path'),
    fs = require('fs'),
    fse = require('fs-extra'),
    vows = require('vows'),
    assert = require('assert'),
    mock = require('../src/biz-mock'),
    request = require('request'),
    _ = require('underscore'),
    http = require('http'),
    concatUrl = require('../src/Utils').concatUrl,
    httpServer = require('http-server');

var root = path.join(__dirname),
    mockPath = path.join(__dirname, 'mock'),
    server, mockserver, mockserverTwo;


function start(config, serverPort){
    mock.start(config);

    server = httpServer.createServer({
        root: root,
        before: [
            function(req, res) {
                mock.dispatch(req, res);
            }
        ]
    });
    server.listen(serverPort || 8090);

    //起一个假的mock服务器
    mockserver = http.createServer(function(req, res) {
        //用于测试mockServer的接口名
        if (req.url.indexOf('/query/server.action') > -1) {
            res.writeHead(200, {'Content-Type': 'application/json'});  
            var data = {  
                "name":"nodejs",  
                "value":"server",
                "from": "server1"  
            };  
            res.end(JSON.stringify(data));
        } else {
            res.writeHead(404);
            res.end();
        } 
    }).listen(8080);

    mockserverTwo = http.createServer(function(req, res) {
        //用于测试mockServer的接口名
        if (req.url.indexOf('/query/server.action') > -1) {
            res.writeHead(200, {'Content-Type': 'application/json'});  
            var data = {  
                "name":"nodejs",  
                "value":"server",
                "from": "server2"  
            };  
            res.end(JSON.stringify(data));
        } else {
            res.writeHead(404);
            res.end();
        } 
    }).listen(8081);

}

start();

var a = vows.describe('biz-mock').addBatch({
    'Init folder': {
        topic: function() {
            if (fs.existsSync(mockPath)) {
                fse.removeSync(mockPath);
            }
            mock.initFolder(__dirname);
            return fs;
        },
        'Copy <config> and <mock> folder to current folder': function(fs) {
            var mockStats = fs.statSync(path.join(__dirname, 'mock'));
            assert.isTrue( mockStats.isDirectory());
            // 删除测试用的文件夹
            
            if (fs.existsSync(mockPath)) {
                fse.removeSync(mockPath);
            }
        }
    },
    'Get mock data from JSON data': {
        topic: function() {
            request('http://127.0.0.1:8090/query/tree.action', this.callback);
        },
        'query http://127.0.0.1:8090/query/tree.action, status code should be 200': function(err, res, body) {
            assert.equal(res.statusCode, 200);
        },
        'query http://127.0.0.1:8090/query/tree.action, data should equal /mock/data/query/tree.json': function(err, res, body) {
            assert.isTrue(_.isEqual(JSON.parse(res.body), require(path.join(__dirname, '../mock/data/query/tree.json'))))
        }
    },
    'Get mock data from template': {
        topic: function() {
            request('http://127.0.0.1:8090/query/table.action', this.callback);
        },
        'query http://127.0.0.1:8090/query/table.action, status code should be 200': function(err, res, body) {
            assert.equal(res.statusCode, 200);
        },
        'query http://127.0.0.1:8090/query/table.action, data should have a property name equal table': function(err, res, body) {
            assert.isTrue(JSON.parse(res.body).hasOwnProperty('table'));
        },
        'query http://127.0.0.1:8090/query/table.action, the property of table should be a array': function(err, res, body) {
            var body = JSON.parse(res.body);
        }
    },
    'Get mock data from server': {
        topic: function() {
            request('http://127.0.0.1:8090/query/server.action', this.callback);
        },
        'query http://127.0.0.1:8090/query/server.action, status code should be 200': function(err, res, body) {
            assert.equal(res.statusCode, 200);
        },
        'query http://127.0.0.1:8090/query/server.action, data should have a property name equal value': function(err, res, body) {
            assert.isTrue(JSON.parse(res.body).hasOwnProperty('value'));
        },
        'query http://127.0.0.1:8090/query/server.action, the property of name should be "nodejs"': function(err, res, body) {
            var body = JSON.parse(res.body);
            assert.equal(body.name, 'nodejs');
        },
        'query http://127.0.0.1:8090/query/server.action, the data should from server1': function(err, res, body) {
            var body = JSON.parse(res.body);
            assert.equal(body.from, 'server1');
        },
    },
    'Test url concat': {
        'both has /': function() {
            var a = 'http://localhost/mock/';
            var b = '/test.action';
            assert.equal(concatUrl(a, b), 'http://localhost/mock/test.action');
        },
        'neither has /': function () {
            var a = 'http://localhost/mock';
            var b = 'test.action';
            assert.equal(concatUrl(a, b), 'http://localhost/mock/test.action');
        },
        'has one /': function () {
            var a = 'http://localhost/mock';
            var b = '/test.action';
            assert.equal(concatUrl(a, b), 'http://localhost/mock/test.action');
        }
    },
    teardown: function(topic) {
        console.log('server close')
        server.close();
        mockserver.close();
        mockserverTwo.close();
    }
}).export(module)