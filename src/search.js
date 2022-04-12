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
	return txt;
}

function search() {
	var context = "";
	var phrase = document.getElementById("phrase").value.toLowerCase();
	if (!phrase) {
		return;
	}
	var epsSpan = document.getElementById("epResults");
	var contextSpan = document.getElementById("contextResults");
	var showContext = document.getElementById('contextToggle').checked;
	var found = false;
	epsSpan.innerHTML = "<div class=\"permalink\"><a href=" + getPermalink() + ">Link to search</a><br /><br /></div>";
	for (var season=1; season<=seasons; season++) {
		var seasonEps = "";
		for (var ep=1; ep<=eps[season-1]; ep++) {
			if (season === 4 && ep === 4 && document.getElementById('crossoverToggle').checked) {
				var file = 'transcripts/ls_s02e03.txt';
				jQuery.ajax({
				url:file,
				success: function (data) {
					if (data.toLowerCase().includes(phrase)) {
						found = true;
						seasonEps += "LS-2.03 ";
						if (showContext) {
							context += parseContext(phrase, "LS 2.03 - Hold the Line", data);
						}
					}
				},
				async: false
			});
			}
			var file = 'transcripts/s' + pad2(season) + 'e' + pad2(ep) + '.txt';
			jQuery.ajax({
				url:file,
				success: function (data) {
					if (data.toLowerCase().includes(phrase)) {
						found = true;
						seasonEps += season + "." + pad2(ep) + " ";
						if (showContext) {
							context += parseContext(phrase, getTitle(season, ep), data);
						}
					}
				},
				async: false
			});
		}
		if (seasonEps) {
			epsSpan.innerHTML += seasonEps + "<br />";
			console.log(seasonEps);
		}
	}
	if (!found) {
		context = "<center>No results found.<br /></center>";
	}
	contextSpan.innerHTML = context;
}