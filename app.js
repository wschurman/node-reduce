var port = process.env.PORT || 1337;
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes');

var app = module.exports = express.createServer()
  , io = require('socket.io').listen(app);

// Configuration

io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);
app.get('/client', routes.client);


app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

var id_counter = 0;
var clients = []

io.sockets.on('connection', function (socket) {
	id_counter += 1;
	var client = {
		"id": id_counter,
	}
  	socket.emit('identifier', client);
	clients.push(client);
  	socket.on('my other event', function (data) {
    	console.log(data);
  	});
});