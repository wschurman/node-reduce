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
  io.set("log level", 1);
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
app.get('/about', routes.about);
app.post('/canvas/', function(req, res) {
	res.redirect('http://me.harrisoncwong.com:1337/client');
});

var jobs = [];

function newJob() {
	var j = {
		job_id: job_id_counter,
    job_type: null,
		inputdata: [],
    mapCount: 0,
		mapdata: {},
		mapreturned: 0,
    reduceCount: 0,
		reduceData: [],
		reducereturned: 0
	};
	job_id_counter++;
	jobs.push(j);
  return j.job_id;
}

var stages = {
	MAP : 0,
	REDUCE : 1
};

function newClientJob(jid, input_cnt, st) {
	var cj = {
		job_id: jid,
		input: input_cnt,
		job_stage: st
	};
	return cj;
}

var lionSleepsTonight = [
"We-de-de-de",
"De-de-de-de-de",
"De-we-um-um-a-way",
"We-de-de-de",
"De-de-de-de-de",
"We-um-um-a-way",

"A-wimoweh, a-wimoweh",
"A-wimoweh, a-wimoweh",
"A-wimoweh, a-wimoweh",
"A-wimoweh, a-wimoweh",
"A-wimoweh, a-wimoweh",
"A-wimoweh, a wimoweh",
"A-wimoweh, a-wimoweh",
"A-wimoweh, a-wimoweh",

"In the jungle",
"The mighty jungle",
"The lion sleeps tonight",
"In the jungle",
"The quiet jungle",
"The lion sleeps tonight",

"A-wimoweh, a-wimoweh",
"A-wimoweh, a-wimoweh",
"A-wimoweh, a-wimoweh",
"A-wimoweh, a-wimoweh",
"A-wimoweh, a-wimoweh",
"A-wimoweh, a wimoweh",
"A-wimoweh, a-wimoweh",
"A-wimoweh, a-wimoweh",

"Near the village",
"The peaceful village",
"The lion sleeps tonight",
"Near the village",
"The quiet village",
"The lion sleeps tonight",

"A-wimoweh, a-wimoweh",
"A-wimoweh, a-wimoweh",
"A-wimoweh, a-wimoweh",
"A-wimoweh, a-wimoweh",
"A-wimoweh, a-wimoweh",
"A-wimoweh, a wimoweh",
"A-wimoweh, a-wimoweh",
"A-wimoweh, a-wimoweh",

"Hush, my darling",
"Don't fear my darling",
"The lion sleeps tonight",
"Hush, my darling",
"Don't fear my darling",
"The lion sleeps tonight",

"A-wimoweh, a-wimoweh",
"A-wimoweh, a-wimoweh",
"A-wimoweh, a-wimoweh",
"A-wimoweh, a-wimoweh",
"A-wimoweh, a-wimoweh",
"A-wimoweh, a wimoweh",
"A-wimoweh, a-wimoweh",
"A-wimoweh, a-wimoweh",

"We-de-de-de",
"De-de-de-de-de",
"De-we-um-um-a-way",
"We-de-de-de",
"De-de-de-de-de",
"We-um-um-a-way"];

var wordCount = {
  name: 'wordCount',
  data: lionSleepsTonight,
  mapBatch: 10,
  reduceBatch: 10,
  map: (function(input, ret) {
    var parts = input.split(' ');
    var output = [];
    for(var i = 0; i < parts.length; i++) {
      output.push([parts[i], 1]);
    }
    ret(output);
  }).toString(),
  combine: (function(input) {
    input.sort(function(x, y) {
      return (x[0] < y[0]);
    });
    var output = [];
    var pointer = -1;
    for(var i = 0; i < input.length; i++) {
      if(pointer != -1 && output[pointer][0] == input[i][0]) {
        output[pointer][1]++;
      } else {
        pointer++;
        output[pointer] = input[i];
      }
    }
    return output;
  }).toString(),
  reduce: (function(input) {
    var acc = 0;
    for(var i = 0; i < input[1].length; i++) {
      acc += input[1][i];
    }
    return [input[0], acc];
  }).toString()
};

