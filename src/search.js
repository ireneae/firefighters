$(document).ready(function(){
    $('#phrase').keypress(function(e){
      	if(e.keyCode==13) {
      		$('#search').click();
  		}
    });
});

const seasons = 1;
const eps = [10, 18, 18, 14, 18];
const htmlRegex = /<[^>]*>/g;
const N = 2;

function pad2(num) {
	return String(num).padStart(2, '0');
}

function getTitle(season, ep) {
	var epNum = 0;
	var s = 0;
	var title = "";
	while (s < season-1) {
		epNum += eps[s];
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

function search() {
	var epsWithString = "";
	var context = "";
	var phrase = document.getElementById("phrase").value.toLowerCase();
	console.log("abc" + phrase);
	console.log("abc");
	if (!phrase) {
		return;
	}
	var epsSpan = document.getElementById("epResults");
	var contextSpan = document.getElementById("contextResults");
	for (var season=1; season<=seasons; season++) {
		for (var ep=1; ep<=eps[season-1]; ep++) {
			var file = 'transcripts/s' + pad2(season) + 'e' + pad2(ep) + '.txt';
			jQuery.ajax({
                url:file,
                success: function (data) {
                    if (data.toLowerCase().includes(phrase)) {
                    	epNum = season + "." + pad2(ep) + " ";
                    	epsWithString += season + "." + pad2(ep) + " ";
                    	if (document.getElementById('contextToggle').checked) {
                    	epTitle = getTitle(season, ep);
                        context += "<br><div class=\"resTitle\">" + epTitle + "</div>";
                        var lines = data.split("\n");
                    	var linenos = [];
                        for (var i=0; i<lines.length; i++) {
                            var line = lines[i].replace(htmlRegex, '');
                            if (line.toLowerCase().includes(phrase)) {
                            	console.log(line);
                            	console.log(i);
                            	var start = i-N;
                            	if (linenos.length == 0) {
                            		for (var j=start; j<i+N+1; j++) {
                            			if (j >= 0 && j < lines.length-1) {
                            				linenos.push(j);
                            			}
                            		}
                            	} else if (start <= linenos[linenos.length-1]) {
                            		for (var j=linenos[linenos.length-1]+1; j<i+N+1; j++) {
                            			if (j < lines.length-1) {
                            				linenos.push(j);
                            			}
                            		}
                            	} else {
                            		// finish out the current set
                            		context += "<br>";
                            		linenos.forEach((value) => {
                            			context += lines[value].replace(htmlRegex, '') + "<br>";
                            		});
                            		linenos = [];
                            		for (var j=start; j<i+N+1; j++) {
                            			if (j >= 0 && j < lines.length-1) {
                            				linenos.push(j);
                            			}
                            		}
                            	}
                            }
                        }
                        context += "<br>";
                        linenos.forEach((value) => {
                            context += lines[value].replace(htmlRegex, '') + "<br>";
                        });
                        context += "<br>";
                    }
                }
                },
                async: false
            });
		}
	}
	epsSpan.innerHTML = epsWithString;
	contextSpan.innerHTML = context;
}