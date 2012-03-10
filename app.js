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
var controllers = {}

// Routes
app.get('/', routes.index);
app.get('/client', routes.client);

var inputdata = ["in the jungle", "the mighty jungle"];
var inputpointer = 0;

var mapdata = {};
var mapreturned = 0;
var mapkeys = null;

var reducedata = {};
var reducereturned = 0;

function resetJob() {
  inputpointer = 0;
  mapdata = {};
  mapreturned = 0;
  mapkeys = null;
  reducedata = {};
  reducereturned = 0;
}

app.post('/', function(req, res) {
  inputdata.push(req.body.input);
  while(inputpointer < inputdata.length) {
    for(c in clients) {
      if(inputpointer < inputdata.length) {
        clients[c].socket.emit('sendMap', inputdata[inputpointer]);
        inputpointer++;
      }
    }
  }
  res.render('index', { title: 'Express' })
});


app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

io.sockets.on('connection', function (socket) {
  id_counter += 1;
  var id = id_counter;
  socket.client_id = id;
  
  socket.emit('identifier', id);
  
  socket.on('register', function(type) {
    if(type=='client') {
      var client = {
        socket: socket,
        speed: null,
				loc: null
      }
      clients[id] = client;
    } else if(type=='controller') {
      var controller = {
        socket: socket,
      }
      controllers[id] = controller;
    }
  });
  socket.on('disconnect', function() {
    delete clients[socket.client_id];
  });
  socket.on('sendSpeed', function (data) {
    var c = clients[socket.client_id];
    if(c) {
      c.speed = data;
    }
  });
  
  socket.on('sendMapped', function (data) {
    for(d in data) {
      if (mapdata[d]) {
        mapdata[d].push(data[d]);
      } else {
        mapdata[d] = [data[d]];
      }
    }
    mapreturned++;
    if(mapreturned == inputdata.length) {
      mapkeys = Object.keys(mapdata);
      var mappointer = 0;
      while(mappointer < mapkeys.length) {
        for(c in clients) {
          if(mappointer < mapkeys.length) {
            clients[c].socket.emit('sendReduce', mapkeys[mappointer], mapdata[mapkeys[mappointer]]);
            mappointer++;
          }
        }
      }
    }
  });

  socket.on('sendReduced', function(key, data) {
    reducedata[key] = data;
    reducereturned++;
    if(reducereturned == mapkeys.length) {
      for(c in controllers) {
        if(c) {
          controllers[c].socket.emit('finished', reducedata);
        }
      }
      resetJob();
    }
  });
	socket.on('sendLocation', function (data) {
    var c = clients[socket.client_id];
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
