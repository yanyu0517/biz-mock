'use strict';

var path = require('path'),
    mock = require('../src/biz-mock'),
    request = require('request'),
    _ = require('underscore'),
    httpServer = require('http-server');

var root = path.join(__dirname),
    mockConfig = require('./config.json'),
    mockPath = path.join(__dirname, 'mock');

mock.start({ as: '.action'});

var server = httpServer.createServer({
    root: root,
    before: [
        function(req, res) {
            mock.dispatch(req, res);
        }
    ]
});

server.listen(8099);