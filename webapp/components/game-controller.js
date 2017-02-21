//begin recognition at startup
$(document).ready(function(){
		
		enableSpeechAPI();
		setTimeout(start,15000)
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
var objectsIDs = location.search.substr(1).split("=")[1].split(",");

var objectiveIndex = 0;
var currentObjectId="";
var timeoutAnswer = 13;
var timeoutSearch = 3;
var readingChild = false;
var context = "";
var blinkingId;
var blinkingTime = 200;
var blinkingElementScale;
var blinkingScale = 1.02;

var debug = false;
var paperPlane;
var textLabel;

var answeringTimes = {};
var searchingTimes = {};
var idToObjectName = {"hanger":"appendiabiti","fridge":"frigorifero","washingmachine":"lavatrice","lamp":"lampada","umbrella":"ombrello","chair":"sedia","tv":"tv"};
// associativeArray["one"] = "First";
// associativeArray["two"] = "Second";
// associativeArray["three"] = "Third";
var timeInit;

function start(){
	paperPlane = document.getElementById("paperPlane");
	textLabel = document.getElementById("label");
	myLog(objectsIDs);
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
		timeControls(e);
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
	if(debug && trimmedString!=""){
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

function timeControls(e){
	switch (e.detail.result.action){
		case "finding_object":
		answeringTimes[objectsIDs[objectiveIndex]]=new Date().getTime() - timeInit;
		break;
		case "object_found":
		searchingTimes[objectsIDs[objectiveIndex]]=new Date().getTime() - timeInit;
		break;
		default:
		break;
	}
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
		showClue(e.detail.result.parameters.clue);
		
		//TODO DISPLAY TEXT ON A PIECE OF PAPER
		if(readingChild){
			speak(e.detail.result.parameters.can_read,
				function(){ //wait for the child to read
					startRecognition();
					setTimeout(function(){ // ask api.ai to read for the child after a timeout
							if(state == states.READING && !recognitionRunning){
								readingChild = false;
								state=states.GETTING_CLUE;
								apiAiQuery("get_clue", context);
							}
						}
						, 1.5*timeoutAnswer*1000);
				}
			);
			state = states.READING;
			// startRecognition();
		}else{
			speak(e.detail.result.parameters.clue,
			function(){ //wait for the child's answer
				timeInit = new Date().getTime();
				myLog("TIME: "+timeInit);
				startRecognition();
				setTimeout(function(){ // ask api.ai for another suggestion if the child hasn't answered after a timeout
						if(state == states.ANSWERING && !recognitionRunning)
							speak(e.detail.result.parameters.suggestion,
								function(){
									startRecognition();	
								}
							);
					}
					, timeoutAnswer*1000);
				 }
			);
			state = states.ANSWERING;
			// startRecognition();
		}
		break;
	case "read_clue":
		timeInit = new Date().getTime();
		myLog("TIME: "+timeInit);
		state = states.ANSWERING;
		startRecognition();
		setTimeout(function(){ // ask api.ai for another suggestion if the child hasn't answered after a timeout
						if(state == states.ANSWERING && !recognitionRunning)
							speak(e.detail.result.parameters.suggestion,
								function(){
									startRecognition();	
								}
							);
					}
					, timeoutAnswer*1000);
		break;
	case "finding_object":
		timeInit = new Date().getTime();
		myLog("TIME: "+timeInit);
		hideClue();
		state = states.SEARCHING;
		setTimeout(function(){ // ask api.ai for another suggestion if the child hasn't answered after a timeout
						// if(state == states.SEARCHING)
							//start blinking
							var object = document.getElementById(objectsIDs[objectiveIndex]);
							blinkingElementScale = object.getAttribute("scale");
							blinkingId = setInterval(function(){blink(object);}, blinkingTime);
					}
					, timeoutSearch*1000);
				
		
		break;
	case "object_found":
		myLog("OBJECT FOUND in "+searchingTimes[objectsIDs[objectiveIndex]]);
		myLog("TIME: "+timeInit);
		//stop the blinking
		clearInterval(blinkingId);
		objectiveIndex++;
		if(objectiveIndex >= objectsIDs.length){
			apiAiQuery("end_game","");
		}else{
			context = objectsIDs[objectiveIndex];
			apiAiQuery("get_clue",context);
		}
		break;
	case "end_game":
		endGame();
		break;
	case "decline":
		endGame();
		break;
	default:
		startRecognition();			
	}
	myLog("state: "+state);
}

function endGame(){
	myLog("FINE");
	//print times
    for(obj in objectsIDs){
		myLog(idToObjectName[objectsIDs[obj]]+": tempo per la risposta "+answeringTimes[objectsIDs[obj]]+" , tempo per la ricerca "+searchingTimes[objectsIDs[obj]]);
	}
	// redirect
	window.location="../index.html";
}

function showClue(clue){
	paperPlane.setAttribute("visible", "true");
	for( var i=0;i<10;i++){
		clue = clue.replace(",","\n");
		clue = clue.replace(".","\n");
	}
	clue = removeAccents(clue);
	textLabel.setAttribute("bmfont-text","text:"+ clue+"; width:600; color: #333; align:center; lineHeight:30");
	// textLabel.geometry.layout.width=30;
}

function hideClue(){
	paperPlane.setAttribute("visible", "false");
	textLabel.setAttribute("bmfont-text","text: ; width:300; color: #333; align:center; lineHeight:30");
	// textLabel.layout.width=30;
}

function blink(object){
	// myLog("BLINK: "+object.id+"   scale: "+object.getAttribute("scale"));//TODO use another type of animation
	if(object.getAttribute("scale").x==blinkingElementScale.x){
		object.setAttribute("scale", ""+(blinkingElementScale.x*blinkingScale)+" "+(blinkingElementScale.z*blinkingScale)+" "+(blinkingElementScale.z*blinkingScale));
	}else{
		object.setAttribute("scale", blinkingElementScale);
	}
}

function removeAccents(text) {
    var acentos = "ÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛãàáäâèéëêìíïîòóöôùúüûÑñÇç";
    var original = "AAAAAEEEEIIIIOOOOUUUUaaaaaeeeeiiiioooouuuunncc";
    for (var i=0; i<acentos.length; i++) {
        text = text.replace(acentos.charAt(i), original.charAt(i));
    }
	// text = text.replace("è","&egrave;");
	// text = text.replace("ò","&ograve;");
	// text = text.replace("ì","&igrave;");
	// text = text.replace("à","&agrave;");
	// text = text.replace("è","&eacute;");
	// text = text.replace("ò","&oacute;");
	// text = text.replace("ì","&iacute;");
	// text = text.replace("à","&aacute;");
    return text;
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