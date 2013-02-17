//Built with examples from Beginning Mobile Wev Development : Richard Rodger 2012 : Wrox
//functionality added/removed/modified by john rellis to suit this project

var util = exports.util = require('util')
var connect = exports.connect = require('connect')
var knox = exports.knox = require('knox') //must be version 1.8.5
var uuid = exports.uuid = require('node-uuid')
var oauth = exports.oauth = require('oauth')
var url = exports.url = require('url')
var request = exports.request = require('request')
var Cookies = exports.Cookies = require('cookies')

var config = exports.config = require('./config.js')


// JSON functions

exports.readjson = function (req, win, fail) {
    var bodyarr = [];
    req.on('data', function (chunk) {
        bodyarr.push(chunk);
    })
    req.on('end', function () {
        var bodystr = bodyarr.join('');
        util.debug('READJSON:' + req.url + ':' + bodystr);
        try {
            var body = JSON.parse(bodystr);
            win && win(body);
        }
        catch (e) {
            fail && fail(e)
        }
    })
}

exports.sendjson = function (res, obj) {
    res.writeHead(200, {
        'Content-Type':'text/json',
        'Cache-Control':'private, max-age=0'
    });
    var objstr = JSON.stringify(obj);
    util.debug('SENDJSON:' + objstr);
    res.end(objstr);
}


// mongo functions

var mongodb = require('mongodb')

var mongo = {
    mongo:mongodb,
    db:null,
}
//https://gist.github.com/1209163
mongo.init = function (opts, win, fail) {
    util.log('mongodb//: ' + opts.host + ':' + opts.port + '/' + opts.name)

    mongo.db =
            new mongodb.Db(
                    opts.name,
                    new mongodb.Server(opts.host, opts.port, {native_parser:true, auto_reconnect:true}), {});

    mongo.db.open(function () {
        if (opts.username) {
            mongo.db.authenticate(
                    opts.username,
                    opts.password,
                    function (err) {
                        if (err) {
                            fail && fail(err)
                        }
                        else {
                            win && win(mongo.db)
                        }
                    })
        }
        else {
            win && win(mongo.db)
        }
    }, fail)
}

mongo.res = function (win, fail) {
    return function (err, res) {
        if (err) {
            util.log('mongo:err:' + JSON.stringify(err));
            fail && 'function' == typeof(fail) && fail(err);
        }
        else {
            win && 'function' == typeof(win) && win(res);
        }
    }
}

mongo.open = function (win, fail) {
    mongo.db.open(mongo.res(function () {
        util.log('mongo:ok');
        win && win();
    }, fail))
}

mongo.coll = function (name, win, fail) {
    mongo.db.collection(name, mongo.res(win, fail));
}

exports.mongo = mongo

