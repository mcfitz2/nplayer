var fs = require("fs");
var Walker = require("./lib/walker.js");
//var sync = require("./lib/sync");
var EventEmitter = require("events").EventEmitter;
var util = require("util");
var _ = require("lodash");
var Database = function(callback) {
    var self = this;
    self.db = require("./models");
    self.db
	.sequelize
	.sync({force:false})
	.complete(function(err) {
	    if (err) {
		callback(err, null);
	    } else {
		callback(null, self);
	    }
	    console.log("importing!");
	    self.import(process.env.MUSIC_DIR, function(err) {
		
		//callback(err, self);
	    });
	});   
};
util.inherits(Database, EventEmitter);
Database.prototype.import = function(path, callback) {
    fs.stat(path, function(err, stat) {
	if (stat) {
	    var imp = require("./lib/import");
	    if (stat.isDirectory) {
		imp.importDirectory(path, callback);
	    } else if (stat.isFile) {
		imp.importFile(path, callback);
	    } else {
		callback(new Error("Path not a file or directory"));
	    }
	} else {
	    callback(err);
	}
    });
};
Database.prototype.sync = function(path, callback) {
    if (arguments.length == 1 && typeof path == 'function') { //no path given, syncall
	self.sync.syncAll(callback);
    } else {
	fs.stat(path, function(err, stat) {
	    if (stat && stat.isFile()) {
		sync.syncFile(path, callback);
	    } else {
		callback(err || new Error("path must be a file"));
	    }
	});
    }
};
Database.prototype.fetchLastFM = function(username, callback) {
    console.log("Not implemented yet");
    callback(null, null);
};
var Track = function(trackModel) {
    var self = this;
    _.extend(self, [trackModel]);
};
Database.prototype.queryTracks = function(query, callback) {
    this.db.Track.findAll(query).done(function(err, tracks) {
	if (err) {
	    callback(err, []);
	} else {
	    tracks = tracks.map(function(track) {
		return new Track(track);
	    });
	    callback(err, tracks);
	}
    });
};
module.exports = Database;

if (require.main === module) {
    var d = new Database(function(err, db) {
	db.import("/home/micah/dev/nplayer/music", function(err) {
	    console.log(err)
	});
    });
    
}
