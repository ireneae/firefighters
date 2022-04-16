const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const searchContext = urlParams.get('context');
const query = urlParams.get('q');
const crossover = urlParams.get('crossover');

$(document).ready(function(){
	$('#phrase').keypress(function(e){
		if(e.keyCode==13) {
			$('#search').click();
		}
	});
	document.getElementById("phrase").value = query;
	if (searchContext == 'true') {
		document.getElementById("contextToggle").checked = true;
	}
	if (crossover == "true") {
		document.getElementById("crossoverToggle").checked = true;
	}
	if (query) {
		$('#search').click();
	}
});

const seasons = 5;
const eps = [10, 18, 18, 14, 13];
const htmlRegex = /<[^>]*>/g;
const N = 2;

function pad2(num) {
	return String(num).padStart(2, '0');
}

function getPermalink() {
	params = new URLSearchParams();
	params.set('q', document.getElementById("phrase").value.toLowerCase())
	if (document.getElementById('contextToggle').checked) {
		params.set('context', true);
	}
	if (document.getElementById('crossoverToggle').checked) {
		params.set('crossover', true);
	}
	return window.location.pathname + "?" + params.toString();
}
function getTitle(season, ep) {
	var epNum = 0;
	var s = 0;
	var title = "";
	while (s < season-1) {
		epNum += eps[s];
		s += 1;
	}
	jQuery.ajax({
		url:'transcripts/titles.txt',
		success: function (data) {
			title = data.split('\n')[epNum + ep - 1];
		},
		async:false
	});
	return title;
}

function parseLines(lines, nos) {
	txt = "<br />";
	nos.forEach((value) => {
		txt += lines[value].replace(htmlRegex, '') + "<br />";
	});
	return txt;
}

function parseContext(phrase, epTitle, data) {
	console.log("parsing " + epTitle);
	txt = "<br><div class=\"resTitle\">" + epTitle + "</div>";
	var lines = data.split("\n");
	var nos = [];
	for (var i=0; i<lines.length; i++) {
		var line = lines[i].replace(htmlRegex, '');
		if (line.toLowerCase().includes(phrase)) {
			var start = i-N;
			if (nos.length > 0 && start > nos[nos.length - 1]) {
				// finish out the current set
				txt += parseLines(lines, nos);
				nos = [];
			} else if (nos.length > 0) {
				start = nos[nos.length - 1] + 1;
			}
			for (var j=start; j < i+N+1; j++) {
				if (j >= 0 && j < lines.length - 1) {
					nos.push(j);
				}
			}
		}
	}
	txt += parseLines(lines, nos);
	txt += "<br />";
	console.log("parsed " + epTitle);
	return txt;
}

function queryLoneStar(phrase, showContext) {
	var epsSpan = document.getElementById("epResults");
	var file = 'transcripts/ls_s02e03.txt';
	jQuery.ajax({
		url:file,
		success: function (data) {
			if (data.toLowerCase().includes(phrase)) {
				epsSpan.innerHTML += "LS-2.03 ";
				if (showContext) {
					document.getElementById("contextResults").innerHTML += parseContext(phrase, "LS 2.03 - Hold the Line", data);
				}
			}
		},
		async: false
	});
}

function searchEp(file, phrase, season, ep, showContext) {
	var found = false;
	var epsSpan = document.getElementById("epResults");
	console.log("searching " + season + " " + ep);
	jQuery.ajax({
			url:file,
			success: function (data) {
				console.log("found " + season + " " + ep);
				if (data.toLowerCase().includes(phrase)) {
					console.log("phrase in " + season + " " + ep);
					found = true;
					epsSpan.innerHTML += season + "." + pad2(ep) + " ";
					if (showContext) {
						document.getElementById("contextResults").innerHTML += parseContext(phrase, getTitle(season, ep), data);
					}
				}
				console.log("searched " + season + " " + ep);
			},
			async: false
		});
	return found;
}

function querySeason(season, phrase, showContext) {
	var context = "";
	var found = false;
	for (var ep=1; ep<=eps[season-1]; ep++) {
		if (season === 4 && ep === 4 && document.getElementById('crossoverToggle').checked) {
			found = queryLoneStar(phrase, showContext) || found;
		}
		if (season === 1) {
			file = 'transcripts/s' + pad2(season) + 'e' + pad2(ep) + '.html';
		} else {
	    	file = 'transcripts/s' + pad2(season) + 'e' + pad2(ep) + '.txt';
		}
		found = searchEp(file, phrase, season, ep, showContext) || found;
		if (ep === eps[season-1] && found) {
			document.getElementById("epResults").innerHTML += "<br />";
		}
	}
	return context;
}

function search() {
	document.getElementById("contextResults").innerHTML = "";
	var phrase = document.getElementById("phrase").value.toLowerCase();
	if (!phrase) {
		return;
	}
	var epsSpan = document.getElementById("epResults");
	var showContext = document.getElementById('contextToggle').checked;
	epsSpan.innerHTML = "<div class=\"permalink\"><a href=" + getPermalink() + ">Link to search</a><br /><br /></div>";
	for (var season=1; season<=seasons; season++) {
		const s = season;
		setTimeout(() => {
			querySeason(s, phrase, showContext);
		}, 0);
	}
	if (!epsSpan.innerHTML) {
		document.getElementById("contextResults").innerHTML += "<center>No results found.<br /></center>";
	}
}