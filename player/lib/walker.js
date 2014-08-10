var fs = require("fs");
var util = require("util");
var async = require("async");
var path = require("path");
var EventEmitter = require("events").EventEmitter;
function Walker(filter) {
    this.filter = filter;
}
util.inherits(Walker, EventEmitter);
Walker.prototype.walk = function(directory) {
    var files = [];
    var self = this;
    var running = 1;
    var walk2 = function(directory) {
	fs.readdir(directory, function(err, results) {	    
	    if (err) {
		throw err;
	    }
	
	    async.each(results.map(function(result) {
		return path.join(directory, result);
	    }), function(result, callback) {
		fs.stat(result, function(err, stats) {
		    if (stats.isDirectory()) {
		//	self.emit("directory", result);
			
			running++;
			walk2(result);
			callback(null);
		    } else {
			if (self.filter) {
			    if (self.filter(result)) {
				files.push(result);
				self.emit("file", result);
			    }
			} else {
			    files.push(result);
			    self.emit("file", result);
			}
			callback();
		    }
		});
	    }, function(err) {
		running--;
		if (running == 0) {
		    self.emit("done");
		}
	    });
	});
    };
    walk2(directory);
};
module.exports = Walker;
if (require.main == module) {
    var w = new Walker(function(filename) {
	return true; //(filename.indexOf(".mp3") == filename.length-4);
    });
    w.walk("/home/micah/nplayer");
    w.on("file", function(file) {
	console.log(file);
    });
    w.on("done", function() {
	console.log("DONE:");
    });
}