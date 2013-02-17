//Built with examples from Beginning Mobile Wev Development : Richard Rodger 2012 : Wrox
//functionality added/removed/modified by john rellis to suit this project

var common = require('./common.js')
var config = common.config
var mongo = common.mongo

var util = common.util
var connect = common.connect
var knox = common.knox
var uuid = common.uuid
var oauth = common.oauth
var url = common.url
var request = common.request
var Cookies = common.Cookies


// API functions

function upload(req, res) {

    var bs = 48
    var bytes = 0

    var s3client = knox.createClient({
        key:config.amazon.keyid,
        secret:config.amazon.secret,
        bucket:config.amazon.s3bucket
    })

    var conlen = parseInt(req.headers['content-length'], 10)
    var padding = parseInt(req.headers['x-ratemymotor-padding'], 10)
    var bytelen = Math.floor(((conlen - padding) * 3) / 4)

    var picid = uuid()

    var s3req = s3client.put(
            picid + '.jpg',
            {
                'Content-Length':bytelen,
                'x-amz-acl':'public-read'
            }
    )

    s3req.on('error', function (err) {
        err400(res, 'S3')('' + err)
    })

    var remain = ''

    req.streambuffer.ondata(function (chunk) {
        var ascii = remain + chunk.toString('ascii')
        var bslen = bs * Math.floor(ascii.length / bs)

        var base64 = ascii.substring(0, bslen)
        var binary = new Buffer(base64, 'base64')
        var newremain = ascii.substring(bslen)

        bytes += binary.length

        remain = newremain
        s3req.write(binary)
    })

    req.streambuffer.onend(function () {
        if (0 < remain.length) {
            var binary = new Buffer(remain, 'base64')
            bytes += binary.length
            s3req.write(binary)
        }
        s3req.end()
        common.sendjson(res, {ok:true, picid:picid})
    })
}


function ratepic(req, res) {
    var merr = mongoerr400(res)
    util.debug('attemping to rate')

    var addOperation = {}
    addOperation['$addToSet'] = {ratings:{username:req.params.username, value:req.json.rating}}
    var pullOperation = {}
    pullOperation['$pull'] = {ratings:{username:req.params.username}}

    //pull from the ratings where username = req.username then add.
    //TODO : better way to update array?
    mongo.coll(
            'pics',
            function (coll) {

                coll.update(
                        { picid:req.json.picid },
                        pullOperation,
                        merr(function () {
                            coll.update(
                                    { picid:req.json.picid },
                                    addOperation,
                                    merr(function () {
                                        addOrRemoveFavourite(req, res)
                                    })
                            )
                        })
                )
            }
    )
}

function addOrRemoveFavourite(req, res) {
    var merr = mongoerr400(res)
    util.debug('attemping to update favourite')
    var op = {}
    var operationToPerform = ''
    if (req.json.fav) {
        util.debug('adding favourite')
        operationToPerform = '$addToSet'
    } else {
        util.debug('removing favourite')
        operationToPerform = '$pull'
    }
    op[operationToPerform] = {favourites:req.json.picid}
    mongo.coll(
            'user',
            function (coll) {

                coll.update(
                        { username:req.params.username },
                        op,
                        merr(function () {
                            common.sendjson(res, {ok:true})
                        })
                )
            }
    )
}

function retrieverating(req, res) {
    util.debug("retrieving rating")
    var merr = mongoerr400(res)
    //find the picture and the specific rating
    mongo.coll(
            'pics',
            function (coll) {
                coll.findOne(
                        {picid:req.params.picid},
                        {fields:['picid', 'ratings']},
                        merr(function (pic) {
                            var rating = 0
                            if (pic.ratings) {
                                for (var i = 0; i < pic.ratings.length; i++) {
                                    var ratingEntry = pic.ratings[i]
                                    if (ratingEntry.username == req.params.username) {
                                        rating = ratingEntry.value
                                        break
                                    }
                                }
                            }
                            //is this a favourite
                            mongo.coll(
                                    'user',
                                    function (coll) {
                                        coll.findOne(
                                                {username:req.params.username},
                                                {fields:['favourites']},
                                                merr(function (user) {
                                                    var favourite = false
                                                    if (user.favourites) {
                                                        for (var i = 0; i < user.favourites.length; i++) {
                                                            var favid = user.favourites[i]
                                                            if (favid == req.params.picid) {
                                                                favourite = true
                                                                break
                                                            }
                                                        }
                                                    }

                                                    common.sendjson(res, {fav:favourite, rating:rating})
                                                })
                                        )
                                    }
                            )
                        })
                )
            }
    )
}


function loaduser(req, res) {
    util.debug('Attempting to load user')
    var merr = mongoerr400(res)
    finduser(true, ['username', 'name', 'following', 'followers', 'stream'], req, res, function (user) {
        var userout =
        { username:user.username,
            token:user.token
        }
        common.sendjson(res, userout)
    })
}


function postpicture(req, res) {
    var merr = mongoerr400(res)
    util.debug('attempting to post picture')
    var picid = req.json.picid
    var username = req.params.username

    mongo.coll(
            'pics',
            function (coll) {

                coll.findOne(
                        {picid:picid},

                        merr(function (pic) {
                            if (pic) {
                                err400(res)('pic already exists')
                            }
                            else {
                                var token = common.uuid()
                                coll.insert(
                                        { picid:picid,
                                            user:username,
                                            createdDate:new Date(),
                                            ratings:[]//john:5
                                        },
                                        merr(function () {
                                            common.sendjson(res, {ok:true, picid:picid})
                                        })
                                )
                            }
                        })
                )
            }
    )
}

