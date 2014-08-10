var EventEmitter = require("events").EventEmitter;
var util = require("util");
var groove  = require("groove");
var async = require("async");
var fs = require("fs");
var Walker = require("./lib/walker.js");
var DBPlaylist = require("./lib/db_playlist.js");
var Player = function(database, callback) {
    var self = this;
    self.events = new EventEmitter();    
    self.player = groove.createPlayer();
    self.db = database.db;
    self.state = "stop";
    self.index = 0;
    self._consume = false;
    self._repeat = false;
    self._shuffle =  false;
    self.currentsong = {};
    
    new DBPlaylist(database.db, function(err, playlist) {
	self.playlist = playlist;
	self.cmd_getPlaylist(function(err, playlist) {
	    console.log(playlist.map(function(meta) {
		return meta.title;
	    }));
	});
	setInterval(function() {
	    self.emit("timer");
	}, 1000);
	callback(err, self);

    });
};
util.inherits(Player, EventEmitter);
Player.prototype.cmd_play = function(callback) {
    var self = this;
    if (self.playlist.items().length > 0) {
	if (self.state == "stop") {
	    self.player.attach(self.playlist.pl, function(err) {
		self.state = "play";
		self.playlist.play();
		self.emit("statechange");
		callback(null);
	    });
	} else {
	    self.state = "play";
	    self.playlist.play();
	    this.emit("statechange");
	    callback(null);
	}
    } else {
	callback(null);
    }
};
Player.prototype.cmd_pause = function(callback) {
    var self = this;
    if (self.state == "pause") {
	self.state = "play";
	self.playlist.play();
	this.emit("statechange");
	
    } else if (self.state == "play") {
	self.state = "pause";
	self.playlist.pause();
	this.emit("statechange");
    }

    callback(null);
};
Player.prototype.cmd_next = function(callback) {
    this.index = (this.index+1) % this.playlist.items().length;
    this.playlist.seek(this.playlist.items()[this.index], 0);
    this.emit("songchange", this.currentsong);
    callback(null);
};
//Player.prototype.cmd_stop = function(callback) {
//    this.state = "stop";
//    this.emit("statechange", "stopped");
//    this.player.detach(callback);
//    callback(null);
//};
Player.prototype.cmd_prev = function(callback) {
    if (this.index > 0) {
	this.index--;
	this.playlist.seek(this.playlist.items()[this.index], 0);
    }
    callback(null);
};
Player.prototype.cmd_clear = function(callback) {
    var self = this;
    self.cmd_pause(function(err) {
	self.playlist.clear(callback);
    });

};
Player.prototype.cmd_add = function(path, callback) {
    var self = this;
    fs.stat(path, function(err, stat) {
	if (err) {
	    callback(err);
	} else {
	    if (stat.isFile()) {
		groove.open(filename, function(err, file) {
		    self.playlist.insert(file, undefined, undefined, undefined, function(err) {
			callback(null);
		    });
		});
	    } else {
		var walker = new Walker(function(filename) {
		    return filename.indexOf(".mp3") == filename.length-4;
		});
		var pathnames = [];
		walker.walk(path);
		
		walker.on("file", function(file) {
		    pathnames.push(file);

		});
		walker.on("done", function() {
		    async.map(pathnames, function(file, callback) {
			groove.open(file, function(err, file) {
			    callback(err, file);
			});
		    }, function(err, openFiles) {
			openfFiles = openFiles.sort(function(a, b) {
			    var alphadata = a.metadata();
			    var betadata = b.metadata();
			    if (alphadata.artist == betadata.artist) {
				if (alphadata.album == betadata.album) {
				    var atrack = parseInt(alphadata.track.split("/")[0]);
				    var btrack = parseInt(betadata.track.split("/")[0]);
				    if (atrack == btrack) {
					return 0;
				    } else {
					return atrack > btrack ? 1:-1;
				    }
				} else {
				    return alphadata.album > betadata.album ? 1:-1;
				}
			    } else {
				return alphadata.artist > betadata.artist ? 1:-1;
			    }
			});
			async.eachSeries(openFiles, function(openFile, callback) {
			    self.playlist.insert(openFile, undefined, undefined, undefined, function(err) {
				if (err) { console.log(err) };
				callback(err);
			    });
			}, function(err) {
			    callback(err);
			});
		    });
		});
	    }
	}
    });
};
Player.prototype.cmd_setConsume = function(bool, callback) {
    if (bool !== undefined) {
	this._consume = bool;
    } else {
	this._consume = !this._consume;
    }
    callback(null);
};
Player.prototype.cmd_setShuffle = function(bool, callback) {
    if (bool !== undefined) {
	this._shuffle = bool;
    } else {
	this._shuffle = !this._shuffle;
    }
    callback(null);
};
Player.prototype.cmd_setRepeat = function(bool, callback) {
    if (bool !== undefined) {
	this._repeat = bool;
    } else {
	this._repeat = !this._repeat;
    }
    callback(null);
};
Player.prototype.cmd_getVolume = function(callback) {
    callback(null, this.playlist.gain());
};
Player.prototype.cmd_setVolume = function(percent, callback) {
    this.playlist.gain(percent);
    callback(null);
};
//Player.prototype.single = function() {};
Player.prototype.cmd_seek = function(index, callback) {
    if (index >= 0) {
	this.index = index;
	this.playlist.seek(this.playlist.items()[this.index], 0);
    }
    callback(null);
};
//Player.prototype.delete = function(trackOrIndex) {};
//Player.prototype.move = function(trackOrIndex, position) {};
Player.prototype.cmd_getPlaylist = function(callback) {
    callback(null, this.playlist.items().map(function(item) {
	return item.file.metadata();
    }));
};
/*Player.prototype.playlistfind = function() {};
Player.prototype.playlistid = function() {};
Player.prototype.playlistinfo = function() {};
Player.prototype.playlistsearch = function() {};
Player.prototype.plchanges = function() {};
Player.prototype.plchangesposid = function() {};
Player.prototype.prio = function() {};
Player.prototype.prioid = function() {};
Player.prototype.swap = function() {};
Player.prototype.swapid = function() {};
Player.prototype.addtagid = function() {};
Player.prototype.cleartagid = function() {};
Player.prototype.listplaylist = function() {};
Player.prototype.listplaylistinfo = function() {};
Player.prototype.listplaylists = function() {};
Player.prototype.load = function() {};
Player.prototype.playlistadd = function() {};
Player.prototype.playlistclear = function() {};
Player.prototype.playlistdelete = function() {};
Player.prototype.playlistmove = function() {};
Player.prototype.rename = function() {};
Player.prototype.rm = function() {};
Player.prototype.save = function() {};
Player.prototype.count = function() {};
Player.prototype.find = function() {};
Player.prototype.findadd = function() {};
Player.prototype.list = function() {};
Player.prototype.listall = function() {};
Player.prototype.listallinfo = function() {};
Player.prototype.listfiles = function() {};
Player.prototype.lsinfo = function() {};
Player.prototype.readcomments = function() {};
Player.prototype.search = function() {};
Player.prototype.searchadd = function() {};
Player.prototype.searchaddpl = function() {};
Player.prototype.update = function() {};
Player.prototype.rescan = function() {};
Player.prototype.sticker = function() {};
Player.prototype.close = function() {};
Player.prototype.kill = function() {};
Player.prototype.idle = function() {};
*/
Player.prototype.cmd_getStatus = function(includePlaylist, callback) {
    var metadata = {};
    var file = "";
    var self = this;
    self.playlist.position(function(err, position) {
	var current = position.item;
	var duration = 0;
	if (current && current.file) {
	    metadata = current.file.metadata();
	    file = current.file.filename;
	    duration = current.file.duration();
	}
	callback(null, {
	    state:self.state, 
	    duration:duration,
	    position:position.pos,
	    current: position.item.track,
	    repeat: self._repeat,
	    random: self._random,
	    single: self._single,
	    consume: self._consume,
	    playlistlength: self.playlist.items().length,
	    song: self.index,
	    elapsed: position.pos,
	    nextsong: self.index+1,
	    volume:self.playlist.gain(),
	    playlist: self.playlist.items().map(function(item) {
		return item.file.metadata();
	    }),
	});
    });
};
Player.prototype.cmd_getStats = function(callback) {};
module.exports = Player;


if (require.main == module) {

    var database = new Database(function(err, db) {
	var player = new Player(db, function(err) {
	    
	});
    });
}
