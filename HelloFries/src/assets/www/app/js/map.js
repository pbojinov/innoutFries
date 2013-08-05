/**
 * Author: petar
 * Date: 8/4/13
 */

var Findr = {
    Setup : {}, //load maps related info
    RestClient : {} //rest client to get data
};

Findr.Setup = function () {

    var mapCenter = {
        lat: 37.7750,
        lng: 122.4183
    },
    gmapsUrl = 'http://maps.googleapis.com/maps/api/js?key=AIzaSyCBUF1Kv8dJR0xd2w2BMtxNsAMSsqU7tI0&sensor=true&callback=Findr.Setup.mapInit';

    function loadMapsScript() {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = gmapsUrl;
        document.body.appendChild(script);
    }

    function mapInit() {
        var center = new google.maps.LatLng(mapCenter.lat, mapCenter.lng);
        var mapOptions = {
            zoom: 8,
            center: center,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true
        };
        var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    }

    return {
        loadMapsScript: loadMapsScript,
        mapInit : mapInit //make public because google maps needs global function for onload callback
    };

}();

Findr.RestClient = function() {

    var endpoint = 'http://innoutapi.hp.af.cm',
        routes = {
            merchants : '/merchants'
        },
        basicAuth = {
            username : 'findr',
            password : '$showmethelocation$'
        };

    /**
     * Return all IN-N-OUT locations
     */
    function getLocations(limit, maxDistance) {
        if ((limit !== undefined) && (maxDistance !== undefined)) {

        }
        else {
            var url = buildUrl('merchants');
            jQuery.ajax({
                type: 'GET',
                url: url,
                cache: true,
                dataType: 'json',
                crossDomain: true,
                beforeSend: function(xhr){
                    xhr.setRequestHeader('Authorization', 'Basic ' + Base64.encode(basicAuth.username + ":" + basicAuth.password));
                },
                success: function (data) {
                    console.log(data);
                    return data;
                },
                error: function (error) {
                    console.log(error);
                }
            });
        }
    }


    /**
     * Return the nearest five locations to the user's location
     *
     * @param currentLocation {Object} currentLocation.lat, currnetLocation.lng
     */
    function getNearestFiveLocations(currentLocation) {
        jQuery.ajax({

        });
    }

    /**
     * Help build the full API call url
     * @param route
     */
    function buildUrl(route) {
        var url = endpoint + routes[route];
        console.log(url);
        return url;
    }

    return {
        getLocations : getLocations,
        getNearestFiveLocations : getNearestFiveLocations
    };

}();

window.onload = function() {
    Findr.Setup.loadMapsScript();
    var merchantLocations = Findr.RestClient.getLocations();
};
