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

var jobs = [];

function newJob() {
	var j = {
		job_id: job_id_counter,
		inputdata: [],
    mapCount: 0,
		mapdata: [],
		mapreturned: 0,
		mapkeys: [],
		reducedata: {},
		reducereturned: 0
	};
	job_id_counter++;
	jobs.push(j);
  return j.job_id;
}

// keep sending data to clients until fun returns fasle
function sprayClients(fun) {
  while(true) {
    for(c in clients) {
      if(!fun(clients[c])) { return; }
    }
  }
}

// fun(client,dataArray)
function groupSprayClients(groupSize, input, fun) {
  var queue = {};
  var i = 0;
  var emitCount = 0;
  while(i < input.length) {
    for(c in clients) {
      if(queue[c]) {
        if(queue[c].length >= groupSize) {
          fun(clients[q],queue[q]);
          queue[q] = [];
          emitCount++;
        }
        queue[c].push(input[i]);
      } else {
        queue[c] = [input[i]];
      }
      i++;
    }
  }
  // cleanup extra
  for(q in queue) {
    if(queue[q]) {
      fun(clients[q],queue[q]);
      emitCount++;
    }
  }
  return emitCount;
}

// send to all controllers
function broadcastControllers(fun) {
  for(c in controllers) {
    fun(controllers[c]);
  }
};


app.post('/', function(req, res) {
  var job_id = newJob();
  var job = jobs[job_id];
  if(job_id > 0) {
    job.inputdata = jobs[job_id - 1].inputdata;
  }
  job.inputdata.push(req.body.input);
  job.mapCount = groupSprayClients(10, jobs[job_id].inputdata, function(c, data) {
    c.socket.emit('sendMap', job_id, data);
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
    var job = jobs[job_id];
    for(var i = 0; i < data.length; i++) {
      var key = data[i][0];
      var value = data[i][1];
      if(job.mapdata[key]) {
        job.mapdata[key].push(value);
      } else {
        job.mapdata[key] = [value];
      }
    }
    job.mapreturned++;
    // all finished mapping
    if(job.mapreturned == job.mapCount) {
      job.mapkeys = Object.keys(job.mapdata);
      var mappointer = 0;
      sprayClients(function(c) {
        c.socket.emit('sendReduce', job_id, job.mapkeys[mappointer], job.mapdata[job.mapkeys[mappointer]]);
        return ++mappointer < job.mapkeys.length;
      });
    }
  });

  socket.on('sendReduced', function(job_id, key, data) {
    jobs[job_id].reducedata[key] = data;
    jobs[job_id].reducereturned++;
    // all finished reducing
    if(jobs[job_id].reducereturned == jobs[job_id].mapkeys.length) {
      broadcastControllers(function(c) {
        c.socket.emit('finished', job_id, jobs[job_id].reducedata);
      });
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
