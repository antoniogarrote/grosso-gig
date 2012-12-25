var mongo = require('mongodb');

var client = new mongo.Db('grossogig', new mongo.Server("127.0.0.1", 27017, {}), {w: 1});
var city = process.argv[2];

var findArtist = function(name, cb) {
    client.collection("artists", function(err, collection) {
	name = name.toLowerCase();
	collection.findOne({findme: name}, function(err,result){
	    cb(result);
	});
    });
};


client.open(function(err, p_client) {

    findArtist("Billi Talent", function(res) {
	console.log("RES:");
	console.log(res);
    });
});