function indexedLion() {
  var output = [];
  for(var i = 0; i < lionSleepsTonight.length; i++) {
    output.push([i, lionSleepsTonight[i]]);
  }
  return output;
}
var invertedIndex = {
  name: 'invertedIndex',
  data: indexedLion(),
  mapBatch: 10,
  reduceBatch: 10,
  map: (function(input, ret) {
    var document_id = input[0];
    var parts = input[1].split(' ');
    var output = [];
    for(var i = 0; i < parts.length; i++) {
      output.push([parts[i], [document_id]]);
    }
    ret(output);
  }).toString(),
  combine: (function(input) {
    input.sort(function(x, y) {
      return (x[0] < y[0]);
    });
    var output = [];
    var pointer = -1;
    for(var i = 0; i < input.length; i++) {
      if(pointer != -1 && output[pointer][0] == input[i][0]) {
        output[pointer][1] = output[pointer][1].concat(input[i][1]);
      } else {
        pointer++;
        output[pointer] = input[i];
      }
    }
    return output;
  }).toString(),
  reduce: (function(input) {
    var acc = [];
    for(var i = 0; i < input[1].length; i++) {
      acc = acc.concat(input[1][i]);
    }
    return [input[0], acc];
  }).toString()
}

// gets links
var webCrawler = {
  name: 'webCrawler',
  data: ["http://google.com","http://www.yahoo.com"],
  mapBatch: 10,
  reduceBatch: 10,
  map: (function(input, ret) {
    var res = null;
    $.get(input, function(d) {
      var parts = [];
      d.responseText.replace(/href="([^"]+)"/g, function () {
        parts.push(arguments[1]);
      });
      var output = [];
      for(var i = 0; i < parts.length; i++) {
        output.push([parts[i], 1]);
      }
      ret(output);
    });
  }).toString(),
  combine: (function(input) {
    input.sort(function(x, y) {
      return (x[0] < y[0]);
    });
    var output = [];
    var pointer = -1;
    for(var i = 0; i < input.length; i++) {
      if(pointer != -1 && output[pointer][0] == input[i][0]) {
        output[pointer][1]++;
      } else {
        pointer++;
        output[pointer] = input[i];
      }
    }
    return output;
  }).toString(),
  reduce: (function(input) {
    var acc = 0;
    for(var i = 0; i < input[1].length; i++) {
      acc += input[1][i];
    }
    return [input[0], acc];
  }).toString()
}

var fs = require('fs');
var anagram = {
  name: 'anagram',
  data: fs.readFileSync("COMMON.TXT","ASCII").split("\n"),
  mapBatch: 1000,
  reduceBatch: 1000,
  map: (function(input, ret) {
    var original = input;
    var sorted = input.split('').sort().join('');
    ret([[sorted, [original]]]);
  }).toString(),
  combine: (function(input) {
    input.sort(function(x, y) {
      return (x[0] < y[0]);
    });
    var output = [];
    var pointer = -1;
    for(var i = 0; i < input.length; i++) {
      if(pointer != -1 && output[pointer][0] == input[i][0]) {
        output[pointer][1] = output[pointer][1].concat(input[i][1]);
      } else {
        pointer++;
        output[pointer] = input[i];
      }
    }
    return output;
  }).toString(),
  reduce: (function(input) {
    var acc = [];
    for(var i = 0; i < input[1].length; i++) {
      acc = acc.concat(input[1][i]);
    }
    return [input[0], acc];
  }).toString()
}

// keep sending data to clients until fun returns false
// DEPRICATED
/*
function sprayClients(fun) {
  while(true) {
    for(c in clients) {
      if(!fun(clients[c])) { return; }
    }
  }
}
*/

