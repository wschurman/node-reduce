$(".alert").alert();

var socket = io.connect('/');
var identifier = null;
socket.on('identifier', function (data) {
  identifier = data;
  socket.emit('register', 'controller');
});
socket.on('finished', function(job_id, job_type, num_clients, data) {
	$("#pbar > .bar").animate({
		width: '100%'
	});
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
	function resetProgressbar() {
		$("#pbar > .bar").css('width', '10%');
		/*$("#pbar > .bar").animate({
			width: '16%'
		});*/
	}
	
  $('#word-count').click(function() {
		resetProgressbar();
    var data = {
      type: 'wordCount'
    };
    $.post('/', data, function(data){
			if (data.error) {
				$("#errortext").text(data.error);
				$(".alert").slideDown();
			}
		});
    return false;
  });
  $('#inverted-index').click(function() {
		resetProgressbar();
    var data = {
      type: 'invertedIndex'
    };
    $.post('/', data, function(data){
			if (data.error) {
				$("#errortext").text(data.error);
				$(".alert").slideDown();
			}
		});
    return false;
  });
  $('#web-crawler').click(function() {
		resetProgressbar();
    var data = {
      type: 'webCrawler'
    };
    $.post('/', data, function(data){
			if (data.error) {
				$("#errortext").text(data.error);
				$(".alert").slideDown();
			}
		});
    return false;
  });
  $('#anagram').click(function() {
		resetProgressbar();
    var data = {
      type: 'anagram'
    };
    $.post('/', data, function(data){
			if (data.error) {
				$("#errortext").text(data.error);
				$(".alert").slideDown();
			}
		});
    return false;
  });
});