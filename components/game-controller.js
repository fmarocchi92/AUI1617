//begin recognition at startup
$(document).ready(function(){
		enableSpeechAPI();
		setTimeout(start,3000)
	});

var states = {
    BEGIN : "begin",
    ANSWERING : "answering",
    SEARCHING : "searching"
}
var state = states.BEGIN;

var readingClue=false;
var objectiveId="";
var currentObjectId="";

function start(){
	
	document.body.addEventListener("textRecognized", function (e) {//in case we need to do something before calling api.ai
		myLog("Recognized: " + e.detail);
		e.stopPropagation();
		if(state == states.SEARCHING && currentObjectId != objectiveId)
			apiAiQuery("NOPE");		//TODO handle looking at the wrong object
		else 
			apiAiQuery(e.detail);
    }, false);
	
	document.body.addEventListener("apiAiResponse", function(e){
		console.log("Api.ai response: "+ JSON.stringify(e.detail.result, undefined, 2));
		//check action,action incomplete and parameters to decide what to do (maybe dispatch some events?)

		var maxLength = 200; // maximum number of characters to extract
		var trimmedString = e.detail.result.fulfillment.speech;
		if(trimmedString.length > maxLength){
			//trim the string to the maximum length
			var trimmedString = e.detail.result.fulfillment.speech.substr(0, maxLength);
			//re-trim if we are in the middle of a word
			trimmedString = trimmedString.substr(0, Math.min(trimmedString.length, trimmedString.lastIndexOf(" ")));
			myLog("tts: "+e.detail.result.fulfillment.speech);
			
		}
		speak(trimmedString,
			function(e){
				myLog("Speech Synthesis Error: "+e);
			}
			,function(){ 
				if(e.detail.result.action == "solving_clue"){//pronounces the clue if there's one
					myLog(e.detail.result.parameters.clue);
					state = states.ANSWERING;
					speak(e.detail.result.parameters.clue,
						function(e){
							myLog("Speech Synthesis Error: "+e);
						}
						,function(){ //restart recognition after tts ends if we're in the middle of a conversation
							if(!recognitionRunning)
								recognition.start();
						}
					);
				}else if(e.detail.result.action == "finding_object"){
					state = states.SEARCHING;
					objectiveId = e.detail.result.parameters.object_id;
				}else{
					if(!recognitionRunning)
						recognition.start();
				}
			}
		);
	},false);
	
	//here we should send a request to api.ai and call speak with the answer instead of caling it directly with the string
	speak(
		"Ciao!"
		,function(e){
			myLog("Speech Synthesis Error: "+e);
		}
		,function(){ //restart recognition after tts ends if we're in the middle of a conversation
			if(!recognitionRunning)
				recognition.start();
		}
	);

}



AFRAME.registerComponent('start-recognition', {
	init: function () {
		var id = this.el.getAttribute("id");
		this.el.addEventListener("click",function(){
			currentObjectId = id;
			recognition.start();
			myLog("looking at "+currentObjectId+" , trying to find "+objectiveId);
		});
	}
});

