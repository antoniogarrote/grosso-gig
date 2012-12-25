var page = require('webpage').create();
var system = require('system');
var fs = require('fs');

var locations = {
    london: "http://www.songkick.com/metro_areas/24426-uk-london",
    barcelona: "http://www.songkick.com/metro_areas/28714-spain-barcelona",
    madrid: "http://www.songkick.com/metro_areas/28755-spain-madrid",
    berlin: "http://www.songkick.com/metro_areas/28443-germany-berlin",
    rome: "http://www.songkick.com/metro_areas/30366-italy-rome",
    paris: "http://www.songkick.com/metro_areas/28909-france-paris",
    hamburg: "http://www.songkick.com/metro_areas/28498-germany-hamburg",
    mexico: "http://www.songkick.com/metro_areas/34385-mexico-mexico-city"
};

var parseLocation = function(location, pageNumber, endMonth, endYear, acum, cb) {
    var locationToRequest = location;
    if(pageNumber > 0) 
	locationToRequest = location + "?page="+pageNumber;

    console.log("*** PARSING: "+locationToRequest);

    page.open(locationToRequest, function (status) {
	console.log("RETURNED:"+status);
	console.log("\n\n");
	if(status === "success") {
	    var currentDate, currentDiv;

	    var events = page.evaluate(function() {
		try {

		    var monthToInt = function(month) {
			var d;
			switch(month) {
			case 'December': 
			    d = 12;
			    break;
			case 'January':
			    d = 1;
			    break;
			case 'February':
			    d = 2;
			    break;
			case 'March':
			    d = 3;
			    break;
			case 'April':
			    d = 4;
			    break;
			case 'May':
			    d = 5;
			    break;
			case 'June':
			    d = 6;
			    break;
			case 'July':
			    d = 7;
			    break;
			case 'August':
			    d = 8;
			    break;
			case 'September':
			    d = 9;
			    break;
			case 'October':
			    d = 10;
			    break;
			case 'November':
			    d = 11;
			    break;
			default:
			    console.log("CANNOT FIND '"+month+"'");
			    return null;
			}
			return d;
		    };

		    var els = $("li[title]").toArray();

		    var acum = [];
		    var el,date,day,month,year,event,artist,attendanceCount,location,link;

		    for(var i=0; i<els.length; i++) {
			el = $(els[i]);
			date = el.attr("title").split(" ");
			if(date.length === 4) {
			    event = {};

			    day = parseInt(date[1]);
			    month = monthToInt(date[2]) - 1;
			    year = parseInt(date[3]);
			    
			    //event.dateString = year+"-"+month+"-"+day;
			    event.date = new Date(year,month,day);


			    artist = el.children(".artists").children("a").children("strong").text();

			    attendanceCount = el.children(".responsive-column-wrap").children(".attendance-count").text().replace(/\s/g,"").split("person")[0];
			    attendanceCount = parseInt(attendanceCount) || 0;


			    location = el.children(".responsive-column-wrap").children(".location").children("span").toArray();
			    if(location.length == 2)
				event.location = location[0].children[0].children[0].innerHTML;
			    
			    link = el.children(".avatar").attr("href");
			    event.link = link;

			    event.artist = artist;
			    event.attendanceCount = attendanceCount;

			    acum.push(event);
			}
		    }

		    return acum;
		} catch(e) {
		    return e;
		}
	    });

	    console.log("- BACK FROM EVALUATION");

	    if(events && events.length>0) {
		var lastMonth = null;
		var lastYear = null;
		for(var i=0; i<events.length; i++)  {
		    lastMonth = events[i].date.getMonth() + 1;
		    lastYear = events[i].date.getYear() + 1900;
		    var eventsForMonth = acum[lastMonth] || {};
		    var eventId = events[i].artist+lastMonth+lastYear+events[i].date.getDate();
		    if(eventsForMonth[eventId] == null)
			eventsForMonth[eventId] = events[i];

		    acum[lastMonth] = eventsForMonth;
		    console.log(events[i].date);
		}

		console.log("LAST MONTH "+lastMonth+" VS "+endMonth);
		console.log("LAST YEAR "+lastYear+" VS " +endYear);

		if(lastMonth >= endMonth && lastYear == endYear) {
		    cb(acum);
		} else {
		    parseLocation(location, pageNumber+1, endMonth, endYear, acum, cb);
		}
	    } else {
		cb(acum);
	    }
	} else {
	    console.log("Page could not be loaded");
	    cb(acum);
	}
    });
};



var city = system.args[1];
var endMonth = system.args[2];
var endYear = system.args[3];
var outPath = system.args[4] || "/tmp/grossogig";

var now = new Date();

outPath = outPath+"/"+(1900+now.getYear())+"/"+(now.getMonth()+1)+"/"+(now.getDate());

console.log("*** STARTING ("+now+")");
console.log("LOCATION: "+city);
console.log("END MONTH:" +endMonth);
console.log("END YEAR:"+endYear);
console.log("OUT PATH:"+outPath);


parseLocation(locations[city], 0, parseInt(endMonth), parseInt(endYear), {}, function(parsed){
    console.log("BACK!");
    console.log("PARSED:");

    var acum;
    for(var m in parsed) {
	acum = [];

	for(var l in parsed[m])
	    acum.push(parsed[m][l]);

	parsed[m] = acum;
    }

    fs.makeTree(outPath);
    console.log("** Writing output to :"+outPath+"/"+city+".json");

    var stream = fs.open(outPath+"/"+city+".json", "w");
    stream.write(JSON.stringify(parsed));
    stream.flush();
    stream.close();

    console.log("** finished");
    phantom.exit();
});

