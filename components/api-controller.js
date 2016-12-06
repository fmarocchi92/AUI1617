var accessToken = "4d20d9ed191a4844999c08ce3c379794";
var baseUrl = "https://api.api.ai/v1/";
var recognizedText = "";

//begin recognition at startup
$(document).ready(function() {
	startRecognition();
});


function startRecognition() {
	//add listener to body to update label text according to the recognized text
	//(apparently if I add the listener directly to the label it doesn't capture events)
	var label = document.getElementById("label");
	console.log(label);
	document.body.addEventListener("textRecognized", function (e) {
		label.setAttribute("bmfont-text","text:"+e.detail);
    }, false);
	
	//init and start Webkit Speech Recognition
	recognition = new webkitSpeechRecognition();
	//enable continuous recognition
	recognition.continuous = true;
	//enable intermediate results
	recognition.interimResults = false;
	recognition.onstart = function(event) {
		console.log("start recognition");
	};
	//send recognized text to api.ai
	recognition.onresult = function(event) {
		var text = "";
		for (var i = event.resultIndex; i < event.results.length; ++i) {
			text += event.results[i][0].transcript;
		}
		setInput(text);
	};
	
	//restart recognition as soon as it ends 
	//TODO find a way to avoid doing this
	recognition.onend = function() {
		console.log("end of recognition");
		recognition.start();
	};
	recognition.lang = "en-US";
	recognition.start();
}

function setInput(text) {
	recognizedText = text;
	//dispatch event containing recognized text to update text label
	var evt = new CustomEvent("textRecognized", { detail: recognizedText });
    document.body.dispatchEvent(evt);
	send();
}

//send a query to api.ai to obtain the relevant features of the recognized text
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