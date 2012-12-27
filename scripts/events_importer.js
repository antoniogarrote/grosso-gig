var fs = require('fs');
var Utils = require("./utils").Utils;
var mongo = require('mongodb');
var crypto = require('crypto');

var client = new mongo.Db('grossogig', new mongo.Server("127.0.0.1", 27017, {}), {w: 1});

var city = process.argv[2];
var outPath = process.argv[3] || "/tmp/grossogig";
var now = new Date();

outPath = outPath+"/"+(1900+now.getYear())+"/"+(now.getMonth()+1)+"/"+(now.getDate()+"/"+city+".json");

console.log("** LOADING JSON FROM: "+outPath);

if(fs.existsSync(outPath)) {
    var data = fs.readFileSync(outPath);
    var parsed = JSON.parse(data.toString());
    var months = [];
    for(var m in parsed) {
	console.log("FOUND MONTH: "+m);
	months.push(m);
    }

    client.open(function(err, p_client) {

	if(err) {
	    console.log("(!!) Error opening connection to collection : "+err);
	} else {
	    client.collection(city, function(err, collection) {
		
		Utils.repeat(0, months.length, function(k,env) {	
		    var floop = arguments.callee;
		    var events = parsed[months[env._i]];
		    console.log("\n\n\nMONTH: "+months[env._i]);

		    Utils.repeat(0, events.length, function(ki,envi) {
			var event = events[envi._i];
			var floopi = arguments.callee;

			event.date = new Date(event.date);
     			event.month = event.date.getMonth()+1;
     			event.year = event.date.getYear()+1900;
     			event.multi = event.artist.split(",").length>1;
     			console.log(event.attendanceCount);
     			console.log(event.date);
     			console.log(event.artist);
     			     
     			collection.update({"link":event["link"]}, event, {upsert:true}, function(err) {
     			    if(err)
     			     	console.log("(!!) ERROR INSERTING/UPDATING DOCUMENT");
     			     
     			    ki(floopi, envi);
     			});
		    }, function(){
			console.log("Finished with month "+months[env._i]);
			k(floop,env);
		    });
		},function() {
		    console.log("*** FINISHED!");
		    process.exit();
		});

	    });
	}
    });

} else {
    console.log("(!!) COULD NOT LOAD DATA AT "+outPath);
}



