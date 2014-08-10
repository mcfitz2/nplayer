function init(socket) {
    $.each(["clear", "add", "play", "pause", "next", "prev"], function(index, event) {
	socket.on(event, function(err, response) {
	    console.log(event);
	    socket.emit("getStatus", true);
	});
    });
}
function registerButton(id, command) {
    document.getElementById(id).addEventListener("click", function() { 
	socket.emit(command); 
    });
}
function toHMS(time) {
    var hours = Math.floor(time / 3600);
    time = time - hours * 3600;
    var minutes = Math.floor(time / 60);
    var seconds = time - minutes * 60;
    minutes = hours <= 0 ? minutes : "0"+minutes;
    seconds = Math.round(seconds) > 9 ? Math.round(seconds) : "0"+Math.round(seconds);
    hours = hours > 0 ? hours+":" : "";
    return hours+minutes+":"+seconds;
}

var socket = io('http://localhost:8000');  
init(socket);
var sliderValue = 0;
var slider = $('#volume-slider').slider({
    min:0, 
    max:1,
    step:0.01,
    orientation:"vertical",
    reversed:true,
    id:"volume-slider-created",
//    tooltip:'hide',
    formater:function(value) {
	return Math.round((value*100),2)+"%";
    }
}).on('slideStop', function() {
    if (sliderValue != slider.getValue()) {
	socket.emit("setVolume", slider.getValue() || 0.000000001);
	sliderValue = slider.getValue();
    }
}).data('slider');
socket.emit("getStatus", true);
socket.emit("getVolume");
socket.on("getVolume", function(err, response) {
    console.log(response);
    $("#volume-slider").slider("setValue", response);
});
socket.on("getStatus", function(err, response) {
    if (response.playlist) {
	$("#playlist-table").html("");
	$.each(response.playlist, function(index, track) {
	    var row = $("<tr><td>"+track.track.split("/")[0]+"</td><td>"+track.title+"</td><td>"+track.artist+"</td><td>"+track.album+"</td></tr>");
	    if (index == response.song) {
		row.css("color", "red");
	    }
	    $("#playlist-table").append(row);
	});
	$("#current-artist").html(response.current.artist.name);
	$("#current-album").html(response.current.album.title);
	$("#current-title").html(response.current.title);
	$("#album-art").attr("src", "/covers/"+response.current.AlbumId);
    }

    $("#song-progress").css("width", Math.round(response.position/response.duration*100)+"%");
    $("#song-progress > span").html(toHMS(response.position)+" / "+toHMS(response.duration));
    console.log(response);
});
socket.on("add", function(err, response) {
    socket.emit("getStatus", true);
});

document.getElementById("add").addEventListener("click", function() { 
    socket.emit("add", "/home/micah/dev/nplayer/music/"); 
    socket.emit("getStatus", true);
});
registerButton("play", "play");
registerButton("pause", "pause");
registerButton("clear", "clear");
registerButton("next", "next");
registerButton("prev", "prev");
