var fs = require('fs');
var Utils = require("./utils").Utils;
var mongo = require('mongodb');

var client = new mongo.Db('grossogig', new mongo.Server("127.0.0.1", 27017, {}), {w: 1});

var city = process.argv[2];
var outPath = process.argv[3] || "/tmp/grossogig";
var now = new Date();

var outDir = outPath+"/"+(1900+now.getYear())+"/"+(now.getMonth()+1)+"/"+now.getDate();
outPath = outDir+"/"+city+"details_collected.json";

console.log("** LOADING JSON FROM: "+outPath);



if(fs.existsSync(outPath)) {
    var data = fs.readFileSync(outPath);
    var parsed = JSON.parse(data.toString());

    client.open(function(err, p_client) {

	if(err) {
	    console.log("(!!) Error opening connection to collection : "+err);
	} else {
	    client.collection(city, function(err, collection) {

		Utils.repeat(0, parsed.length, function(k,env) {
		    var floop = arguments.callee;
		    var details = parsed[env._i];
		    console.log("** Updating "+details.link);

		    cursor = collection.find({link: details.link});
		    cursor.toArray(function(err, gigs) {
			if(err) {
			    k(floop,env);
			} else {			    
			    var gig = gigs[0];
			    gig.details = details;
			    collection.update({link: gig.link}, gig, {}, function() {
				k(floop,env);
			    });
			}
		    });
		}, function() {
		    console.log("** EXIT!");
		    process.exit(0);
		});
	    });
	}

    });
}