var Gig = function(data,position) {
    this.data = data;
    this.position = position;
    for(var p in data)
	this[p] = data[p];
};


Gig.prototype.backgroundImage = function() {
    var images = (this.data.images||[]);
    var reversed = [];
    for(var i=images.length-1; i>-1; i--)
	reversed.push(images[i]);

    if(this.data.images) {
	return (reversed[0]["#text"] || "");
    } else {
	return null;
    }
};

Gig.prototype.smallImage = function() {
    var images = (this.data.images||[]);
    if(this.data.images) {
	return (images[3]["#text"] || "");
    } else {
	return null;
    }
};

Gig.prototype.linkToMonthListing = function(city) {
    return "/Gigs/"+city+"/"+this.data.year+"/"+this.formatMonth();
}

Gig.prototype.formatName = function() {
    if(this.data.artist.length < 30) {
	return this.data.artist
    } else {
	return this.data.artist.substr(0,27)+"..."
    }
};

Gig.prototype.formatLocation = function() {
    var maxName = this.formatName().length;

    if((maxName+ (this.data.location||"").length) < 60) {
	return this.data.location
    } else {
	return this.data.location.substr(0,27)+"..."
    }
};

Gig.prototype.formatMonth = function() {
    //var months = ["Jan.", "Feb.", "Mar.", 
    // 		  "Apr.", "May", "Jun.",
    // 		  "Jul.", "Aug.", "Sep.",
    // 		  "Oct.", "Nov.", "Dec."];
    var months = ["January", "February", "March", 
		  "April", "May", "June",
		  "July", "August", "September",
		  "October", "November", "December"];

    return months[this.data.month-1];
};

Gig.prototype.formatMonthSmall = function() {
    var months = ["Jan.", "Feb.", "Mar.", 
		  "Apr.", "May", "Jun.",
		  "Jul.", "Aug.", "Sep.",
		  "Oct.", "Nov.", "Dec."];

    return months[this.data.month-1];
};

Gig.prototype.formatDayOfWeek = function() {
    var days = ["Mon.", "Tues.", "Wed.",
		"Thur.", "Fri.", "Sat.", "Sun."];
    return days[this.data.date.getDay()];    
};
exports.Gig = Gig

