var accessToken = "4d20d9ed191a4844999c08ce3c379794";
var baseUrl = "https://api.api.ai/v1/";
var recognizedText = "";
var language = "en-US"; //"it"
var recognition;
var label;
var log = "";
var selectedShapeID="";
var selectedColor="";

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
	label = document.getElementById("label");
	document.body.addEventListener("textRecognized", function (e) {
		myLog("Recognized:" + e.detail);
		label.setAttribute("bmfont-text","text:"+e.detail);
		e.stopPropagation();
    }, false);
}

function startRecognition() {
	//init and start webkitSpeechRecognition (Chrome)
	recognition = new webkitSpeechRecognition();
	//enable continuous recognition
	recognition.continuous = false;
	//disable intermediate results
	recognition.interimResults = false;
	recognition.onstart = function(){
		onStartRecognition();
	};
	//send recognized text to api.ai
	recognition.onresult = function(event){
		onRecognitionResult(event);
	};	
	recognition.onend = function(){
		onEndRecognition();
	};
	
	recognition.onerror = function (e) {
		myLog(e);
	};
	
	recognition.lang = language;
	recognition.start();
	setTimeout(function(){
		recognition.stop();
	}, 200);
}

function onStartRecognition(){
	// myLog("start recognition");
}

	//restart recognition as soon as it ends 
	//TODO find a way to avoid the need to do this
function onEndRecognition(){
	// myLog("end of recognition");
	recognition.start();
}

function onRecognitionResult(event){
	// myLog("recognition result");
	//retrieve recognized text
	recognizedText = "";
	/*for (var i = event.resultIndex; i < event.results.length; ++i) {
		recognizedText += event.results[i][0].transcript;
	}*/
	recognizedText += event.results[event.resultIndex][0].transcript;
	//dispatch event containing recognized text to update text label
	var evt = new CustomEvent("textRecognized", { detail: recognizedText });
    document.body.dispatchEvent(evt);
	myLog("dispatching Event");	
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
			console.log(JSON.stringify(data, undefined, 2));
			setResponse(data);
			//here we send the api.ai response to the speech synthesizer
			tts(data.result.fulfillment.speech);
		},
		error: function() {
			// setResponse("Internal Server Error");
		}
	});
	// setResponse("Loading...");
}

function setResponse(val) {
	// myLog(val);
	if(val.result.action=="change_color"){
		if(val.result.parameters.Shapes != "")
			selectedShapeID = val.result.parameters.Shapes;
			myLog("selected Shape: "+selectedShapeID);
		if(val.result.parameters.color != "")
			selectedColor = val.result.parameters.color;
			myLog("selected Color: "+selectedColor);
		if(selectedShapeID!="" && selectedColor!=""){
			var selectedElement = document.getElementById(selectedShapeID);
			console.log(selectedElement);
			myLog("changing "+selectedShapeID+" color to "+selectedColor);
			selectedElement.setAttribute("color",selectedColor);
			
			selectedColor="";
			selectedShapeID="";
		}
		
	}
	
}

//*************** SPEECH SYNTHESIS ********************
function tts(text){
	// myLog("trying to speak");
	recognition.onend = function() { //disable automatic restart of speech recognition
		myLog("end of recognition without restart");
	};
	//stop recognition while synthesizing
	recognition.stop();
	speak(text, 
		function(e){
			myLog("Speech Synthesis Error: "+e);
		},
		function(){ //restart recognition after tts ends and re-enable the recognition automatic restart
			myLog("End of speech synthesis");
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

function myLog(text){
	console.log(text);
	log+=text+"\n";
	label.setAttribute("bmfont-text","text:"+ log);
}