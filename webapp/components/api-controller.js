var accessToken = "acbed591258d4dd4a76dd18a1bb69786";
var baseUrl = "https://api.api.ai/v1/";
var recognizedText = "";
var language = "it"; //"en-US"; 
var recognition;
var label;
var log = "";
var lastLogLine ="";
var selectedShapeID="";
var selectedColor="";
var recognitionRunning = false;
var conversationRunning = false;
var apiSessionId = Math.random().toString(36).replace(/[^a-z]+/g, '');
var speechActivator;

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
	 speechActivator = document.getElementById("speechActivator");
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
	speechActivator.setAttribute("material","color:#71ed7a;shader:flat");
}

function onEndRecognition(){
	myLog("end of recognition");
	recognitionRunning = false;
	speechActivator.setAttribute("material","color:#e23d3d;shader:flat");
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
function apiAiQuery(recognizedText, newContext) {
	myLog("ApiAiQuery new context: "+newContext);
	var text = recognizedText;
	if(newContext == ""){
		$.ajax({
			type: "POST",
			url: baseUrl + "query?v=20150910",
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			headers: {
				"Authorization": "Bearer " + accessToken
			},
			data: JSON.stringify({ query: text,  
									lang: "it", 
									sessionId: apiSessionId }),
			
			success:function(data){//fire apiAiResponse event
				var evt = new CustomEvent("apiAiResponse", { detail: data });
				document.body.dispatchEvent(evt);
			},
			error: function() {
				myLog("Api.ai error");
			}
		});
	}else{
		$.ajax({
			type: "POST",
			url: baseUrl + "query?v=20150910",
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			headers: {
				"Authorization": "Bearer " + accessToken
			},
			data: JSON.stringify({ query: text, 
									contexts: [{
										name: newContext,
										lifespan: 5
									}], 
									lang: "it", 
									sessionId: apiSessionId }),
			
			success:function(data){//fire apiAiResponse event
				var evt = new CustomEvent("apiAiResponse", { detail: data });
				document.body.dispatchEvent(evt);
			},
			error: function() {
				myLog("Api.ai error");
			}
		});
	}
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
function speak(text, endCallback) {
    var u = new SpeechSynthesisUtterance();
    u.text = text;
    u.lang = language;
	u.volume = 1; // 0 to 1
	u.rate = 1; // 0.1 to 10
	u.pitch = 1; //0 to 2
	u.onend = endCallback;
    u.onerror = function(e){
		myLog("Speech Synthesis Error: "+e);
	};
	
    speechSynthesis.speak(u);
}

function startRecognition(){
	if(!recognitionRunning)
		recognition.start();
}

function myLog(text){
	if(!debug){
		console.log(text);
		return;
	}
	console.log(text);
	log=lastLogLine+"\n"+text;
	label.setAttribute("bmfont-text","text:"+ log+";color: #333; align:center; lineHeight:30");
	lastLogLine = text;
}