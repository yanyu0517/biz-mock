var path = require('path'),
    fs = require('fs'),
    vows = require('vows'),
    assert = require('assert'),
    mock = require('../src/biz-mock'),
    request = require('request'),
    _ = require('underscore'),
    httpServer = require('http-server');

var root = path.join(__dirname);

vows.describe('biz-mock').addBatch({
    // 'Init config folder': {
    //     topic: function() {
    //         var configPath = path.join(__dirname, 'config'),
    //             mockPath = path.join(__dirname, 'mock');
    //         if(fs.existsSync(configPath)){
    //             fs.rmdirSync(configPath);
    //         }
    //         if(fs.existsSync(mockPath)){
    //             fs.rmdirSync(mockPath);
    //         }
    //         mock.initFolder(__dirname);

    //         return 1;
    //     },
    //     'Copy <config> folder to current folder': {
    //         topic: function() {
    //             return fs.statSync('config');
    //         },
    //         '<config> folder exist': function(stats) {
    //             assert.isTrue(stats.isDirectory());
    //         }
    //     }
    // },
    'Start server and mock @ 8090': {
        topic: function() {
            mock.start();

            var server = httpServer.createServer({
                root: root,
                before: [
                    function(req, res) {
                        mock.dispatch(req, res);
                    }
                ]
            });
            server.listen(8090);
            this.callback(null, server);
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
                assert.isTrue(body.table instanceof Array);
            }
        }
    }

}).export(module)