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

var id_counter = 0;
//in memory hash table
var clients = {}

// Routes
app.get('/', routes.index);
app.get('/client', routes.client);

var data = ["in the jungle", "the mighty jungle"];
var datapointer = 0;

app.post('/', function(req, res) {
  while(datapointer < data.length) {
    for(c in clients) {
      if(datapointer < data.length) {
        c.socket.emit('sendMap', data[datapointer]);
        datapointer++;
      }
    }
  }
});


app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

io.sockets.on('connection', function (socket) {
  id_counter += 1;
  var id = id_counter;
  socket.client_id = id;
  
  socket.emit('identifier', id);
  var client = {
    socket: socket,
    speed: null,
		loc: null
  }

  clients[id] = client;
  socket.on('disconnect', function() {
    delete clients[socket.client_id];
  });
  socket.on('sendSpeed', function (data) {
    var c = clients[socket.client_id];
    if(c) {
      c.speed = data;
    }
  });
  
  var mapdata = {};
  var numreturned = 0;
  socket.on('sendMapped', function (data) {
    for(d in data) {
      if (mapdata[d]) {
        mapdata[d] = mapdata[d] + data[d];
      } else {
        mapdata[d] = data[d];
      }
    }
    numreturned++;
    if(numreturned = data.length - 1) {
      var mappointer = 0;
      while(mappointer < data.length) {
        for(c in clients) {
          if(datapointer < data.length) {
            c.socket.emit('sendMap', data[datapointer]);
            datapointer++;
          }
        }
      }
    }
    console.log(data);
  });
  socket.on('sendReceived', function (data) {
    console.log(data);
  });
	socket.on('sendLocation', function (data) {
    var c = client[socket.client_id];
		if(c) {
			socket.emit('sendAllLocations', getAllLocations());
			c.loc = data;
		}
  });
});

function getAllLocations() {
	data = [];
	for(var k in clients) {
		data.push(k.loc);
	}
	return data;
}