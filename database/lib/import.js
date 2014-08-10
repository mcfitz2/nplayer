//require("longjohn");
var Walker = require("../lib/walker.js");
var db = require("../models");
var fs = require('fs');
var mm = require('musicmetadata');
var async = require("async");
var path = require("path");
var sanitize = require("sanitize-filename");
var mv = require('mv');
var groove = require("groove");
var request = require("request");
function sortImageSizes(images) {
    var order = ["small", "medium", "mega", "extralarge", "large"];
    return images.sort(function(a, b) {
	return order.indexOf(a.size) >= order.indexOf(b.size) ? -1: 1;
    });
};
function fetchArt(params, callback) {
    params.api_key = "cb22d75fa2ed1f207234547449b57c51";
    params.method = "album.getinfo";
    params.format = "json";
    console.log("Fetching art for "+params.album+" by "+params.artist);
    request.get({url:"http://ws.audioscrobbler.com/2.0/", qs: params, json:true}, function(err, res, body) {
	var image = sortImageSizes(body.album.image)[0]["#text"];
	request.get({url:image, encoding:null}, function(err, res, imageBlob) {
	    callback(err, imageBlob);
	});
    });
};
function createArtist(artist, callback) {
    db.Artist.find({where:{name:artist.name}}).done(function(err, record) {
	if (err) throw err;
	if (record) {
	    callback(null, record);
	} else {
	    db.Artist.create(artist).done(function(err, record) {
		if (err && err.errno && err.errno == 19) { //ignore sql constraint errors
		    err = null;
		} else {
		    console.log(err);
		    throw err;
		}
		
		callback(err, record);
	    });
	}
    });	    
}
function createAlbum(album, callback) {
    db.Album.find({where:{
	ArtistId:album.ArtistId,
	title:album.title, 
	year:album.year
    }}).done(function(err, record) {
	var params = {};
	params.artist = album.artist;
	params.album = album.title;
	if (err) throw err;
	if (record) {
	    if (record.cover == null) {
		fetchArt(params, function(err, image) {
		    record.cover = image;
		    record.save().done(function(err, record) {
			callback(null, record);
		    });
		});
	    } else {
		callback(null, record);
	    }
	} else {
	    fetchArt(params, function(err, image) {
		if (image) {
		    album.cover = image;
		}
		db.Album.create(album).done(function(err, record) {
		    if (err && err.errno && err.errno == 19) { //ignore sql constraint errors
			err = null;
		    } else {
			throw err;
		    }
		    callback(err, record);
		});
	    });
	}
    });
};

module.exports.importFile = function(filename, callback) {
    groove.open(filename, function(err, file) {
	var tag = file.metadata();
	var artist = {
	    name: tag.album_artist,
	    mbid: tag["MusicBrainz Album Artist Id"] || null,
	};
	var album = {
	    title:tag.album,
	    year:tag.date,
	    mbid:tag["MusicBrainz Album Id"] || null,
	    
	};
	var track = {
	    title:tag.title,
//	    mbid:tag.
	    duration:file.duration(),
	    AcoustId:tag["Acoustid Id"]||null,
	    tracknumber:tag.track.split("/")[0],
	    discnumber:tag.disc.split("/")[0],
//	    bitrate
	    albumArtist:tag.album_artist
	}
	track.path = path.join(process.env.MUSIC_DIR, 
				sanitize(artist.name), 
				sanitize(album.title), 
				track.tracknumber+". "+sanitize(track.title)+".mp3");
	createArtist(artist, function(err, artist) {
	    if (err) {
		console.log("artist", err);
		throw err;
	    }
	    if (artist == undefined || artist == null) {
		console.log(">>>>>", err, artist);
	    }
		
	    album.ArtistId = artist.id;
	    album.artist = artist.name;
//	    console.log(artist.dataValues);
	    createAlbum(album, function(err, album) {
		if (err) {
		    console.log("createAlbum", err);
		    throw err;
		}
		track.ArtistId = artist.id;
		track.AlbumId = album.id;
//		console.log(album.dataValues);
		db.Track.create(track).done(function(err, record) {
		    if (!err) {
			//console.log(track.title);    
			mv(filename, track.path, {mkdirp:true}, function(err) {
			    if (err) {
				record.destroy();
				callback(err);
			    } else {
				callback(null);
			    }
			});
		    } else {
			if (err.errno && err.errno == 19) { //ignore sql constraint errors
			    err = null;
			}
			callback(err);
		    }
		});
	    });
	});
    });
}; 

module.exports.importDirectory = function(directory, callback) {
    if (directory) {
	var walker = new Walker(function(filename) {
	    return filename.indexOf(".mp3") == filename.length-4;
	});
	var filenames = [];
	walker.walk(directory);
	walker.on("file", function(file) {
//	    console.log(file);
	    filenames.push(file);
	});
	walker.on("done", function() {
	    async.each(filenames, function(filename, callback) {
		module.exports.importFile(filename, function(err) {
		    if (err) {
			console.log(err);
		    }
		    //console.log(filename);
		    callback(err);
		});
	    }, function(err) {
		callback(err);
	    });
	});
    } else {
	console.log("INVALID DIRECTORY");
	callback();
    }

};

