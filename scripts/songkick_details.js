var webpage = require('webpage')
var system = require('system');
var fs = require('fs');

var Utils = {};

Utils.stackCounterLimit = 1000;
Utils.stackCounter = 0;

Utils.recur = function(c){
    if(Utils.stackCounter === Utils.stackCounterLimit) {
        Utils.stackCounter = 0;
        setTimeout(c, 0);
    } else {
        Utils.stackCounter++;
        c();
    } 
};

Utils.repeat = function(c,max,floop,fend,env) {
    if(arguments.length===4) { env = {}; }
    if(c<max) {
        env._i = c;
        floop(function(floop,env){
            // avoid stack overflow
            // deadly hack
            Utils.recur(function(){ Utils.repeat(c+1, max, floop, fend, env); });
        },env);
    } else {
        fend(env);
    }
};


var city = system.args[1];
var outPath = system.args[2] || "/tmp/grossogig";

var now = new Date();
var outDir = outPath+"/"+(1900+now.getYear())+"/"+(now.getMonth()+1)+"/"+now.getDate();
outPath = outDir+"/"+city+"_details.json";

var getDetails = function(url, cb) {
    try {
    console.log("OPENING "+url);
    //setTimeout(function() {
    var page = webpage.create();
    page.open("http://www.songkick.com"+url, function(status) {
	try {
	console.log("RETURNED:"+status);
	console.log("\n\n");

	if(status === "success") {
	    page.onConsoleMessage = function(msg) {
		console.log(msg);
	    }

	    var result = page.evaluate(function() {
		try {
		    var parsed = {};
		    console.log("ABOUT TO PARSE");
		    console.log($(".adr span").length);
		    parsed['address'] = $(".adr span").map(function(i,e) { return $(e).text(); }).toArray().join(", ");

		    if($("#tickets table:first .price:first").length > 0) {
			parsed['price'] = $("#tickets table:first .price:first").text();
			parsed['vendors'] = $("#tickets table:first .vendor").map(function(i,e) { 
			    var m = {}; 
			    m['vendor'] = $(e).attr("title"); 
			    m['link'] = $(e).attr("href"); 
			    return m; }).toArray();
		    }
		    return parsed;
		} catch(e) {
		    return null;
		}
	    });

	    cb(result);
	} else {
	    cb(null);
	}
	} catch(e) {
	    console.log("(!!) Error in parsing callback");
	    console.log(e);
	    cb(null);
	}
    });
    //},1000);
    } catch(e) {
	console.log("(!!) Error trying to open page");
	console.log(e);
	cb(null);
    }
};


/*
getDetails(url, function(r) {
    console.log("PARSED");
    console.log(r.address);
    console.log(r.price);
    console.log(r.vendors.length+" vendors");
    phantom.exit();
});
*/


var data = fs.read(outPath);
var links = JSON.parse(data);

var acum = [];

Utils.repeat(0, links.length, function(k,env) {
    var floop = arguments.callee;
    var link =links[env._i];
    console.log("* trying to parse "+link+" "+env._i+"/"+links.length);
    getDetails(link, function(r) {
	if(r != null) {
	    console.log("*PARSED");
	    for(var p in r) {
		console.log(p+" -> "+r[p]+" : null? "+(r[p]==null));
	    }
	    console.log("---");

	    console.log("* SUCCESS");
	    r.link = link;
	    acum.push(r);
	} else {
	    console.log("* FAILED");
	}
	k(floop, env);
    });

}, function() {

    var stream = fs.open(outDir+"/"+city+"details_collected.json", "w");
    stream.write(JSON.stringify(acum));
    stream.flush();
    stream.close();


    console.log("* FINISHED");

    phantom.exit();
});