// fun(client,dataArray)
function batchSprayClients(job_id, stage, groupSize, input, fun) {
  var queue = {};
  var i = 0;
  var emitCount = 0;
  while(i < input.length) { // for each input
    for(var c in clients) { // for each client
      if(queue[c]) { // if there is a queue for the client
        if(queue[c].length >= groupSize) { // if the queue is greater than group size
          fun(clients[c],queue[c]); // send mapped data to the client
					
					if (stage == stages.MAP) {
						clients[c].mapjobs.push(newClientJob(job_id, queue[c], stage)); //add job to client
					} else {
						clients[c].reducejobs.push(newClientJob(job_id, queue[c], stage)); //add job to client
					}
					
          queue[c] = []; // empty the queue
          emitCount++; // incr num emit jobs
        }
        queue[c].push(input[i]); // ad input to batch
      } else {
        queue[c] = [input[i]]; // no queue so create one
      }
      i++; // go to next input
    }
  }
  // cleanup extra
  for(var q in queue) {
    if(queue[q]) {
      fun(clients[q],queue[q]);
			
			if (stage == stages.MAP) {
				clients[q].mapjobs.push(newClientJob(job_id, queue[q], stage)); //add job to client
			} else {
				clients[q].reducejobs.push(newClientJob(job_id, queue[q], stage)); //add job to client
			}
			
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

function haveWorkers() {
	var found = false;
	for (var c in clients) {
		if (clients[c]) {
			found = true;
			break;
		}
	}
	return found;
}

// initiate mapreduce request
app.post('/', function(req, res) {
	if (!haveWorkers()) {
		res.json({error:"No Workers, Click client to create one."});
		return;
	}
  var job_id = newJob();
  var job = jobs[job_id];
  switch(req.body.type) {
    case 'invertedIndex':
      job.job_type = invertedIndex;
      break;
    case 'webCrawler':
      job.job_type = webCrawler;
      break;
    case 'anagram':
      job.job_type = anagram;
      break;
    // default to wordCount
    default:
      job.job_type = wordCount;
  }
  job.mapCount = batchSprayClients(job_id, stages.MAP, job.job_type.mapBatch, job.job_type.data, function(c, data) {
    c.socket.emit('sendMap', job_id, job.job_type.map, job.job_type.combine, data);
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
				loc: null,
				mapjobs: [],
				reducejobs: []
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
		// redistribute their work
		var brokencl = clients[socket.client_id];
		if (!brokencl) {
			return;
		}
		var mj_ptr = 0,
				rj_ptr = 0;
		var cmj = null,
				crj = null;
		
		// map jobs
		while (mj_ptr < brokencl.mapjobs.length) {
			for (var c in clients) {
				if (c == socket.client_id) {
					continue;
				}
				if (mj_ptr < brokencl.mapjobs.length) {
					cmj = brokencl.mapjobs[mj_ptr];
					if (jobs[cmj.job_id]) {
						clients[c].socket.emit('sendMap', cmj.job_id, jobs[cmj.job_id].job_type.map, jobs[cmj.job_id].job_type.combine, cmj.input);
						clients[c].mapjobs.push(newClientJob(job_id, queue[c], stages.MAP));
					}
					mj_ptr++;
				} else {
					break;
				}
			}
		}
		while (rj_ptr < brokencl.reducejobs.length) { 
			for (var c in clients) {
				if (c == socket.client_id) {
					continue;
				}
		 		if (rj_ptr < brokencl.reducejobs.length) {
					crj = brokencl.reducejobs[rj_ptr];
					if (jobs[crj.job_id]) {
						clients[c].socket.emit('sendReduce', crj.job_id, jobs[crj.job_id].job_type.reduce, crj.input);
						clients[c].reducejobs.push(newClientJob(job_id, queue[c], stages.REDUCE));
					}
					rj_ptr++;
				} else {
					break;
				}
			}
		}
		
		//delete their data arrs
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
    // merge keys
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
			clearJobs(stages.MAP);
      var maparray = [];
      for(m in job.mapdata) {
        maparray.push([m, job.mapdata[m]]);
      }
      
      job.reduceCount = batchSprayClients(job_id, stages.REDUCE, job.job_type.reduceBatch, maparray, function(c, data) {
        c.socket.emit('sendReduce', job_id, job.job_type.reduce, data);
      });
    }
  });

  socket.on('sendReduced', function(job_id, data) {
    var job = jobs[job_id];
    job.reduceData = job.reduceData.concat(data);
    job.reducereturned++;
    // all finished reducing
    if(job.reducereturned == job.reduceCount) {
			//clearJobs(stages.REDUCE);
      broadcastControllers(function(c) {
        c.socket.emit('finished', job_id, job.job_type.name, Object.keys(clients).length, job.reduceData);
      });
      delete jobs[job_id];
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

function clearJobs(stage) {
	if (stage == stages.MAP) {
		for(var k in clients) {
			delete k.mapjobs;
			k.mapjobs = [];
		}
	} else {
		for(var k in clients) {
			delete k.reducejobs;
			k.reducejobs = [];
		}
	}
	
}

function getAllLocations() {
	data = [];
	for(var k in clients) {
		data.push(k.loc);
	}
	return data;
}
