//require("longjohn");
process.env.MUSIC_DIR = "/home/micah/dev/nplayer/music";
var Database = require("./database");
var Player = require("./player");
//var MPD_API = require("./mpd_api");
var WS_API = require("./plugins/ws_api");
if (require.main == module) {
    var database = new Database(function(err, db) {
	console.log("db connected");
	var player = new Player(db, function(err, player) {
	    console.log("player created");
	    //	var mpd_api = new MPD_API(player, db);
	    //	mpd_api.listen(6700)
	    //	console.log("MPD interface started");
	    var ws_api = new WS_API(player, db);
	});
    });
}
