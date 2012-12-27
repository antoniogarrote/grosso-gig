$(document).ready(function() {
    $("#show-tags").on('click', function() {
	$("#tags-selection").show();
	//$("#sep1").show();
	$("#sep2").show();
	$("#hide-tags").show();
	$("#select-tags-link").show();
	$("#show-tags").hide();
    });
    $("#hide-tags").on('click', function() {
	$("#tags-selection").hide();
	//$("#sep1").hide();
	$("#sep2").hide();
	$("#hide-tags").hide();
	$("#select-tags-link").hide();
	$("#show-tags").show();

    });

    $("#select-tags-link").on('click', function() {
	var location = window.location.toString();
	location = location.replace("#","").split("?")[0];

	var args = "";
	$("#tags-selection input:checked").toArray().forEach(function(tag) {
	    if(args === "")
		args = args + "?";
	    else
		args = args + "&";

	    args = args+"tag="+encodeURI(tag.value);
	});

	window.location.href = (location + args);
    });

		    
});