FB.getLoginStatus(function(response) {
    if (response.status == 'connected' || response.status == 'not_authorized') {
        $('fbLogin').hide();
        $('fbLogout').show();
        $('shareList').show();
    } else {
        $('fbLogin').show();
        $('fbLogout').hide();
        $('shareList').hide();
    }
});