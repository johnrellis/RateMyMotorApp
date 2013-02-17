//Built with examples from Beginning Mobile Wev Development : Richard Rodger 2012 : Wrox
//Built with examples from lecture notes
//functionality added/removed/modified by john rellis to suit this project

var server = '46.137.80.237'
var runningWithoutCamera = true
document.addEventListener("deviceready", deviceload)

var s3prefix = 'https://rate-my-motor.s3.amazonaws.com/'

function pd(func) {
    return function (event) {
        event.preventDefault()
        func && func(event)
    }
}

_.templateSettings = {
    interpolate:/\{\{(.+?)\}\}/g,
    escape:/\{\{-(.+?)\}\}/g,
    evaluate:/\{\{=(.+?)\}\}/g
};


var browser = {
    android:/Android/.test(navigator.userAgent)//regex/.test('string to be tested')
}
browser.iphone = !browser.android

function deviceload() {
    runningWithoutCamera = navigator.camera == undefined
}
//begin app creation

var app = {
    model:{},
    view:{}
}

var bb = {
    model:{},
    view:{}
}


bb.init = function () {

    bb.view.LoginPage = Backbone.View.extend(_.extend({
        events:{
            //TODO : tap events are occurring twice & using pd() makes 'this' the DOM Window
            'vclick #login_button':function (event) {
                var self = this
                event.preventDefault()
                console.log("login clicked")
                var username = self.elem.usernameTextBox.val()
                var password = self.elem.passwordTextBox.val()
                if (username && password) {
                    app.login(username, password)
                } else {
                    alert('Please enter a login and password')
                }
            },
            'vclick #register_button':function (event) {
                //todo : using pd() makes 'this' the DOM Window
                var self = this
                event.preventDefault()
                console.log("register clicked")
                var username = self.elem.usernameTextBox.val()
                var password = self.elem.passwordTextBox.val()
                if (username && password) {
                    app.register(username, password)
                } else {
                    alert('Please enter a login and password')
                }
            }
        },

        initialize:function () {
            var self = this
            _.bindAll(self)
            self.setElement("#login")
            self.elem = {
                loginButton:self.$el.find('#login_button'),
                registerButtonButton:self.$el.find('#login_button'),
                usernameTextBox:self.$el.find('#username'),
                passwordTextBox:self.$el.find('#password')

            }
        },

        render:function () {
        }
    }))

    bb.view.UploadPhoto = Backbone.View.extend(_.extend({
        events:{
            'vclick #btn_takepic':function (event) {
                var self = this
                event.preventDefault()
                if (runningWithoutCamera) {
                    alert("Sorry, you don't seem to have a camera... :( ")
                } else {
                    self.takepic(Camera.PictureSourceType.CAMERA)
                }
            },


            'vclick #btn_choose':function (event) {
                var self = this
                event.preventDefault()
                if (runningWithoutCamera) {
                    alert("Sorry, you don't seem to have a camera... :( ")
                } else {
                    self.takepic(Camera.PictureSourceType.PHOTOLIBRARY)
                }
            },

            'vclick #btn_upload':function (event) {
                var self = this
                event.preventDefault()
                var user = app.load('user')
                if (self.imagedata) {
                    self.elem.messageHolder.text('Uploading...')

                    self.uploadData(function (data) {
                        app.http_post(
                                user.username + '/post',
                                {picid:data.picid},
                                function (data) {
                                    self.elem.messageHolder.text('Picture uploaded.')
                                    $.mobile.changePage('#timeline')
                                    app.view.timeLine.refreshtimeline()
                                }
                        )
                    })
                }
                else {
                    self.elem.messageHolder.text('Take a picture first')
                }
            }


        },

        initialize:function () {
            var self = this
            _.bindAll(self)
            self.setElement('#upload')
            self.imageData = null
            self.elem = {
                takePicButton:self.$el.find('#btn_takepic'),
                imageHolder:self.$el.find('#post_pic'),
                uploadButton:self.$el.find('#btn_upload'),
                chooseButton:self.$el.find('#btn_choose'),
                messageHolder:self.$el.find('#post_msg')
            }
        },


        takepic:function (src) {
            console.log('clicked take picture..')
            var self = this
            navigator.camera.getPicture(
                    function (base64) {
                        self.imagedata = base64
                        self.elem.imageHolder.attr({src:"data:image/jpeg;base64," + self.imagedata})
                    },
                    function () {
                        self.elem.messageHolder.text('Could not take picture')
                    },
                    { quality:10,
                        destinationType:Camera.DestinationType.DATA_URL,
                        sourceType:src
                    }
            )

        },

        uploadData:function (win) {
            var self = this
            var padI = self.imagedata.length - 1
            while ('=' == self.imagedata[padI]) {
                padI--
            }
            var padding = self.imagedata.length - padI - 1

            var user = app.load('user')
            $.ajax({
                url:'http://' + server + '/ratemymotor/api/user/' + user.username + '/upload',
                type:'POST',
                contentType:'application/octet-stream',
                data:self.imagedata,
                headers:{'x-ratemymotor-padding':'' + padding,
                    'x-ratemymotor-token':user.token},
                dataType:'json',
                success:win,
                error:function (err) {
                    alert('Could not upload picture.' + JSON.stringify(err))
                }
            })
        }
    }))


    bb.view.Item = Backbone.View.extend(_.extend({

        tagName:"li", //need to call listview refresh to add the proper class styling

        events:{
            'vclick':function (event) {
                var self = this
                event.preventDefault()
                console.log('tap item ' + self.pic.picid)
                $.mobile.changePage('#rate')
                app.view.judgementarea.loadimage(self.pic.picid)
            }
        },

        initialize:function (pic) {
            var self = this
            self.pic = pic
            _.bindAll(self)
            self.$el.attr({name:'imageItem'})
            self.render()
        },

        render:function () {
            var self = this
            var html = self.tm.item(self.pic)
            self.$el.append(html)//add the templated html
        }
    }, {
        tm:{
            item:_.template($('#timeline_image').html())
        }
    }))

    bb.view.JudgementArea = Backbone.View.extend(_.extend({
        events:{
            'vclick #save_rating':function (event) {
                var self = this
                event.preventDefault()
                console.log('saving rating')
                event.preventDefault()
                self.saverating()
            }
        },

        initialize:function () {
            var self = this
            _.bindAll(self)
            self.setElement('#rate')
            self.elem = {
                judegementarea:self.$el.find('#judgement_area'),
                favswitch:self.$el.find('#fav'),
                rating:self.$el.find('#rating'),
                saveratingbutton:self.$el.find('#save_rating')
            }
            self.render()
        },

        render:function () {
            console.log('judgement rendering')
        },

        loadimage:function (picid) {
            var self = this
            self.picid = picid
            self.elem.judegementarea.attr({src:app.picurl(picid)})
            self.retrieverating()
        },

        retrieverating:function () {
            var self = this
            var user = app.load('user')
            var success = function (data) {
                console.log('successful retrieve of rating : ' + JSON.stringify(data))
                self.elem.rating.val(data.rating)
                self.elem.rating.slider('refresh')
                self.elem.favswitch.val(data.fav.toString())
                self.elem.favswitch.slider('refresh')
            }
            var fail = function (err) {
                alert("sorry, we couldn't rate the pic")
            }
            app.http_get(user.username + '/' + self.picid, success, fail)
        },

        saverating:function () {
            var self = this
            var fav = self.elem.favswitch.val()
            var favAsBoolean = (fav === 'true')
            var rating = parseInt(self.elem.rating.val())
            var user = app.load('user')
            console.log('Attempting to rate pic with ' + self.picid + ' and ' + rating + ' and ' + favAsBoolean)
            var success = function (data) {
                console.log('successful rating')
                $.mobile.changePage('#timeline')
                app.view.timeLine.refreshtimeline()
            }
            var fail = function (err) {
                alert("sorry, we couldn't rate the pic")
            }
            app.http_post(user.username + '/rate', {picid:self.picid, rating:rating, fav:favAsBoolean}, success, fail)
        }
    }))

    //TODO : timeline performance is pretty terrible.  Need a thumbnail system instead of loading whole image
    //TODO : loading items into timeline leaves a gap on right hand side of the screen
    bb.view.TimeLine = Backbone.View.extend(_.extend({

        events:{
            'vclick #refresh_time_line':function (event) {
                var self = this
                event.preventDefault()
                self.refreshtimeline()
            }
        },

        initialize:function () {
            var self = this
            _.bindAll(self)
            self.setElement('#timeline')
            self.elem = {
                refreshButton:self.$el.find('#refresh_time_line'),
                imagetimeline:self.$el.find('#timeline_images'),
                imagetemplate:self.$el.find('#timeline_image')
            }
        },

        refreshtimeline:function () {
            console.log('Attempting to refresh time line')
            var self = this
            $('li[name="imageItem"]').remove()
            //self.elem.imagetimeline.append(self.elem.refreshButton)
            var success = function (data) {
                console.log('got timeline')
                var piclist = data.list
                for (var i = 0; i < piclist.length; i++) {
                    var currentpic = piclist[i]
                    currentpic.imageurl = app.picurl(currentpic.picid)
                    var itemview = new bb.view.Item(currentpic)
                    self.elem.imagetimeline.append(itemview.$el)
                    self.elem.imagetimeline.listview("refresh")
                }
            }

            var fail = function (err) {
                alert("wrong username or password")
            }
            var user = app.load('user')
            app.http_get(user.username + '/timeline', success, fail)
        },

        newimageholder:function () {
            var self = this
            return self.elem.imagetemplate.clone()
        }
    }))

}


