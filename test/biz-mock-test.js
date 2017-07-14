'use strict';

var path = require('path'),
    fs = require('fs'),
    fse = require('fs-extra'),
    vows = require('vows'),
    assert = require('assert'),
    mock = require('../src/biz-mock'),
    request = require('request'),
    _ = require('underscore'),
    httpServer = require('http-server');

var root = path.join(__dirname),
    mockPath = path.join(__dirname, 'mock'),
    server;

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
    teardown: function(topic) {
        console.log('server close')
        server.close();
    }
}).export(module)