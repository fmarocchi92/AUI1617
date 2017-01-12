var accessToken = "28c5fcae820143289464598b76f4967c";
var baseUrl = "https://api.api.ai/v1/";
var recognizedText = "";
var language = "it"; //"en-US"; 
var recognition;
var label;
var log = "";
var lastLogLine ="stare at a shape and say 'change the color'";
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

function enableSpeechAPI(){
	init();
	initRecognition();
}


function init () {
	//add listener to body to update label text according to the recognized text
	//(apparently if I add the listener directly to the label it doesn't capture events)
	label = document.getElementById("label");
	// document.body.addEventListener("textRecognized", function (e) {
		// myLog("Recognized:" + e.detail);
		// label.setAttribute("bmfont-text","text:"+e.detail);
		// e.stopPropagation();
    // }, false);
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
	//dispatch event containing recognized text
	var evt = new CustomEvent("textRecognized", { detail: recognizedText });
    document.body.dispatchEvent(evt);
	//send a query to api.ai to obtain the relevant features of the recognized text
}

//send a query to api.ai to obtain the relevant features of the recognized text
function apiAiQuery(recognizedText) {
	var text = recognizedText;
	$.ajax({
		type: "POST",
		url: baseUrl + "query?v=20150910",
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		headers: {
			"Authorization": "Bearer " + accessToken
		},
		data: JSON.stringify({ query: text, lang: "it", sessionId: "somerandomthing" }),
		
		success:function(data){//fire apiAiResponse event
			var evt = new CustomEvent("apiAiResponse", { detail: data });
			document.body.dispatchEvent(evt);
		},
		error: function() {
			myLog("Api.ai error");
		}
	});
}

// function setResponse(val) {
	// // myLog(val);
	// if(val.result.actionIncomplete){
		// conversationRunning = true;
	// }
	// if(val.result.action=="change_color"){
		// if(val.result.parameters.Shapes != "")
			// selectedShapeID = val.result.parameters.Shapes;
		// myLog("selected Shape: "+selectedShapeID);
		// if(val.result.parameters.color != "")
			// selectedColor = val.result.parameters.color;
		// myLog("selected Color: "+selectedColor);
		// if(selectedShapeID!="" && selectedColor!=""){ //actually update the shape's color
			// var selectedElement = document.getElementById(selectedShapeID);
			// console.log(selectedElement);
			// myLog("changing "+selectedShapeID+" color to "+selectedColor);
			// selectedElement.setAttribute("color",selectedColor);
			
			// selectedColor="";
			// selectedShapeID="";
		// }	
	// }
// }

//*************** SPEECH SYNTHESIS ********************
function tts(text){
	if(tts=="")
		return;
	myLog("tts: "+text);
	if(recognitionRunning)	//stop recognition in case it is still running (it shouldn't)
		recognition.stop();
	speak(text, 
		function(e){
			myLog("Speech Synthesis Error: "+e);
		},
		function(){ //restart recognition after tts ends if we're in the middle of a conversation
			if(conversationRunning){
				startRecognition();
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

function startRecognition(){
	if(!recognitionRunning)
		recognition.start();
}

function myLog(text){
	console.log(text);
	log=lastLogLine+"\n"+text;
	label.setAttribute("bmfont-text","text:"+ log+";color: #333; align:center; lineHeight:30");
	lastLogLine = text;
}