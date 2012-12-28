var gm = require('googlemaps');
var mongo = require('mongodb');
var Utils = require("./utils").Utils;
var crypto = require('crypto');
var exec = require('child_process').exec;
var path = require('path');

var city = process.argv[2];

gm.config({key:"AIzaSyD-RkWFQkR_Xkz0uGusK73oXwBb6ZBufYY"});


var locations = {
    london: "UK",
    barcelona: "Spain",
    madrid: "Spain",
    berlin: "Germany",
    rome: "Italy",
    paris: "France",
    hamburg: "Germany"
};

var cache = {};

var client = new mongo.Db('grossogig', new mongo.Server("127.0.0.1", 27017, {}), {w: 1});
client.open(function(err, p_client) {

    var locateEvent = function(event,cb) {

	if(event.location) {
	    if(cache[event.location]) {
		console.log("CACHE HIT!");
		cb(cache[event.location]);
	    } else {
		if(event.details && event.details.address) {
		    var locationString = event.details.address;
		    console.log(locationString);
		    gm.geocode(locationString, function(err,result) {
			if(result.results.length > 0)
			    locationString = result.results[0].formatted_address;
			var markers = [
			    { 'location': locationString }
			];
			var styles = [
			    { 'feature': 'road', 'element': 'all', 'rules': 
			      { 'hue': '0x00ff00' }
			    }
			];
			var url = gm.staticMap(locationString, 15, "1000x400", false, false, 'roadmap', markers, styles, []);
			var md5sum = crypto.createHash('md5');
			md5sum.update(url);
			var mapURL = '/images/maps/'+md5sum.digest("hex")+'.png';
			var imagePath = path.resolve(__dirname, '../public'+mapURL);
			cache[event.location] = mapURL;
			console.log("SAVING: curl \""+url+"\" > "+cache[event.location]);
			exec("curl \""+url+"\" > "+imagePath,function() {
			    cb(mapURL);
			});			
		    });
		} else {
		    cb(null);
		}

	    }
	} else {
	    cb(null);
	}
    };

    
    client.collection(city, function(err, collection) {
	var cursor = collection.find({});
	cursor.toArray(function(err,gigs) {
	    Utils.repeat(0,gigs.length, function(k,env) {
		var floop = arguments.callee;
		var gig = gigs[env._i];
		console.log("*** trying to geoloc "+gig.link);
		locateEvent(gig, function(url) {
		    if(url) {
			console.log("* SUCCESS "+url);
			gig.map = url;
			collection.update({link: gig.link}, gig, {}, function() {
			    k(floop, env);
			});
		    } else {
			k(floop, env)
		    }
		});
	    }, function(){
		console.log("** FINISHED!!");
		process.exit(0);
	    });
	});
    });

});
