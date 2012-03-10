var socket = io.connect('/');
var identifier = null;
socket.on('identifier', function (data) {
  identifier = data;
  socket.emit('register', 'controller');
});
socket.on('finished', function(job_id, data) {
  $('#results').text("Job "+job_id + ": " + JSON.stringify(data));
});

$(function() {
  $('#button').click(function() {
    console.log('posting');
    var data = {
      input: $('#inputdata').val()
    };
    $.post('/', data,function(){});
    return false;
  });
});