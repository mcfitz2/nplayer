var net = require("net");
var first = true;
var commands = require("./commands");
var client = net.connect({port: 30006}, function() { //'connect' listener
    
});
client.setEncoding("utf8");
//client.pipe(process.stdout);
client.on("data", function(data) {

    if (first) {
	first = false;
	client.write("command_list_ok_begin\n");
	commands.forEach(function(command) {
	    
	    client.write(command+"\n");
	});
	client.write("command_list_end\n");
    } else {
	console.log(data);
    }
     
});
client.on('end', function() {
    console.log('client disconnected');
});