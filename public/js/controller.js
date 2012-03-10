var socket = io.connect('/');
var identifier = null;
socket.on('identifier', function (data) {
  identifier = data;
  socket.emit('register', 'controller');
});
socket.on('finished', function(job_id, job_type, num_clients, data) {
  var div = $('<li class="well">');
  if(job_type == 'anagram') {
    var out = [];
    for(var i = 0; i < data.length; i++) {
      out.push(data[i][1]);
    }
    div.text(JSON.stringify(out));
  } else {
    div.text(JSON.stringify(data));
  }
  div.prepend($("<h3>Job "+job_type+"("+job_id+") using "+num_clients+" clients</h3>"));
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
  $('#web-crawler').click(function() {
    var data = {
      type: 'webCrawler'
    };
    $.post('/', data,function(){});
    return false;
  });
  $('#anagram').click(function() {
    var data = {
      type: 'anagram'
    };
    $.post('/', data,function(){});
    return false;
  });
});