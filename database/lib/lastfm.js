var url = "http://ws.audioscrobbler.com/2.0/";
var params = {
    method:"library.gettracks",
    api_key:process.env.LASTFM_API_KEY,
    user:process.env.LASTFM_USERNAME,
    format:"json"
}; 
var request = require("request");
var async = require("async");
var db = require("../models");

db.Track.findAll().done(function(err, tracks) {
    var Artists = tracks.reduce(function(memo, track) {
	if (memo[track.album]) {
	    memo[track.album].push(track);
	} else {
	    memo[track.album] = [track];
	}
	return memo;
    }, {});
    var Grouped = Artists.reduce(function(memo, track) {
	if (memo[track.album]) {
	    memo[track.album].push(track);
	} else {
	    memo[track.album] = [track];
	}
	return memo;
    }, {});
    
    async.eachSeries(Object.keys(albums), function(album, callback) {
	params.album = album;
	console.log(params);
	request.get({url:url, json:true, qs:params}, function(err, res, body) {
	    if (body.tracks) {
		console.log(body.tracks);
	    }
	    callback();
	});
    }, function(err) {
	console.log("done");
    });
});