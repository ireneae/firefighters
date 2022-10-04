const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const searchContext = urlParams.get('context');
const query = urlParams.get('q');
const crossover = urlParams.get('crossover');
console.log(searchContext);

$(document).ready(function(){
	$('#phrase').keypress(function(e){
		if(e.keyCode==13) {
			$('#search').click();
		}
	});
	document.getElementById("phrase").value = query;
	if (searchContext != null) {
		if (searchContext == "true") {
			document.getElementById("contextToggle").checked = true;
		} else {
			document.getElementById("contextToggle").checked = false;
		}
	}
	if (crossover != null) {
		if (crossover == "true") {
			document.getElementById("crossoverToggle").checked = true;
		} else {
			document.getElementById("crossoverToggle").checked = false;
		}
	}
	if (query) {
		$('#search').click();
	}
});

const seasons = 6;
const eps = [10, 18, 18, 14, 18, 3];
const htmlRegex = /<[^>]*>/g;
const N = 12;
const M = 2;

function pad2(num) {
	return String(num).padStart(2, '0');
}

function getPermalink() {
	params = new URLSearchParams();
	params.set('q', document.getElementById("phrase").value.toLowerCase())
	params.set('context', document.getElementById('contextToggle').checked);
	params.set('crossover', document.getElementById("crossoverToggle").checked);
	return window.location.pathname + "?" + params.toString();
}

function getEpIndex(season, ep) {
	var epNum = 0;
	var s = 0;
	var title = "";
	while (s < season-1) {
		epNum += eps[s];
		s += 1;
	}
	return epNum + ep - 1;
}

function getTitle(season, ep) {
	jQuery.ajax({
		url:'transcripts/titles.txt',
		success: function (data) {
			title = data.split('\n')[getEpIndex(season, ep)];
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

function showDetailed(epNum, expand) {
	console.log(epNum);
	if (expand) {
		document.getElementById(epNum).style.display = "none";
		document.getElementById(epNum + "det").style.display = "block";
	} else {
		document.getElementById(epNum).style.display = "block";
		document.getElementById(epNum + "det").style.display = "none";
	}
}

function createNodes(epDiv, lines, nos, nosDet, epNum) {
	const textNode = document.createElement("div")
	textNode.id = epNum;
	const textNodeDet = document.createElement("div");
	textNodeDet.id = epNum + "det";
	textNodeDet.style.display = "none";
	textNode.innerHTML = parseLines(lines, nos);
	textNodeDet.innerHTML = parseLines(lines, nosDet);
	textNode.innerHTML += "<a href=\"javascript:showDetailed(\'" + epNum + "\', true)" + ";\" style=\"text-decoration: none\"><small>(expand)</small></a>"
	textNodeDet.innerHTML += "<a href=\"javascript:showDetailed(\'" + epNum + "\', false)" + ";\" style=\"text-decoration: none\"><small>(collapse)</small></a>"
	epDiv.appendChild(textNode);
	epDiv.appendChild(textNodeDet);
}

function parseContext(phrase, epTitle, epNum, data) {
	const epDiv = document.createElement("div");
	epDiv.innerHTML = "<br><div class=\"resTitle\">" + epTitle + "</div>";
	var lines = data.split("\n");
	var nos = [];
	var nosDet = [];
	var txt = "";
	var k = 0;
	for (var i=0; i<lines.length; i++) {
		var line = lines[i].replace(htmlRegex, '');
		if (line.toLowerCase().includes(phrase)) {
			var start = i-M;
			if (nos.length > 0 && start > nos[nos.length - 1]) {
				// finish out the current set
				createNodes(epDiv, lines, nos, nosDet, epNum + "." + k);
				nos = [];
				nosDet = [];
				k += 1;
			} else if (nos.length > 0) {
				start = nos[nos.length - 1] + 1;
			}
			for (var j=start; j < i+M+1; j++) {
				if (j >= 0 && j < lines.length - 1) {
					nos.push(j);
				}
			}
			for (var j=start-(N-M); j < i+N+1; j++) {
				if (j >= 0 && (nosDet.length == 0 || j > nosDet[nosDet.length-1]) && j < lines.length - 1) {
					nosDet.push(j);
				}
			}
		}
	}
	createNodes(epDiv, lines, nos, nosDet, epNum + "." + k);
	epDiv.innerHTML += "<br />";
	document.getElementById("contextResults").appendChild(epDiv);
}

function queryLoneStar(phrase, showContext) {
	var epsSpan = document.getElementById("epResults");
	var file = 'transcripts/ls_s02e03.txt';
	var found = false;
	jQuery.ajax({
		url:file,
		success: function (data) {
			if (data.toLowerCase().includes(phrase)) {
				found = true;
				epsSpan.innerHTML += "LS-2.03 ";
				if (showContext) {
					parseContext(phrase, "LS 2.03 - Hold the Line", "LS2.03", data);
				}
			}
		},
		async: false
	});
	return found;
}

function searchEp(data, title, phrase, season, ep, showContext) {
	var found = false;
	console.log(title);
	console.log(data.substring(0, 20));
	if (data.toLowerCase().includes(phrase)) {
		found = true;
		epNum = "" + season + "." + pad2(ep)
		document.getElementById("epResults").innerHTML += epNum + " ";
		if (showContext) {
			parseContext(phrase, title, epNum, data);
		}
	}
	return found;
}

function querySeason(text, titles, season, phrase, showContext) {
	var found = false;
	for (var ep=1; ep<=eps[season-1]; ep++) {
		if (season === 4 && ep === 4 && document.getElementById('crossoverToggle').checked) {
			found = queryLoneStar(phrase, showContext) || found;
		}
		var idx = getEpIndex(season, ep);
		found = searchEp(text[idx], titles[idx], phrase, season, ep, showContext) || found;
		if (ep === eps[season-1] && found) {
			document.getElementById("epResults").innerHTML += "<br />";
		}
	}
	return found;
}

function search() {
	document.getElementById("contextResults").innerHTML = "";
	var phrase = document.getElementById("phrase").value.toLowerCase();
	if (!phrase) {
		return;
	}
	jQuery.ajax({
		url:'transcripts/titles.txt',
		success: function (data) {
			titles = data.split('\n');
		},
		async:false
	});
	jQuery.ajax({
			url:"transcripts/all.txt",
			success: function (data) {
				epArray = data.split("@@@@@@\n");
			},
			async: false
		});
	var showContext = document.getElementById('contextToggle').checked;
	var found = false;
	document.getElementById("epResults").innerHTML = "<div class=\"permalink\"><a href=" + getPermalink() + ">Link to search</a><br /><br /></div>";
	for (var season=1; season<=seasons; season++) {
		const s = season;
		found = querySeason(epArray, titles, s, phrase, showContext) || found;
	}
	if (!found) {
		document.getElementById("contextResults").innerHTML += "<center>No results found.<br /></center>";
	}
}
