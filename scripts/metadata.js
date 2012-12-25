var LastFmNode = require('lastfm').LastFmNode;
var mongo = require('mongodb');
var Utils = require("./utils").Utils;

var client = new mongo.Db('grossogig', new mongo.Server("127.0.0.1", 27017, {}), {w: 1});
var city = process.argv[2];

var saveArtist = function(artist, cb) {
    client.collection("artists", function(err, collection) {
	artist.findme = artist.name.toLowerCase();
	collection.update({findme: artist.findme}, artist, {upsert: true}, function(){
	    cb();
	});
    });
};

var findArtist = function(name, cb) {
    client.collection("artists", function(err, collection) {
	name = name.toLowerCase();
	collection.findOne({findme: name}, function(err,result){
	    cb(result);
	});
    });
};

client.open(function(err, p_client) {

    var lastfm = new LastFmNode({
	api_key: 'c3d9c8473fa697e6b588657e56731f5e',    // sign-up for a key at http://www.last.fm/api
	secret: 'df73a860d4137e67bfef75658772091d'
    });

    var search = function(artist, cb) {
	if(artist.indexOf(",") > -1)
	    artist = artist.split(",")[0];

	var request = lastfm.request("artist.search",{artist:artist, autocorrect:1});

	request.on('success',function(res) {
	    //console.log("SUCCESS!");
	    var topArtist = res.results.artistmatches.artist[0];
	    findArtist(topArtist.name, function(result) {

		if(result == null) {
		    console.log(" * cache miss for "+topArtist.name);
		    var args = {autocorrect:1};
		    if(topArtist.mbid) 
			args.mbid = topArtist.mbid;
		    else
			args.artist = topArtist.name;

		    var request = lastfm.request("artist.getInfo",args);
		    request.on('success', function(artistInfoRes) {
			var artistInfo = artistInfoRes.artist;
			var tags = [];
			if(artistInfo.tags && artistInfo.tags.tag && artistInfo.tags.tag.constructor == Array) {
			    for(var i=0; i<artistInfo.tags.tag.length; i++)
				tags.push(artistInfo.tags.tag[i].name);
			} else {
			    tags = ["pop"];
			}
			
			saveArtist(artistInfo, function() {
			    console.log("*** caching "+topArtist.name);
			    cb({mbid: artistInfo.mbid,
				lastfmLink: artistInfo.url,
				images: artistInfo.image,
				listeners: artistInfo.stats.listeners,
				playcount: artistInfo.stats.playcount,
				tags: tags });
			});
		    });

		    request.on('error', function(res) {
			//console.log("ERROR 2!");
			//console.log(res);
			cb(null);
		    });
		} else {
		    console.log(" * cache hit "+topArtist.name);
		    var artistInfo = result;
		    var tags = [];
		    if(artistInfo.tags && artistInfo.tags.tag && artistInfo.tags.tag.constructor == Array) {
			for(var i=0; i<artistInfo.tags.tag.length; i++)
			    tags.push(artistInfo.tags.tag[i].name);
		    } else {
			tags = ["pop"];
		    }
			
		    cb({mbid: artistInfo.mbid,
			lastfmLink: artistInfo.url,
			images: artistInfo.image,
			listeners: artistInfo.stats.listeners,
			playcount: artistInfo.stats.playcount,
			tags: tags });
		}
	    });
	    
	});

	request.on('error',function(res) {
	    //console.log("ERROR!");
	    //console.log(res);
	    cb(null);
	});
    };


    // look for artists and add metadata
    client.collection(city, function(err, collection) {
	var cursor = collection.find({});
	cursor.toArray(function(err,gigs) {
	    Utils.repeat(0,gigs.length, function(k,env) {
		var floop = arguments.callee;
		var gig = gigs[env._i];

		if(gig.tags == null) {
		    console.log("** Trying to update "+gig.artist);
		    search(gig.artist, function(res) {
			if(res) {
			    for(var p in res)
				gig[p] = res[p];

			    collection.update({"link":gig.link}, gig,{},function(){
				k(floop,env);
			    });
			} else {
			    k(floop,env);
			}
		    });
		} else {
		    k(floop,env);
		}
	    }, function(){
		console.log("** FINISHED!!");
		process.exit(0);
	    });
	});
    });
});

