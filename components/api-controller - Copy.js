function create(){
	var config = {
		server: 'wss://api-ws.api.ai:4435/api/ws/query',
		serverVersion: '20150910', // omit 'version' field to bind it to '20150910' or use 'null' to remove it from query
		token: '4d20d9ed191a4844999c08ce3c379794',// Use Client access token there (see agent keys).
		sessionId: getJSessionId(),
		onInit: function () {
			console.log("> ON INIT use config");
		}
	};
	var apiAi = new ApiAi(config);
}

function init(){
	var config = {
		server: 'wss://api-ws.api.ai:4435/api/ws/query',
		serverVersion: '20150910', // omit 'version' field to bind it to '20150910' or use 'null' to remove it from query
		token: '4d20d9ed191a4844999c08ce3c379794',// Use Client access token there (see agent keys).
		sessionId: getJSessionId(),
		onInit: function () {
			console.log("> ON INIT use config");
		}
	};
	var apiAi = new ApiAi(config);
	apiAi.init();
	apiAi.onInit = function () {
		console.log("> ON INIT use direct assignment property");
    apiAi.open();
	};
	apiAi.onOpen = function () {
		apiAi.startListening();
	};
	apiAi.onResults = function (data) {
		var status = data.status;
		var code;
		if (!(status && (code = status.code) && isFinite(parseFloat(code)) && code < 300 && code > 199)) {
			//text.innerHTML = JSON.stringify(status);
			console.log(JSON.stringify(status));
			return;
		}
		processResult(data.result);
	};
}

function loadapi(){
console.log("loading api.ai");
//create();
init();
console.log("listening");
}

function getJSessionId(){
    var jsId = document.cookie.match(/JSESSIONID=[^;]+/);
    if(jsId != null) {
        if (jsId instanceof Array)
            jsId = jsId[0].substring(11);
        else
            jsId = jsId.substring(11);
    }
    return jsId;
}