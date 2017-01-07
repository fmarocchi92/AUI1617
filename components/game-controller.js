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
	
function start(){
	
	document.body.addEventListener("textRecognized", function (e) {//in case we need to do something before calling api.ai
		myLog("Recognized: " + e.detail);
		e.stopPropagation();
		apiAiQuery(e.detail);
    }, false);
	
	document.body.addEventListener("apiAiResponse", function(e){
		console.log("Api.ai response: "+ JSON.stringify(e.detail.result, undefined, 2));
		//check action,action incomplete and parameters to decide what to do (maybe dispatch some events?)
		speak(e.detail.result.fulfillment.speech,
			function(e){
				myLog("Speech Synthesis Error: "+e);
			}
			,function(){ //restart recognition after tts ends if we're in the middle of a conversation
				if(!recognitionRunning)
					recognition.start();
			}
		);
	},false);
	
	//here we should send a request to api.ai and call speak with the answer instead of caling it directly with the string
	speak(
		"Ciao! Il mio nome è Roger e sono un Robot."
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
		this.el.addEventListener("click",function(){
			if(!recognitionRunning)
				recognition.start();
		});
	}
});

