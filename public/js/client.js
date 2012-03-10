if(!window.console) {
  console.log = function(){};
}

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
  //console.log(duration);
  return duration;
}

socket.on('sendMap', function(job_id, map_function, combine_function, data) {
  var output = [];
  var map = eval('('+map_function+')');
  var combine = eval('('+combine_function+')');
  var mapissue = data.length;
  for(var i = 0; i < data.length; i++) {
    if(data[i]) {
      map(data[i], function(out) {
        output = output.concat(out);
        mapissue--;
        if(mapissue == 0) {
          output = combine(output);
          console.log("mapped");
					$("#mapnum").text(parseInt($("#mapnum").text()) + 1);
          socket.emit('sendMapped', job_id, output);
        }
      });
    } else {
      mapissue--;
      if(mapissue == 0) {
        output = combine(output);
        console.log("mapped");
        socket.emit('sendMapped', job_id, output);
      }
    }
  }

});
socket.on('sendReduce', function(job_id, reduce_function, data) {
  var output = [];
  var reduce = eval('('+reduce_function+')');
  for(var i = 0; i < data.length; i++) {
    if(data[i]) {
      output.push(reduce(data[i]));
    }
  }
  console.log("reduced");
	$("#reducenum").text(parseInt($("#reducenum").text()) + 1);
  socket.emit('sendReduced', job_id, output);
});