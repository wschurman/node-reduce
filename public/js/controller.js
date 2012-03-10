var socket = io.connect('/');
var identifier = null;
socket.on('identifier', function (data) {
  identifier = data;
  socket.emit('register', 'controller');
});
socket.on('finished', function(data) {
  console.log(data);
  $('#results').text(JSON.stringify(data));
});

$(function() {
  $('#button').click(function() {
    console.log('posting');
    $.post('/',function(){});
    return false;
  });
});