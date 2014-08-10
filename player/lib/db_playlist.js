PL_NAME = "default";
PL_ID = 1;
var groove = require("groove");
var async = require("async");
var DBPlaylist = function(db, callback) {
    var self = this;
    self.pl = groove.createPlaylist();
    self.db = db;
    self.db.Playlist.find({
	where:{
	    name:"default",
	    id:1
	    
	}, 
	include:[
	    {
		model:self.db.PlaylistItem,
		order:"index",
		as:"items",
		include:[{model:self.db.Track}]
	    }
	]
    }).done(function(err, playlist) {
	if (playlist) {
	    async.eachSeries(playlist.items, function(item, callback) {
		groove.open(item.track.path, function(err, file) {
		    self.pl.insert(file);
		    callback(err);
		});
	    }, function(err) {
		callback(err, self);
	    });
	} else {
	    self.db.Playlist.create({id:1, name:"default"}).done(function(err, pl) {
		callback(err, self);
	    });
	}
    });
}; 
DBPlaylist.prototype.indexOf = function(playlistItem) {

    return this.pl.items().indexOf(playlistItem);
}
DBPlaylist.prototype.items = function(callback) {
    return this.pl.items();
};
DBPlaylist.prototype.play = function(callback) {
    return this.pl.play();
};

DBPlaylist.prototype.pause = function(callback) {
    return this.pl.pause();
};

DBPlaylist.prototype.seek = function(playlistItem, position, callback) {
    return this.pl.seek(playlistItem, position);
};
DBPlaylist.prototype.insert = function(file, gain, peak, nextPlaylistItem, callback) {
    var self = this;
    self.db.Track.find({where:{path:file.filename}}).done(function(err, track) {
	self.db.PlaylistItem.create({TrackId:track.id, PlaylistId:PL_ID, index:self.pl.count()}).done(function(err, pl_item) {
	    if (err) throw err;
	    callback(null, self.pl.insert(file, gain, peak));
	});
    });
}
DBPlaylist.prototype.remove = function(playlistItem, callback) {
    callback(err, this.pl.remove(playlistItem));
};
DBPlaylist.prototype.position = function(callback) {
    var self = this;
    var position = this.pl.position();
	if (position.item.file.filename) {
	    self.db.Track.find({
		where:{path:position.item.file.filename}, 
		include:[
		    {model:self.db.Artist},
		    {model:self.db.Album, attributes:["title", "mbid", "year"]}
		]
	    }).done(function(err, track) {
		if (track) {
		    position.item.track = track.dataValues;
		}
		callback(err, position);
	    });
	} else {
	    callback(err, position);
	}

};
DBPlaylist.prototype.playing = function() {
    return this.pl.playing();
};
DBPlaylist.prototype.clear = function(callback) {
    var self = this;
    self.db.Playlist.destroy({PlaylistId:1}).done(function(err) {
	self.pl.clear();
	callback(err);
    });
};
DBPlaylist.prototype.count = function() {
    return this.pl.count();
};
DBPlaylist.prototype.gain = function(value) {
    if (value === undefined) {
	return this.pl.gain;
    } else if (value && value >= 0 && value <= 1) { 
	return this.pl.setGain(value);
    }
};
DBPlaylist.prototype.setItemGain = function(playlistItem, gain) {
    return this.pl.setItemGain(playlistItem, gain);
};
DBPlaylist.prototype.setItemPeak = function(playlistItem, peak) {
    return this.pl.setItemPeak(playlistItem, peak);
}; 
DBPlaylist.prototype.setFillMode = function(mode) {
    return this.pl.setFillMode(mode);
};
module.exports = DBPlaylist;