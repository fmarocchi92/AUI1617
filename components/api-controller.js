var accessToken = "4d20d9ed191a4844999c08ce3c379794";
var baseUrl = "https://api.api.ai/v1/";
var recognizedText = "";
$(document).ready(function() {
	startRecognition();
});


function startRecognition() {
	recognition = new webkitSpeechRecognition();
	recognition.continuous = true;
	recognition.interimResults = false;
	recognition.onstart = function(event) {
		console.log("start recognition");
	};
	recognition.onresult = function(event) {
		var text = "";
		for (var i = event.resultIndex; i < event.results.length; ++i) {
			text += event.results[i][0].transcript;
		}
		setInput(text);
	};
	recognition.onend = function() {
		console.log("end of recognition");
		recognition.start();
	};
	recognition.lang = "en-US";
	recognition.start();
}

function setInput(text) {
	recognizedText = text;
	console.log(text);
	var evt = new CustomEvent("textRecognized", { detail: recognizedText });
    window.dispatchEvent(evt);
	//$label.bmfont-text="text: "+text+"; color: #333" position="0 0 -5";
	
	send();
}

function send() {
	var text = recognizedText;
	$.ajax({
		type: "POST",
		url: baseUrl + "query?v=20150910",
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		headers: {
			"Authorization": "Bearer " + accessToken
		},
		data: JSON.stringify({ query: text, lang: "en", sessionId: "somerandomthing" }),

		success: function(data) {
			setResponse(JSON.stringify(data, undefined, 2));
		},
		error: function() {
			setResponse("Internal Server Error");
		}
	});
	setResponse("Loading...");
}

function setResponse(val) {
	console.log(val);
}


AFRAME.registerComponent('update-label', {
  schema: {
	on: {type: 'string'}
	},

  init: function () {
    var labelEl = this.el;
	var data = this.data;
	console.log("adding Listener");
	labelEl.addEventListener(data.on, function (e) {
		//labelEl.components.bmfont-text.text = e.detail;
		console.log(e.detail);
		labelEl.components.bmfont-text.update(e.detail);
    });
  
  }
});