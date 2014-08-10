

module.exports = MPD;
if (require.main == module) {
    var mpd = new MPD(function(callback, command) {
	console.log(command, arguments);
	callback(null, {});
    });
    mpd.listen(6700);

    console.log("listening");
}