app.init_browser = function () {
    if (browser.android) {
        $("#main div[data-role='content']").css({
            bottom:0
        })
    }
}

app.login = function (username, password) {
    console.log('Attempting to login with ' + username + ' and ' + password)
    var success = function (data) {
        console.log('successful login')
        var user = {}
        user.username = username
        user.token = data.token
        app.save('user', user)
        app.loadUser(user.username)
    }

    var fail = function (err) {
        alert("wrong username or password")
    }
    app.http_post('login', {username:username, password:password}, success, fail)
}

app.register = function (username, password) {
    console.log('Attempting to login with ' + username + ' and ' + password)
    var success = function (data) {
        console.log('successful register')
        var user = {}
        user.username = username
        user.token = data.token
        app.save('user', user)
        app.loadUser(user.username)
    }
    var fail = function (err) {
        alert('user name is already in use')
    }
    app.http_post('register', {username:username, password:password}, success, fail)
}


app.loadUser = function (username) {
    console.log('Attempting to load user with ' + username)
    var success = function (data) {
        console.log('successful load of user')
        app.save('user', data)
        $.mobile.changePage('#timeline')
        app.view.timeLine.refreshtimeline()
    }

    var fail = function (err) {
        app.reset()
        alert('please log in again')
    }

    app.http_get(username, success, fail)
}


