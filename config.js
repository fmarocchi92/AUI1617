var objectLibrary = {
    'Frigorifero': 'fridge',
    'Lampada': 'lamp',
    'Appendiabiti': 'hanger',
    'Ombrello': 'umbrella',
    'Televisione': 'tv',
    'Lavatrice': 'washingmachine'
};

var objectLimit = 3;

var selectedObjects = [];

var HttpClient = function() {
    this.get = function(aUrl, aCallback) {
        var anHttpRequest = new XMLHttpRequest();
        anHttpRequest.onreadystatechange = function() { 
            if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200)
                aCallback(anHttpRequest.responseText);
        }

        anHttpRequest.open( "GET", aUrl, true );            
        anHttpRequest.send( null );
    }
}
