FB.init({
    appId: '391583264205223',
    status: true,
    cookie: true,
    xfbml: true
});

function sendPost() {
    FB.ui({
        method: 'feed',
        message: 'Post to your wall about Node Reduce!'
    }, function(response) {
        if (response != null) {
            alert('Thanks for posting about us!');
        }
    });
}

function sendMessage() {
    FB.ui({
        method: 'send',
        link: 'http://node-reduce.herokuapp.com/client',
        message: "Send a message to a friend about Node Reduce!"
    }, function(response) {
        if (response != null) {
            alert('Thanks for spreading the word!');
        }
    });
}

function sendInvites() {
    FB.ui({
        method: 'apprequests',
        message: "Check out Node Reduce!"
    }, function(response) {
        if (response != null && response.request_ids && response.request_ids.length > 0) {
            for (var i = 0; i < response.request_ids.length; i++) {
                alert("Invited: " + response.request_ids[i]);
            }
        }
    });
}

var socket = io.connect();
socket.on('connect', function() {
    socket.on('friend_using_app', function(friend) {
        var li = $('<li><a href="#"><img src="' + friend.pic_square + '" alt="' + friend.name + '" />' + friend.name + '</a></li>');
        li.click(function(){
          window.open('http://www.facebook.com/' + friend.uid);
        });
        $('#friends_using_app').append(li);
    });
});