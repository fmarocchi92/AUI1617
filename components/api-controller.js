var accessToken = "4d20d9ed191a4844999c08ce3c379794";
var baseUrl = "https://api.api.ai/v1/";
var recognizedText = "";
var language = "en-US"; //"it"
var recognition;

//begin recognition at startup
$(document).ready(function() {
	enableSpeechAPI();
});

function enableSpeechAPI(){
	init();
	startRecognition();
}

function init () {
	//add listener to body to update label text according to the recognized text
	//(apparently if I add the listener directly to the label it doesn't capture events)
	var label = document.getElementById("label");
	document.body.addEventListener("textRecognized", function (e) {
		console.log("Recognized:" + e.detail);
		label.setAttribute("bmfont-text","text:"+e.detail);
    }, false);
}

function startRecognition() {
	//init and start webkitSpeechRecognition (Chrome)
	recognition = new webkitSpeechRecognition();
	//enable continuous recognition
	recognition.continuous = true;
	//disable intermediate results
	recognition.interimResults = false;
	console.log("appending start callback");
	recognition.onstart = function(){
		onStartRecognition();
	};
	//send recognized text to api.ai
	console.log("appending onresult callback");
	recognition.onresult = function(event){
		onRecognitionResult(event);
		console.log("executing onResut callback");
	};	
	console.log("appending onEnd callback");
	recognition.onend = function(){
		onEndRecognition();
	};
	recognition.lang = language;
	recognition.start();
}

function onStartRecognition(){
	console.log("start recognition");
}

	//restart recognition as soon as it ends 
	//TODO find a way to avoid the need to do this
function onEndRecognition(){
	console.log("end of recognition");
	recognition.start();
}

function onRecognitionResult(event){
	console.log("recognition result");
	//retrieve recognized text
	recognizedText = "";
	/*for (var i = event.resultIndex; i < event.results.length; ++i) {
		recognizedText += event.results[i][0].transcript;
	}*/
	recognizedText += event.results[event.resultIndex][0].transcript;
	//dispatch event containing recognized text to update text label
	var evt = new CustomEvent("textRecognized", { detail: recognizedText });
    document.body.dispatchEvent(evt);
	
	//send a query to api.ai to obtain the relevant features of the recognized text
	apiAiQuery();
}

//send a query to api.ai to obtain the relevant features of the recognized text
function apiAiQuery() {
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
			
			//here we send the api.ai response to the speech synthesizer
			tts(data.result.fulfillment.speech);
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

//*************** SPEECH SYNTHESIS ********************
function tts(text){
	console.log("trying to speak");
	recognition.onend = function() { //disable automatic restart of speech recognition
		console.log("end of recognition without restart");
	};
	//stop recognition while synthesizing
	recognition.stop();
	speak(text, 
		function(e){
			console.log("Speech Synthesis Error: "+e);
		},
		function(){ //restart recognition after tts ends and re-enable the recognition automatic restart
			console.log("End of speech synthesis");
			recognition.onend = function(){
				onEndRecognition();
			};
			recognition.start();
		});
}

// TTS functionality
function speak(text, errorCallback, endCallback) {
    var u = new SpeechSynthesisUtterance();
    u.text = text;
    u.lang = language;
 
    u.onend = function () {
        if (endCallback) {
            endCallback();
        }
    };
	
    u.onerror = function (e) {
        if (errorCallback) {
            errorCallback(e);
        }
    };

    speechSynthesis.speak(u);
}