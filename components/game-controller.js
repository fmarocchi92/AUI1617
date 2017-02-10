//begin recognition at startup
$(document).ready(function(){
		enableSpeechAPI();
		setTimeout(start,5000)
	});

var states = {
	BEGIN : "begin",
	WELCOME : "welcome",
	READ_CHECK : "read_check",
	READY : "ready",
	GETTING_CLUE: "getting_clue",
	READING : "reading",
    ANSWERING : "answering",
	ASKING_SUGGESTION: "suggestion",
    SEARCHING : "searching",
	END : "end"
}
var state = states.BEGIN;
var objectsIDs = [
	"fridge",
	"umbrella",
	"lamp"
];

var objectiveIndex = 0;
var currentObjectId="";
var timeoutAnswer = 13;
var readingChild = false;
var context = "";

var debug = true;

function start(){
	
	document.body.addEventListener("textRecognized", function (e) {//in case we need to do something before calling api.ai
		myLog("Recognized: " + e.detail);
		e.stopPropagation();
		
		if(state == states.BEGIN)
			context = "";
		else
			context = objectsIDs[objectiveIndex];
		
		if(state == states.SEARCHING && currentObjectId != objectsIDs[objectiveIndex])
			apiAiQuery("wrong_object", context);		//TODO handle looking at the wrong object
		else
			apiAiQuery(e.detail, context);
    }, false);
	
	document.body.addEventListener("apiAiResponse", function(e){
		console.log("Api.ai response: "+ JSON.stringify(e.detail.result, undefined, 2));
		//check action,action incomplete and parameters to decide what to do (maybe dispatch some events?)
		// control(e);
		myLog("state: "+state+" current object: "+objectsIDs[objectiveIndex]);
		mySpeakFunction(e);
	},false);
	
	//here we should send a request to api.ai and call speak with the answer instead of caling it directly with the string
	speak(
		"Ciao!"
		,function(){ //restart recognition after tts ends if we're in the middle of a conversation
			startRecognition();
		}
	);
}

function mySpeakFunction(e){
	var maxLength = 200; // maximum number of characters to extract
	var trimmedString = e.detail.result.fulfillment.speech;
	if(debug){
		trimmedString = "prova";
	}
	if(trimmedString.length > maxLength){
		//trim the string to the maximum length
		var trimmedString = e.detail.result.fulfillment.speech.substr(0, maxLength);
		//re-trim if we are in the middle of a word
		trimmedString = trimmedString.substr(0, Math.min(trimmedString.length, trimmedString.lastIndexOf(" ")));
	}
	myLog("tts: "+e.detail.result.fulfillment.speech);
	if(trimmedString.length > 0)
		speak(trimmedString,
			function(){ 
				control(e);
			}
		);
	else
		control(e);
}

function control(e){
	switch (e.detail.result.action){
	case "can_read":
		if(e.detail.result.parameters.read == "true")
			readingChild = true;
		else
			readingChild = false;
		
		state = states.GETTING_CLUE;
		context = objectsIDs[objectiveIndex];
		apiAiQuery("get_clue", context);
		myLog("get_clue sent: "+context);
		break;
	case "get_clue":
		myLog(e.detail.result.parameters.clue); 
		//TODO DISPLAY TEXT ON A PIECE OF PAPER
		if(readingChild){
			speak(e.detail.result.parameters.can_read,
				function(){ //wait for the child to read
					startRecognition();
					// setTimeout(function(){ // ask api.ai to read for the child after a timeout
							// if(state == states.READING || !recognitionRunning){
								// readingChild = false;
								// apiAiQuery("get_clue", context);
							// }
						// }
						// , 2*timeoutAnswer*1000);
				}
			);
			state = states.READING;
			startRecognition();
		}else{
			speak(e.detail.result.parameters.clue,
			function(){ //wait for the child's answer
				startRecognition();
				// setTimeout(function(){ // ask api.ai for another suggestion if the child hasn't answered after a timeout
						// if(state == states.ANSWERING || !recognitionRunning)
							// apiAiQuery("suggest:"+suggestionNumber,context); 
					// }
					// , timeoutAnswer*1000);
				 }
			);
			state = states.ANSWERING;
			startRecognition();
		}
		break;
	case "clue_read":
		state = states.ANSWERING;
		startRecognition();
		break;
	case "finding_object":
		state = states.SEARCHING;
		break;
	case "object_found":
		myLog("OBJECT FOUND");
		objectiveIndex++;
		if(objectiveIndex >= objectsIDs.length){
			//TODO handle end of game
			apiAiQuery("end_game","");
		}else{
			context = objectsIDs[objectiveIndex];
			apiAiQuery("get_clue",context);
		}
		break;
	case "end_game":
		endGame();
		break;
	default:
		startRecognition();			
	}
}

function endGame(){
	myLog("HAI VINTO");
}

AFRAME.registerComponent('start-recognition', {
	init: function () {
		var id = this.el.getAttribute("id");
		this.el.addEventListener("click",function(){
			currentObjectId = id;
			startRecognition();
			myLog("looking at "+currentObjectId+" , trying to find "+objectsIDs[objectiveIndex]);
		});
	}
});