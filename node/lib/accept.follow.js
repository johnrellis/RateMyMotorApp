//acceptance tests from Beginning Mobile Wev Development : Richard Rodger 2012 : Wrox
//some fixes and changes made by john rellis
var common  = require('./common.js')
var config  = common.config

var util    = common.util  
var request = common.request  

var assert  = require('assert')
var eyes    = require('eyes')


var urlprefix = 'http://'+config.server+':3009/ratemymotor/api'
var headers   = {}


function handle(cb) {
  return function (error, response, body) {
    if( error ) {
      util.debug(error)
    }
    else {
      var code = response.statusCode
      var jsonResponseObject
      if(typeof body == 'string' ){
        jsonResponseObject = JSON.parse(body)
      }else {
       jsonResponseObject = body
      }
      
      util.debug('  '+code+': '+JSON.stringify(jsonResponseObject))

      assert.equal(null,error)
      assert.equal(200,code)

      cb(jsonResponseObject)
    }
  }
}

function get(username,uri,cb){
  util.debug('GET '+uri)
  request.get(
    {
      uri:uri,
      headers:headers[username] || {}
    }, 
    handle(cb)
  )
}

function post(username, uri,json,cb){
  util.debug('POST '+uri+': '+JSON.stringify(json))
  request.post(
    {
      uri:uri,
      json:json,
      headers:headers[username] || {}
    }, 
    handle(cb)
  )
}


module.exports = {

  api:function() {
    var foo = (''+Math.random()).substring(10)
    var bar = (''+Math.random()).substring(10)


    // create and load

    ;post(
      null,
      urlprefix+'/user/register',
      {username:foo},
      function(json){
        assert.ok(json.ok)
        headers[foo] = {
          'x-ratemymotor-token':json.token
        }

    ;get(
      foo, 
      urlprefix+'/user/'+foo,
      function(json){
        assert.equal(foo,json.username)
        assert.equal(0,json.followers.length)
        assert.equal(0,json.following.length)


    ;post(
      null,
      urlprefix+'/user/register',
      {username:bar},
      function(json){
        assert.ok(json.ok)
        headers[bar] = {
          'x-ratemymotor-token':json.token
        }

    ;get(
      bar, 
      urlprefix+'/user/'+bar,
      function(json){
        assert.equal(bar,json.username)
        assert.equal(0,json.followers.length)
        assert.equal(0,json.following.length)


    // search
    ;get(
      null,
      urlprefix+'/user/search/'+foo.substring(0,4),
      function(json){
        assert.ok(json.ok)
        assert.equal(1,json.list.length)
        assert.equal(json.list[0],foo)


    // follow
    ;post(
      foo,
      urlprefix+'/user/'+foo+'/follow',
      {username:bar},
      function(json){
        assert.ok(json.ok)

    ;get(
      foo,
      urlprefix+'/user/'+foo,
      function(json){
        assert.equal(0,json.followers.length)
        assert.equal(1,json.following.length)
        assert.equal(bar,json.following[0])

    ;get(
      bar,
      urlprefix+'/user/'+bar,
      function(json){
        assert.equal(1,json.followers.length)
        assert.equal(0,json.following.length)
        assert.equal(foo,json.followers[0])


    // unfollow
    ;post(
      foo,
      urlprefix+'/user/'+foo+'/unfollow',
      {username:bar},
      function(json){
        assert.ok(json.ok)

    ;get(
      foo,
      urlprefix+'/user/'+foo,
      function(json){
        assert.equal(0,json.followers.length)
        assert.equal(0,json.following.length)

    ;get(
      bar,
      urlprefix+'/user/'+bar,
      function(json){
        assert.equal(0,json.followers.length)
        assert.equal(0,json.following.length)


    ;})  // get
    ;})  // get
    ;})  // unfollow
    ;})  // get
    ;})  // get
    ;})  // follow
    ;})  // search
    ;})  // get 
    ;})  // post
    ;})  // get
    ;})  // post

  }
}
