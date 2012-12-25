var mongo = require('mongodb');
var Gig = require('../models/gig').Gig;
var url = require('url');
var Utils = require("../scripts/utils").Utils;

// All the available locations
var locations = {"London": "london",
		 "Barcelona": "barcelona",
		 "Madrid": "madrid",
		 "Berlin": "berlin",
		 "Rome": "rome",
		 "Hamburg": "hamburg",
		 "Paris": "paris"
};

var listLocations = [];
for(var l in locations) {
    listLocations.push(l);
}

// Months mapping
var monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];

var monthMapping = {
    'January': 1,
    'February': 2,
    'March': 3,
    'April': 4,
    'May': 5,
    'June': 6,
    'July': 7,
    'August': 8,
    'September': 9,
    'October': 10,
    'November': 11,
    'December': 12
};

var stats = {};


var client = new mongo.Db('grossogig', new mongo.Server("127.0.0.1", 27017, {}), {w: 1});
client.open(function(err, p_client) { 

    client.collection('stats', function(err, collection) {
	collection.find().toArray(function(err, data) {
	    var cityStats;
	    for(var i=0; i<data.length; i++) {
		cityStats = data[i];
		stats[cityStats.city] = cityStats;
	    }
	});
    });

});



var findEvents = function(city,month,year,limit,tagsSelected,cb) {
	client.collection(city, function(err, collection) {
	    var args = {};
	    if(month != null)
		args['month'] = month;

	    if(year != null)
		args['year'] = year;

	    if(tagsSelected != null)
		args['tags'] = {'$in': tagsSelected};

	    var cursor = collection.find(args);
	    cursor.sort({"attendanceCount":-1}).limit(limit);
	    cursor.toArray(function(err, gigs){
		cb(gigs);
	    });
	});
};

exports.list = function(req, res){
    var currentMonth = (new Date()).getMonth();
    var nextMonths = [];
    var currentYear = (new Date()).getYear()+1900;
    var cities = [];

    for(var i=currentMonth+1; i<currentMonth+3; i++) {
	if(i>11) {
	    nextMonths.push([currentYear+1,monthNames[i%12]]);
	} else {
	    nextMonths.push([currentYear,monthNames[i%12]]);
	}
    }

    for(var city in locations)
	cities.push(locations[city]);
    var gigsAcum = {};
    Utils.repeat(0, cities.length, function(k,env) {
	var floop = arguments.callee;
	var city = cities[env._i];
	findEvents(city,null,null,12,null,function(gigs) {
	    var gigsWrapped = [];
	    for(var i=0; i<gigs.length; i++)
		gigsWrapped.push(new Gig(gigs[i], i+1));
	    gigsAcum[city] = gigsWrapped;
	    k(floop,env);
	});
    }, function() {
	res.render("location/list",
		   {locations: locations, 
		    month: monthNames[currentMonth], 
		    nextMonths: nextMonths,
		    year: currentYear, 
		    cities:gigsAcum });
    });
};


exports.show = function(req, res){

    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;
    var tagsSelected = query.tag;
    if(tagsSelected && tagsSelected.length === 0)
	tagsSelected = null;
    if(typeof(tagsSelected) === 'string')
	tagsSelected = [tagsSelected];

    var locationName = req.params['location'];
    var location = locations[locationName];
    var monthName = req.params['month'];
    var year = parseInt(req.params['year']);
    var month = monthMapping[monthName];
    var prevYear,prevMonth,nextYear,nextMonth;
  
    if(month == 1) {
	prevYear = year - 1;
	prevMonth = 12	
    } else {
	prevYear = year;
	prevMonth = month -1;
    }
    
    if(month == 12) {
	nextYear = year + 1;
	nextMonth = 1;

    } else {
	nextYear = year;
	nextMonth = month + 1;
    }

    var nextLocation,prevLocation, locationIndex;
    for(var i=0; i<listLocations.length; i++) {
	if(listLocations[i] === locationName) {
	    locationIndex = i;
	    break;
	}
    }

    if(locationIndex === 0) {
	prevLocation = listLocations[listLocations.length-1];
    } else {
	prevLocation = listLocations[locationIndex-1];
    }

    if(locationIndex === listLocations.length-1) {
	nextLocation = listLocations[0];
    } else {
	nextLocation = listLocations[locationIndex+1];
    }
	

    findEvents(location,month,year,20,tagsSelected,function(gigs) {
	var acum = [], wrapper;
	for(var i=0; i<gigs.length; i++) {
	    wrapper = new Gig(gigs[i], i+1);
	    acum.push(wrapper);
	}

	if(acum.length>0 && acum[0].attendanceCount > stats[location].max)
	    stats[location].max = acum[0].attendanceCount;

	var tags=stats[location].tags;
	var tagsMap = {};
	var acumTags = [], current = [];
	for(var i=0; i<tags.length; i++) {
	    if(i !== 0 && i%3 === 0) {
		acumTags.push(current);
		current = [];
	    }
	    tagsMap[tags[i]] = false;
	    current.push(tags[i]);
	}
	var tagsArgs = ""
	if(tagsSelected != null) {
	    for(var i=0; i<tagsSelected.length; i++) {
		if(tagsArgs === "")
		    tagsArgs = tagsArgs+"?";
		else
		    tagsArgs = tagsArgs+"&";
		tagsArgs = tagsArgs+"tag="+encodeURI(tagsSelected[i]);
		tagsMap[tagsSelected[i]] = true;
	    }
	}

	res.render("location/show",
		   {location: location,
		    locationName: locationName,
		    monthName: monthName,
		    gigs: acum,
		    max: stats[location].max,
		    tagsSelected: tagsSelected,
		    tags: acumTags,
		    tagsMap: tagsMap,
		    tagsArgs: tagsArgs,
		    year: year,
		    prevYear: prevYear,
		    prevMonth: monthNames[prevMonth-1],
		    nextYear: nextYear,
		    nextMonth: monthNames[nextMonth-1],
		    nextLocation: nextLocation,
		    prevLocation: prevLocation});
    });
};