var socket = io.connect('/');
var identifier = null;
socket.on('identifier', function (data) {
  identifier = data;
  socket.emit('register', 'controller');
});
socket.on('finished', function(job_id, data) {
  var div = $('<div>');
  div.text("Job "+job_id + ": " + JSON.stringify(data));
  $('#results').prepend(div);
});

$(function() {
  $('#word-count').click(function() {
    var data = {
      type: 'wordCount'
    };
    $.post('/', data,function(){});
    return false;
  });
  $('#inverted-index').click(function() {
    var data = {
      type: 'invertedIndex'
    };
    $.post('/', data,function(){});
    return false;
  });
});