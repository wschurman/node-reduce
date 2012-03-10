var longitude = null,
		latitude = null;

var socket = io.connect('/');
var identifier = null;
socket.on('identifier', function (data) {
  identifier = data;
  socket.emit('register', 'client');
  socket.emit('sendSpeed', getSpeed());
	socket.emit('sendLocation', {latitude:latitude, longitude:longitude});
});

// Return time in seconds to process
function getSpeed() {
  var start = (new Date().getTime());
  var a = 0;
  /*
  for(var i = 0; i < 1000000000; i++) {
    a++;
  }
  */
  var duration = (new Date().getTime()) - start;
  console.log(duration);
  return duration;
}

function wordCountMap(input) {
  var parts = input.split(' ');
  var output = [];
  for(var i = 0; i < parts.length; i++) {
    output.push([parts[i], 1]);
  }
  console.log("mapped");
  return output;
}
function wordCountReduce(input) {
  var acc = 0;
  for(var i = 0; i < input[1].length; i++) {
    acc += input[1][i];
  }
  console.log("reduced");
  return [input[0], acc];
}

socket.on('sendMap', function(job_id, data) {
  var output = [];
  for(var i = 0; i < data.length; i++) {
    output = output.concat(wordCountMap(data[i]));
  }
  socket.emit('sendMapped', job_id, output);
});
socket.on('sendReduce', function(job_id, data) {
  var output = [];
  for(var i = 0; i < data.length; i++) {
    output.push(wordCountReduce(data[i]));
  }
  socket.emit('sendReduced', job_id, output);
});
//socket.emit('sendMapped', );
//socket.emit('sendReduced', );