app.cache = {}

app.load = function (key) {
    return app.cache[key] || JSON.parse(localStorage[key] || '{}')
}

app.save = function (key, obj) {
    app.cache[key] = obj
    localStorage[key] = JSON.stringify(obj)
}

app.http_post = function (suffix, data, win, fail) {
    var user = app.load('user')
    $.mobile.showPageLoadingMsg('a', 'working...', true)
    var url = 'http://' + server + '/ratemymotor/api/user/' + suffix
    console.log(url)
    $.ajax(
            {
                url:url,
                type:'POST',
                headers:{'x-ratemymotor-token':user.token},
                contentType:'application/json',
                data:JSON.stringify(data),
                dataType:'json',
                success:app.serversuccess(win),
                error:app.handleServerError(fail)
            }
    )
}

app.http_get = function (suffix, win, fail) {
    var user = app.load('user')
    $.mobile.showPageLoadingMsg('a', 'working...', true)
    var url = 'http://' + server + '/ratemymotor/api/user/' + suffix
    console.log(url)
    $.ajax(
            {
                url:url,
                headers:{'x-ratemymotor-token':user.token},
                dataType:'json',
                success:app.serversuccess(win),
                error:app.handleServerError(fail)
            }
    )
}

app.handleServerError = function (fail) {
    return  function (err) {
        $.mobile.hidePageLoadingMsg()
        console.log(JSON.stringify(err))
        if (err.status == 400 && fail) {
            fail(err)
        } else {
            alert('Sorry, something technical is misbehaving.. try again soon.' + JSON.stringify(err) + " " + server)
            //app.reset()
        }
    }
}

app.serversuccess = function (win) {
    return function (data) {
        $.mobile.hidePageLoadingMsg()
        win && win(data)
    }
}

app.reset = function () {
    console.log('app reset')
    app.save('user', {})
}

app.picurl = function (picid) {
    return s3prefix + picid + '.jpg'
}


app.init = function () {
    console.log('start init')
    $.mobile.loadPage( '#rate', { showLoadMsg: false } ) //need to ensure the ratings page is prefetch
    $.mobile.loadPage( '#timeline', { showLoadMsg: false } ) //need to ensure the ratings page is prefetch
    //if the server returns with a rating and the page isn't preloaded, we get initialization errors

    bb.init()

    app.init_browser()

    app.view.loginPage = new bb.view.LoginPage()
    app.view.uploadPhoto = new bb.view.UploadPhoto()
    app.view.timeLine = new bb.view.TimeLine()
    app.view.judgementarea = new bb.view.JudgementArea()


    //try to login
    var user = app.load('user')
    if (user.username) {
        console.log('I seem to be logged in ' + JSON.stringify(user))
        app.loadUser(user.username)
    } else {
        app.reset()
    }
    console.log('end init')
}


$(app.init)