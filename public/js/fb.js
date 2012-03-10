
require.paths.unshift(__dirname);

var everyauth = require('everyauth');
var express   = require('express');

var FacebookClient = require('facebook-client').FacebookClient;
var facebook = new FacebookClient();

var uuid = require('node-uuid');

// configure facebook authentication
everyauth.facebook
  .appId(process.env.FACEBOOK_APP_ID)
  .appSecret(process.env.FACEBOOK_SECRET)
  .scope('')
  .entryPath('/')
  .redirectPath('/home')
  .findOrCreateUser(function() {
    return({});
  })

// create an express webserver
var app = express.createServer(
  express.logger(),
  express.static(__dirname + '/public'),
  express.cookieParser(),
  // set this to a secret value to encrypt session cookies
  express.session({ secret: process.env.SESSION_SECRET || 'secret123' }),
  // insert a middleware to set the facebook redirect hostname to http/https dynamically
  function(request, response, next) {
    var method = request.headers['x-forwarded-proto'] || 'http';
    everyauth.facebook.myHostname(method + '://' + request.headers.host);
    next();
  },
  everyauth.middleware(),
  require('facebook').Facebook()
);

// listen to the PORT given to us in the environment
var port = process.env.PORT || 3000;

app.listen(port, function() {
  console.log("Listening on " + port);
});

// create a socket.io backend for sending facebook graph data
// to the browser as we receive it
var io = require('socket.io').listen(app);

// wrap socket.io with basic identification and message queueing
// code is in lib/socket_manager.js
var socket_manager = require('socket_manager').create(io);

// use xhr-polling as the transport for socket.io
io.configure(function () {
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 10);
});

// respond to GET /home
app.get('/home', function(request, response) {

  // detect the http method uses so we can replicate it on redirects
  var method = request.headers['x-forwarded-proto'] || 'http';

  // if we have facebook auth credentials
  if (request.session.auth) {

    // initialize facebook-client with the access token to gain access
    // to helper methods for the REST api
    var token = request.session.auth.facebook.accessToken;
    facebook.getSessionByAccessToken(token)(function(session) {

      // generate a uuid for socket association
      var socket_id = uuid();

      // use fql to get a list of my friends that are using this app
      session.restCall('fql.query', {
        query: 'SELECT uid, name, is_app_user, pic_square FROM user WHERE uid in (SELECT uid2 FROM friend WHERE uid1 = me()) AND is_app_user = 1',
        format: 'json'
      })(function(result) {
        result.forEach(function(friend) {
          socket_manager.send(socket_id, 'friend_using_app', friend);
        });
      });

      // get information about the app itself
      session.graphCall('/' + process.env.FACEBOOK_APP_ID)(function(app) {

        // render the home page
        response.render('home.ejs', {
          layout:   false,
          token:    token,
          app:      app,
          user:     request.session.auth.facebook.user,
          home:     method + '://' + request.headers.host + '/',
          redirect: method + '://' + request.headers.host + request.url,
          socket_id: socket_id
        });

      });
    });

  } else {
    // not authenticated, redirect to / for everyauth to begin authentication
    response.redirect('/');
  }
});


FB.init({
    appId: '391583264205223',
    status: true,
    cookie: true,
    xfbml: true
});

function sendPost() {
    FB.ui({
        method: 'feed',
        message: 'Post to your wall about Node Reduce!'
    }, function(response) {
        if (response != null) {
            alert('Thanks for posting about us!');
        }
    });
}

function sendMessage() {
    FB.ui({
        method: 'send',
        message: "Send a message to a friend about Node Reduce!"
    }, function(response) {
        if (response != null) {
            alert('Thanks for spreading the word!');
        }
    });
}

function sendInvites() {
    FB.ui({
        method: 'apprequests',
        message: "Check out Node Reduce!"
    }, function(response) {
        if (response != null && response.request_ids && response.request_ids.length > 0) {
            for (var i = 0; i < response.request_ids.length; i++) {
                alert("Invited: " + response.request_ids[i]);
            }
        }
    });
}

var socket = io.connect();
socket.on('connect', function() {
    socket.on('friend_using_app', function(friend) {
        $('ul#friends_using_app').append('
            <li>
                <a href="" onclick="window.open(\'http://www.facebook.com/' + friend.uid + '\');">
                    <img src="' + friend.pic_square + '" alt="' + friend.name + '">' + friend.name + '
                </a>
            </li> 
        ');
    });
});