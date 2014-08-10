var db = require("../models");
var async = require("async");
var utils = require("./utils");
var fs = require("fs");
var taglib = require("taglib");
function compare(a, b) {
    return Object.keys(a).every(function(key) {
	return ((b[key] !== undefined) && (b[key] === a[key]));
    });
}
module.exports.syncFile = function(file, callback) {
    db.Track.find({where:{path:file}}).done(function(err, track) {
	module.exports.syncTrack(track, callback);
    });
};
module.exports.syncTrack = function(track, callback) {
    fs.exists(track.path, function(exists) {
	if (exists) {
	    taglib.tag(track.path, function(err, metadata) {
		metadata.tracknumber = metadata.track;
		var keys = ["tracknumber","artist", "album", "year", "title"];
		var save = false;
		keys.forEach(function(key) { 
		    if (track[key] != metadata[key]) {
			metadata[key] = track[key];
			save = true;
		    }
		});
		if (save) {
			console.log("Restoring metadata", track.path);
		    metadata.save(function(err) {
			    callback(err);
		    });
		} else {
		    callback(null);
		}
	    });
	} else {
	    track.destroy().done(function(err) {
		console.log("Destroyed track");
	    });
	}
    });
};
module.exports.syncAll = function(callback) {
    //1. Remove deleted files from the DB
    //2. Fix changed metadata
    //3. Report on files with changed hashes
    db.Track.findAll().done(function(err, tracks) {
	console.log(err);
	async.eachLimit(tracks, 10, module.exports.syncTrack, function(err) {
	    callback(err);
	});
    });
};

if (require.main == module) {
    module.exports.syncAll(function(err) {
	console.log(err);
    });
}