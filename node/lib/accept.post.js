//acceptance tests from Beginning Mobile Wev Development : Richard Rodger 2012 : Wrox
//some fixes and changes made by john rellis
var common = require('./common.js')
var config = common.config

var util = common.util
var request = common.request

var assert = require('assert')
var eyes = require('eyes')


var urlprefix = 'http://' + config.server + ':3009/ratemymotor/api'
var headers = {}


function handle(cb) {
    return function (error, response, body) {
        if (error) {
            util.debug(error)
        }
        else {
            var code = response.statusCode
            var jsonResponseObject
            if (typeof body == 'string') {
                jsonResponseObject = JSON.parse(body)
            } else {
                jsonResponseObject = body
            }

            util.debug('  ' + code + ': ' + JSON.stringify(jsonResponseObject))

            assert.equal(null, error)
            assert.equal(200, code)

            cb(jsonResponseObject)
        }
    }
}

function get(username, uri, cb) {
    util.debug('GET ' + uri)
    request.get(
            {
                uri:uri,
                headers:headers[username] || {}
            },
            handle(cb)
    )
}

function post(username, uri, json, cb) {
    util.debug('POST ' + uri + ': ' + JSON.stringify(json))
    var opts = {
        uri:uri,
        headers:headers[username] || {}
    }

    if (json.__raw__) {
        opts.body = json.__raw__
        opts.headers['x-ratemymotor-padding'] = 2
    }
    else {
        opts.json = json
    }


    request.post(
            opts,
            handle(cb)
    )
}


var base64img = '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'


module.exports = {

    api:function () {
        var foo = ('' + Math.random()).substring(10)
        var bar = ('' + Math.random()).substring(10)


        // create and load

                ;
        post(
                null,
                urlprefix + '/user/register',
                {username:foo},
                function (json) {
                    assert.ok(json.ok)
                    headers[foo] = {
                        'x-ratemymotor-token':json.token
                    }

                    ;
                    get(
                            foo,
                            urlprefix + '/user/' + foo,
                            function (json) {
                                assert.equal(foo, json.username)
                                assert.equal(0, json.followers.length)
                                assert.equal(0, json.following.length)


                                ;
                                post(
                                        null,
                                        urlprefix + '/user/register',
                                        {username:bar},
                                        function (json) {
                                            assert.ok(json.ok)
                                            headers[bar] = {
                                                'x-ratemymotor-token':json.token
                                            }

                                            ;
                                            get(
                                                    bar,
                                                    urlprefix + '/user/' + bar,
                                                    function (json) {
                                                        assert.equal(bar, json.username)
                                                        assert.equal(0, json.followers.length)
                                                        assert.equal(0, json.following.length)


                                                            // search
                                                        ;
                                                        get(
                                                                null,
                                                                urlprefix + '/user/search/' + foo.substring(0, 4),
                                                                function (json) {
                                                                    assert.ok(json.ok)
                                                                    assert.equal(1, json.list.length)
                                                                    assert.equal(json.list[0], foo)


                                                                        // follow
                                                                    ;
                                                                    post(
                                                                            foo,
                                                                            urlprefix + '/user/' + foo + '/follow',
                                                                            {username:bar},
                                                                            function (json) {
                                                                                assert.ok(json.ok)

                                                                                ;
                                                                                get(
                                                                                        foo,
                                                                                        urlprefix + '/user/' + foo,
                                                                                        function (json) {
                                                                                            assert.equal(0, json.followers.length)
                                                                                            assert.equal(1, json.following.length)
                                                                                            assert.equal(bar, json.following[0])

                                                                                            ;
                                                                                            get(
                                                                                                    bar,
                                                                                                    urlprefix + '/user/' + bar,
                                                                                                    function (json) {
                                                                                                        assert.equal(1, json.followers.length)
                                                                                                        assert.equal(0, json.following.length)
                                                                                                        assert.equal(foo, json.followers[0])


                                                                                                            // post and stream
                                                                                                        ;
                                                                                                        post(
                                                                                                                bar,
                                                                                                                urlprefix + '/user/' + bar + '/upload',
                                                                                                                {__raw__:base64img},
                                                                                                                function (json) {
                                                                                                                    assert.ok(json.ok)
                                                                                                                    var picid = json.picid

                                                                                                                            ;
                                                                                                                    post(
                                                                                                                            bar,
                                                                                                                            urlprefix + '/user/' + bar + '/post',
                                                                                                                            {picid:picid},
                                                                                                                            function (json) {
                                                                                                                                assert.ok(json.ok)

                                                                                                                                ;
                                                                                                                                get(
                                                                                                                                        bar,
                                                                                                                                        urlprefix + '/user/' + bar + '/stream',
                                                                                                                                        function (json) {
                                                                                                                                            assert.ok(json.ok)
                                                                                                                                            assert.equal(1, json.stream.length)
                                                                                                                                            assert.equal(picid, json.stream[0].picid)
                                                                                                                                            assert.equal(bar, json.stream[0].user)

                                                                                                                                            ;
                                                                                                                                            get(
                                                                                                                                                    foo,
                                                                                                                                                    urlprefix + '/user/' + foo + '/stream',
                                                                                                                                                    function (json) {
                                                                                                                                                        assert.ok(json.ok)
                                                                                                                                                        assert.equal(1, json.stream.length)
                                                                                                                                                        assert.equal(picid, json.stream[0].picid)
                                                                                                                                                        assert.equal(bar, json.stream[0].user)


                                                                                                                                                            // unfollow
                                                                                                                                                        ;
                                                                                                                                                        post(
                                                                                                                                                                foo,
                                                                                                                                                                urlprefix + '/user/' + foo + '/unfollow',
                                                                                                                                                                {username:bar},
                                                                                                                                                                function (json) {
                                                                                                                                                                    assert.ok(json.ok)

                                                                                                                                                                    ;
                                                                                                                                                                    get(
                                                                                                                                                                            foo,
                                                                                                                                                                            urlprefix + '/user/' + foo,
                                                                                                                                                                            function (json) {
                                                                                                                                                                                assert.equal(0, json.followers.length)
                                                                                                                                                                                assert.equal(0, json.following.length)

                                                                                                                                                                                ;
                                                                                                                                                                                get(
                                                                                                                                                                                        bar,
                                                                                                                                                                                        urlprefix + '/user/' + bar,
                                                                                                                                                                                        function (json) {
                                                                                                                                                                                            assert.equal(0, json.followers.length)
                                                                                                                                                                                            assert.equal(0, json.following.length)


                                                                                                                                                                                            ;
                                                                                                                                                                                        })  // get
                                                                                                                                                                                ;
                                                                                                                                                                            })  // get
                                                                                                                                                                    ;
                                                                                                                                                                })  // unfollow
                                                                                                                                                        ;
                                                                                                                                                    })  // stream
                                                                                                                                            ;
                                                                                                                                        })  // stream
                                                                                                                                ;
                                                                                                                            })  // post
                                                                                                                    ;
                                                                                                                })  // upload
                                                                                                        ;
                                                                                                    })  // get
                                                                                            ;
                                                                                        })  // get
                                                                                ;
                                                                            })  // follow
                                                                    ;
                                                                })  // search
                                                        ;
                                                    })  // get
                                            ;
                                        })  // post
                                ;
                            })  // get
                    ;
                })  // post

    }
}