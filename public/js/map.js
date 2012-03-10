var map = null;

$(document).ready(function() {
	var latlng = new google.maps.LatLng(37.646362,-115.751004);
	var myOptions = {
	  zoom: 18,
	  center: latlng,
	  mapTypeControl: false,
	  navigationControlOptions: {style: google.maps.NavigationControlStyle.SMALL},
	  mapTypeId: google.maps.MapTypeId.SATELLITE
	};
	map = new google.maps.Map(document.getElementById("mapcanvas"), myOptions);
	
	if (navigator.geolocation) {
	  navigator.geolocation.getCurrentPosition(success, error);
	} else {
	  console.log("no geo");
	}
});

function success(position) {
	var latlng2 = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
	map.setCenter(latlng2)
  var marker = new google.maps.Marker({
      position: latlng2, 
      map: map, 
      title:"You are here! (at least within a "+position.coords.accuracy+" meter radius)"
  });
	latitude = position.coords.latitude;
	longitude = position.coords.longitude;
}

function error(msg) {
  console.log(msg);
}

socket.on('sendAllLocations', function(data) {
	var latlng2 = new google.maps.LatLng(data.latitude, data.longitude);
	var marker = new google.maps.Marker({
      position: latlng2, 
      map: map, 
      title:"Friend"
  });
});


