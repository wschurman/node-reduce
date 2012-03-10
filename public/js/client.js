var socket = io.connect('/');
var identifier = null;
socket.on('identifier', function (data) {
  console.log(data);
  identifier = data;
});

// Return time in seconds to process
function getSpeed() {
  var start = (new Date().getTime());
  var a = 0;
  for(var i = 0; i < 1000000000; i++) {
    a++;
  }
  var duration = (new Date().getTime()) - start;
  console.log(duration);
  return duration;
}
socket.emit('sendSpeed', getSpeed());

function wordCountMap(input) {
  return input.split(' ');
}
function wordCountReduce(input) {
  for(i in input) {
    input[i] = input[i].length;
  }
  return input;
}

socket.on('sendMap', function(data) {
  socket.emit('sendMapped', wordCountMap(data));
});
socket.on('sendReduce', function(data) {
  socket.emit('sendReduced', wordCountReduce(data));
});
//socket.emit('sendMapped', );
//socket.emit('sendReduced', );