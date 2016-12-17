var accessToken = "4d20d9ed191a4844999c08ce3c379794";
var baseUrl = "https://api.api.ai/v1/";
var recognizedText = "";
var language = "en-US"; //"it"
var recognition;
var label;
var log = "";
var lastLogLine ="";
var selectedShapeID="";
var selectedColor="";
var recognitionRunning = false;
var conversationRunning = false;

var startRecCallback = function(){
		onStartRecognition();
};
var endRecCallback = function(){
		onEndRecognition();
};
var resultRecCallback = function(event){
		onRecognitionResult(event);
};	
var errorRecCallback = function (e) {
		myLog(e);
};

//begin recognition at startup
$(document).ready(function() {
	enableSpeechAPI();
});

function enableSpeechAPI(){
	init();
	initRecognition();
	// recognition.start();
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

function initRecognition() {
	//init webkitSpeechRecognition (Chrome)
	recognition = new webkitSpeechRecognition();
	//disable continuous recognition as on mobile it fires recognition events twice
	recognition.continuous = false;
	//disable intermediate results
	recognition.interimResults = false;
	//assign callback functions
	recognition.onstart = startRecCallback;
	recognition.onresult = resultRecCallback;
	recognition.onend = endRecCallback;
	recognition.onerror = errorRecCallback;
	
	recognition.lang = language;
}

function onStartRecognition(){
	myLog("start recognition");
	recognitionRunning = true;
}

function onEndRecognition(){
	myLog("end of recognition");
	recognitionRunning = false;
}

function onRecognitionResult(event){
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
			console.log(JSON.stringify(data, undefined, 2));
			setResponse(data);
			//here we send the api.ai response to the speech synthesizer
			tts(data.result.fulfillment.speech);
		},
		error: function() {
			myLog("Api.ai error");
		}
	});
}

function setResponse(val) {
	// myLog(val);
	if(val.result.actionIncomplete){
		conversationRunning = true;
	}
	if(val.result.action=="change_color"){
		if(val.result.parameters.Shapes != "")
			selectedShapeID = val.result.parameters.Shapes;
		myLog("selected Shape: "+selectedShapeID);
		if(val.result.parameters.color != "")
			selectedColor = val.result.parameters.color;
		myLog("selected Color: "+selectedColor);
		if(selectedShapeID!="" && selectedColor!=""){ //actually update the shape's color
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
	myLog("saying :"+text);
	if(recognitionRunning)	//stop recognition in case it is still running (it shouldn't)
		recognition.stop();
	speak(text, 
		function(e){
			myLog("Speech Synthesis Error: "+e);
		},
		function(){ //restart recognition after tts ends if we're in the middle of a conversation
			if(conversationRunning){
				recognition.start();
				conversationRunning = false;
			}
		});
}

// TTS functionality
function speak(text, errorCallback, endCallback) {
    var u = new SpeechSynthesisUtterance();
    u.text = text;
    u.lang = language;
	
	u.onend = endCallback;
    u.onerror = errorCallback;
	
    speechSynthesis.speak(u);
}

function myLog(text){
	console.log(text);
	log=lastLogLine+"\n"+text;
	label.setAttribute("bmfont-text","text:"+ log+";color: #333; align:center; lineHeight:30");
	lastLogLine = text;
}


AFRAME.registerComponent('start-recognition', {
	init: function () {
		this.el.addEventListener("click",function(){
			if(!recognitionRunning)
				recognition.start();
		});
	}
});