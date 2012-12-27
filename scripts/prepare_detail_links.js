var mongo = require('mongodb');
var fs = require('fs');
var exec = require('child_process').exec;

var client = new mongo.Db('grossogig', new mongo.Server("127.0.0.1", 27017, {}), {w: 1});
var city = process.argv[2];
var outPath = process.argv[3] || "/tmp/grossogig";

var now = new Date();
var outDir = outPath+"/"+(1900+now.getYear())+"/"+(now.getMonth()+1)+"/"+now.getDate();
outPath = outDir+"/"+city+"_details.json";

client.open(function(err, p_client) {

    client.collection(city, function(err, collection) {
	var cursor = collection.find({details:{$exists:false}});
	cursor.toArray(function(err, gigs) {
	    console.log("* FOUND "+gigs.length+" events without details");
	    exec("mkdir -p "+outDir, function() {
		var f = fs.openSync(outPath,"w");
		var links = [];
		for(var i=0; i<gigs.length; i++)
		    links.push(gigs[i].link);
		console.log("* ABOUT TO WRITE");
		console.log(JSON.stringify(links));
		var data = new Buffer(JSON.stringify(links));
		fs.writeSync(f,data,0,data.length);
		console.log("* EXITING");
		process.exit(0);
	    });
	});
    });

});