function latestpics(req, res) {
    util.debug("latest pictures")
    var merr = mongoerr400(res)
    mongo.coll(
            'pics',
            function (coll) {
                coll.find(
                        {},
                        {fields:['picid', 'user', 'createdDate', 'ratings']},
                        merr(function (cursor) {
                            var list = []
                            cursor.sort({createdDate:-1}).limit(3).each(merr(function (pic) {
                                if (pic) {
                                    var totalRatings = 0
                                    var validRatings = 0
                                    var averageRating = 0
                                    if (pic.ratings) {
                                        for (var i = 0; i < pic.ratings.length; i++) {
                                            var ratingEntry = pic.ratings[i]
                                            if (ratingEntry.value != undefined) {
                                                totalRatings += ratingEntry.value
                                                validRatings++
                                            }
                                        }
                                    }
                                    if (totalRatings > 0 && validRatings > 0) {
                                        averageRating = (totalRatings / validRatings).toFixed(1)
                                    }
                                    list.push({picid:pic.picid, createdDate:pic.createdDate, user:pic.user, rating:averageRating})
                                }
                                else {
                                    common.sendjson(res, {ok:true, list:list})
                                }
                            }))
                        })
                )
            }
    )
}

function register(req, res) {
    var merr = mongoerr400(res)
    util.debug('attempting to register')
    mongo.coll(
            'user',
            function (coll) {

                coll.findOne(
                        {username:req.json.username},

                        merr(function (user) {
                            if (user) {
                                err400(res)('user already exists')
                            }
                            else {
                                var token = common.uuid()
                                coll.insert(
                                        { username:req.json.username,
                                            password:req.json.password,
                                            token:token,
                                            favourites:[]//picid
                                        },
                                        merr(function () {
                                            common.sendjson(res, {ok:true, token:token})
                                        })
                                )
                            }
                        })
                )
            }
    )
}

function login(req, res) {
    util.debug("Logging in...")
    var merr = mongoerr400(res)
    mongo.coll(
            'user',
            function (coll) {
                coll.findOne(
                        {username:req.json.username, password:req.json.password},

                        merr(function (user) {
                            if (user) {
                                common.sendjson(res, {ok:true, token:user.token})
                            } else {
                                err400(res)('login or password incorrect')
                            }
                        })
                )
            }
    )
}


function finduser(mustfind, fields, req, res, found) {
    var merr = mongoerr400(res)

    mongo.coll(
            'user',
            function (coll) {
                var options = {}

                if (fields) {
                    options.fields = fields
                }

                util.debug('Attempting to find user with ' + req.params.username)//of course you wouldn't normally print someones password
                coll.findOne(
                        {username:req.params.username},

                        merr(function (user) {
                            if (mustfind && !user) {
                                err400(res)
                            }
                            else {
                                found(user, coll)
                            }
                        })
                )
            }
    )
}


function collect(streamurl) {
    var streamregexp = new RegExp(streamurl)

    return function (req, res, next) {
        if ('POST' == req.method) {
            if (streamregexp.exec(req.url)) {
                new StreamBuffer(req)
                next()
            }
            else {
                common.readjson(
                        req,
                        function (input) {
                            req.json = input
                            next()
                        },
                        err400(res, 'read-json')
                )
            }
        }
        else {
            next()
        }
    }
}


function StreamBuffer(req) {
    var self = this

    var buffer = []
    var ended = false
    var ondata = null
    var onend = null

    self.ondata = function (f) {
        for (var i = 0; i < buffer.length; i++) {
            f(buffer[i])
        }
        ondata = f
    }

    self.onend = function (f) {
        onend = f
        if (ended) {
            onend()
        }
    }

    req.on('data', function (chunk) {
        if (ondata) {
            ondata(chunk)
        }
        else {
            buffer.push(chunk)
        }
    })

    req.on('end', function () {
        ended = true
        if (onend) {
            onend()
        }
    })

    req.streambuffer = self
}

function mongoerr400(res) {
    return function (win) {
        return mongo.res(
                win,
                function (dataerr) {
                    err400(res)(dataerr)
                }
        )
    }
}

function err400(res, why) {
    return function (details) {
        util.debug('ERROR 400 ' + why + ' ' + details)
        res.writeHead(400, '' + why)
        res.end('' + details)
    }
}


function auth() {
    return function (req, res, next) {
        var merr = mongoerr400(res)
        util.debug('attempting auth')
        mongo.coll(
                'user',
                function (coll) {

                    coll.findOne(
                            {token:req.headers['x-ratemymotor-token']},
                            {fields:['username']},
                            merr(function (user) {
                                if (user) {
                                    next()
                                }
                                else {
                                    res.writeHead(401)
                                    res.end(JSON.stringify({ok:false, err:'unauthorized'}))
                                }
                            })
                    )
                }
        )
    }
}


var db = null
var server = null

mongo.init(
        {
            name:config.mongohq.name,
            host:config.mongohq.host,
            port:config.mongohq.port,
            username:config.mongohq.username,
            password:config.mongohq.password
        },
        function (res) {
            db = res
            var prefix = '/ratemymotor/api/user/'
            server = connect.createServer(
                    connect.logger(),
                    collect('/upload$'),

                    connect.router(function (app) {
                        app.post(prefix + 'login', login)
                                , app.post(prefix + 'register', register)
                    }),

                    auth(),//all actions after this require the x-ratemymotor-token in the request header

                    connect.router(function (app) {
                        app.get(prefix + ':username', loaduser)
                                , app.post(prefix + ':username/upload', upload)
                                , app.post(prefix + ':username/post', postpicture)
                                , app.get(prefix + ':username/timeline', latestpics)
                                , app.post(prefix + ':username/rate', ratepic)
                                , app.get(prefix + ':username/:picid', retrieverating)
                    })
            )
            util.debug("server listening")
            server.listen(3009)
        },
        function (err) {
            util.debug(err)
        }
)


