var HOST = 'localhost';
var PORT = 30005;
//var valid = require("./commands.js");
var net = require("net");
var VERSION = "0.18.1";
var util = require("util");
var EventEmitter = require("events").EventEmitter;
var byline = require("byline");
var async = require("async");


var MPDInterface = function(player, database) {
    var self = this;
    self.command_list = [];
    self.in_list = false;
    self.list_ok = false;
    self.commands = {
	config:function(callback) {
	    callback(null, {music_directory:process.env.MUSIC_DIR});
	},
	currentsong:function(callback) {
	    var response = {
		file: null, 
		Time: null,
		Artist: null, 
		AlbumArtist: null, 
		ArtistSort: null, 
		AlbumArtistSort: null,
		Title: null, 
		Album: null, 
		Track: null, 
		Date: null, 
		Disc: "1/1",
		Pos: player.index,
		Id: 0, 
	    };
	    player.status(function(err, status) {
		if (status) {
		    console.log(status, err);
		    response.Time = status.duration;
		    response.file = status.file;
		    response.Artist = status.metadata.artist;
		    response.AlbumArtist = status.metadata.album_artist;
		    //		response.AlbumArtistSort
		    response.Track = status.metadata.track;
		    response.Title = status.metadata.title;
		    response.Album = status.metadata.album;
		    response.Data = status.metadata.date;
		    callback(err, response);
		} else {
		    callback(err);
		}
	    });
	},
	add:function(callback, path) {
	    console.log(path);
	    player.add(path, function(err) {
		callback(null);
	    });
	},
	status:function(callback) {
	    player.status(function(err, status) {
		delete status.metadata;
		status.time = Math.round(status.position)+":"+Math.round(status.duration);
		callback(err, status);
	    });
	},
	play:function(callback) {
	    player.play(function(err) {
		callback(null);
	    });
	},
	pause:function(callback) {
	    player.pause(function(err) {
		callback(null);
	    });
	},
	stop:function(callback) {
	    player.stop(function(err) {
		callback(null);
	    });
	},
	next:function(callback) {
	    player.next(function(err) {
		callback(null);
	    });
	},
	prev:function(callback) {
	    player.next(function(err) {
		callback(null);
	    });
	},
	consume:function(callback, bool) {
	    player.consume(bool, function(err) {
		callback(null);
	    });
	},
	shuffle:function(callback, bool) {
	    player.shuffle(bool, function(err) {
		callback(null);
	    });
	},
	repeat:function(callback, bool) {
	    player.repeat(bool, function(err) {
		callback(null);
	    });
	},
	playlist:function(callback) {
	    player.getPlaylist(function(err, playlist) {
		callback(null);
	    });
	}
    };
    self.server = net.createServer(function(sock) {
	sock.setEncoding("utf8");
	var lines = byline.createStream(sock);
	sock.write("OK MPD "+VERSION+"\n");
	lines.on('data', function(data) {
	    self._handle(sock, data);
	});
	lines.on("error", function(err) {
	    console.log(err);
	});
	sock.on("error", function(err) {
	    console.log(err);
	});
    });
};
MPDInterface.prototype.listen = function(host, port) {
    this.server.listen(host, port);
};
MPDInterface.prototype._parse = function(line) {
    //    var self = this;
    var tokens = line.match(/'[^']*'|[^ ]+/g)||[];
    var args = tokens.slice(1, tokens.length).map(function(token) {
	return token.replace('"','').replace('"','');
    });
    return {name:tokens[0], args:args};
};
MPDInterface.prototype._handle = function(sock, line) {
    var self = this;
    var callback = function(err, response) {
	if (err) {
	    sock.write("ACK ["+err.errno+"@"+err.errindex+"] {"+err.command+"} "+err.message+"\n");
	} else {
	    if (response) {
		console.log(response);
		Object.keys(response).forEach(function(key) {
		    if (response[key] instanceof Array) {
			response[key].forEach(function(value) {
			    sock.write(key+": "+value+"\n");
			});
		    } else {
			sock.write(key+": "+response[key]+"\n");
		    }
		});
	    }
	    sock.write("OK\n");
	}
    };

    var command = self._parse(line);
    switch (command.name) {
    case "command_list_begin": 
	self.in_list = true;
	self.list_ok = false;
	break;
    case "command_list_ok_begin":
	self.in_list = true;
	self.list_ok = true;
	break;
    case "command_list_end":
	self.in_list = false;
	self.list_ok = false;
	self.command_list = self.command_list.map(function(command) {
	    return function(callback) {
		if (self.commands[command.name]) {
		    command.args.unshift(callback);
		    self.commands[command.name].apply(self, command.args);
		} else {
		    callback({error:0, errno:0, command:command.name, message:"Unknown command"}, {});
		}
	    };
	});
	
	async.series(self.command_list, function(err, results) {
	    self.command_list = [];
	    if (err) {
		sock.write("ACK ["+err.error+"@"+err.errno+"] {"+err.command+"} "+err.message+"\n");
	    } else {
		sock.write("OK\n");
	    }
	});
	break;
    default:
	if (self.in_list) {
	    console.log(command);
	    self.command_list.push(command);
	    if (self.list_ok) {
		sock.write("list_OK\n");
	    }
	} else {
	    console.log(command);
	    if (self.commands[command.name]) {
		command.args.unshift(callback);
		self.commands[command.name].apply(self, command.args);
	    } else {
		callback({error:0, errno:0, command:command.name, message:"Unknown command"}, {});
	    }
	}
    }
};    
module.exports = MPDInterface;
