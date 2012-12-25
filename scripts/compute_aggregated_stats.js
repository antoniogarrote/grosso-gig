var mongo = require('mongodb');

var client = new mongo.Db('grossogig', new mongo.Server("127.0.0.1", 27017, {}), {w: 1});
var city = process.argv[2];

client.open(function(err, p_client) {
    client.collection(city, function(err, collection) {
	var cursor = collection.find({});
	cursor.sort({"attendanceCount":-1})
	cursor.toArray(function(err,gigs){
	    var max = gigs[0].attendanceCount;
	    console.log("*** FOUND MAX "+max+" for "+city+" and "+gigs.length+" events");

	    var acum = {}, gig, tags;
	    for(var i=0; i<gigs.length; i++) {
		gig = gigs[i];
		tags = (gig.tags || []);
		for(var j=0; j<tags.length; j++)
		    acum[tags[j]] = (acum[tags[j]]||0)+1;
	    }
	    var tags = [];
	    for(var tag in acum)
		tags.push([tag,acum[tag]]);

	    tags = tags.sort(function(ta,tb){
		var result;
		if(ta[1] < tb[1]) {
		    return 1;
		} else if(ta[1] > tb[1]) {
		    return -1;
		} else {
		    return 0;
		}
	    });

	    var min=Math.round(gigs.length * 0.3);	    
	    acum = [];
	    for(var i=0; i<tags.length; i++) {
		if(tags[i][1] > 10)
		    acum.push(tags[i][0]);
	    }
	    
	    client.collection("stats", function(err, collection) {
		collection.update({"city": city},
				  {city: city,
				   max: max,
				   tags: acum},
				  {upsert: true},
				  function(err) {
				      if(err) {
					  console.log("ERROR UPDATING STATS");
				      } else {
					  console.log("*** FINISHED");
				      }
				      process.exit(0);
				  });
	    });
	});
    });
});