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

//ids of clients
var client_id = 0;
//in memory hash table
var clients = {};
var controllers = {};
// map reduce job id
var job_id_counter = 0;

// Routes
app.get('/', routes.index);
app.get('/client', routes.client);

// indexed by job id
var inputdata = [];
var mapdata = [];
var mapreturned = [];
var mapkeys = [];
var reducedata = [];
var reducereturned = [];

function newJob() {
  var job_id = job_id_counter;
  job_id_counter++;
  inputdata.push([]);
  mapdata.push({});
  mapreturned.push(0);
  mapkeys.push([]);
  reducedata.push({});
  reducereturned.push(0);
  return job_id;
}

// keep sending data to clients until fun returns fasle
function sprayClients(fun) {
  while(true) {
    for(c in clients) {
      if(!fun(clients[c])) { return; }
    }
  }
}

// send to all controllers
function broadcastControllers(fun) {
  for(c in controllers) {
    fun(controllers[c]);
  }
};


app.post('/', function(req, res) {
  var job_id = newJob();
  if(job_id > 0) {
    inputdata[job_id] = inputdata[job_id - 1];
  }
  inputdata[job_id].push(req.body.input);
  var inputpointer = 0;
  sprayClients(function(c) {
    c.socket.emit('sendMap', job_id, inputdata[job_id][inputpointer]);
    return ++inputpointer < inputdata[job_id].length;
  });
  res.json({job_id: job_id});
});


app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

io.sockets.on('connection', function (socket) {
  /* Membership Functions */
  client_id += 1;
  var id = client_id;
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
  /* End Membership Functions */
  
  socket.on('sendMapped', function (job_id, data) {
    for(d in data) {
      if (mapdata[job_id][d]) {
        mapdata[job_id][d].push(data[d]);
      } else {
        mapdata[job_id][d] = [data[d]];
      }
    }
    mapreturned[job_id]++;
    if(mapreturned[job_id] == inputdata[job_id].length) {
      mapkeys[job_id] = Object.keys(mapdata[job_id]);
      var mappointer = 0;
      sprayClients(function(c) {
        c.socket.emit('sendReduce', job_id, mapkeys[job_id][mappointer], mapdata[job_id][mapkeys[job_id][mappointer]]);
        return ++mappointer < mapkeys[job_id].length;
      });
    }
  });

  socket.on('sendReduced', function(job_id, key, data) {
    reducedata[job_id][key] = data;
    reducereturned[job_id]++;
    if(reducereturned[job_id] == mapkeys[job_id].length) {
      broadcastControllers(function(c) {
        c.socket.emit('finished', job_id, reducedata[job_id]);
      });
    }
  });
  /*
	socket.on('sendLocation', function (data) {
    var c = clients[socket.client_id];
		if(c) {
			socket.emit('sendAllLocations', getAllLocations());
			c.loc = data;
		}
  });
  */
});

function getAllLocations() {
	data = [];
	for(var k in clients) {
		data.push(k.loc);
	}
	return data;
}
