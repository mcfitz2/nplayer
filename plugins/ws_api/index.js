var fs = require("fs");
function getMethods(obj)
{
    var res = [];
    for(var m in obj) {
        if(typeof obj[m] == "function") {
            res.push(m)
        }
    }
    return res;
}
var WebSocketInterface = function(player, database) {
    function sendFile(path, req, res) {
	fs.readFile(__dirname +"/web-client"+ path, function (err, data) {
	    if (err) {
		res.writeHead(500);
		return res.end('Error loading '+path);
	    }
	    res.writeHead(200);
	    res.end(data);
	});
    }
    function handler (req, res) {
	if (req.url == "/") {
	    sendFile("/index.html", req, res);
	} else if (req.url.indexOf("covers") != -1) {
	    var id = parseInt(req.url.substring(req.url.lastIndexOf("/")+1));
	    database.db.Album.find(id).done(function(err, album) {
		if (album) {
		    res.writeHead(200, {
			"Content-Type":"image/png",
			"Content-Length":album.cover.length,
		    });
		res.end(album.cover);
		} else {
		    sendFile("/img/default-art.png", res, res);
		}
	    });
	} else {
	    sendFile(req.url, req, res);
	}	
    }
    
    var app = require('http').createServer(handler)
    var io = require('socket.io')(app);

    app.listen(8000);
    io.on('connection', function (socket) {
	console.log("connected");
	setInterval(function() {
	    player.cmd_getStatus(false, function(err, result) {
		if (result.state === "play") {
		    socket.emit("getStatus", err, result);
		}
	    });
	}, 1000);
	getMethods(player).forEach(function(method) {
	    if (method.indexOf("cmd") == 0) {
		socket.on(method.substring(4, method.length), function(args) {
		    args = Array.prototype.slice.call(arguments, 0) || [];
		    //console.log("GOT:", method, args);
		    args.push(function(err, result) {
		//	console.log("SENT:", method.substring(4, method.length), err, result);
			socket.emit(method.substring(4, method.length), err, result);
		    });
		    player[method].apply(player, args);
		});
	    } else {
	//	console.log(method);
	    }
	});
    });
};
module.exports = WebSocketInterface;
if (require.main == module) {
    var wsi = new WebSocketInterface(new require("../player")());
    
}
