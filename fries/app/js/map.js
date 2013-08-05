/**
 * Author: petar
 * Date: 8/4/13
 */

var Findr = {
    Setup : {}, //load maps related info
    RestClient : {} //rest client to get data
};

Findr.Setup = function () {

    var map,
        mapOptions,
        mapCenter = {
            lat: 37.7750,
            lng: 122.4183
        },
        gmapsUrl = 'http://maps.googleapis.com/maps/api/js?key=AIzaSyCBUF1Kv8dJR0xd2w2BMtxNsAMSsqU7tI0&sensor=true&callback=Findr.Setup.mapInit';

    function loadMapsScript () {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = gmapsUrl;
        document.body.appendChild(script);
    }

    function mapInit () {
        var center = new google.maps.LatLng(mapCenter.lat, mapCenter.lng);
        mapOptions = {
            zoom: 8,
            center: center,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true
        };
        map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    }

    return {
        loadMapsScript: loadMapsScript,
        mapInit : mapInit, //make public because google maps needs global function for onload callback
        map: map //expose map to MarkerFactory
    }

}();

Findr.RestClient = function () {

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
    function getLocations (limit, maxDistance) {
        var dfd = jQuery.Deferred();
        if ((limit !== undefined) && (maxDistance !== undefined)) {
            return dfd.promise();
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
                    dfd.resolve(data);
                },
                error: function (error) {
                    console.log(error);
                }
            });
            return dfd.promise();
        }
    }


    /**
     * Return the nearest five locations to the user's location
     *
     * @param currentLocation {Object} currentLocation.lat, currnetLocation.lng
     */
    function getNearestFiveLocations (currentLocation) {
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
    }

}();

Findr.Factory = function () {

    var markers = [],
        markerIcon = '../img/sign-plain.png';

    function processMarkers (merchantLocations) {
        var m = merchantLocations.merchants;
        for (var i = 0, length = m.length; i < length; i++) {
            var merchant = m[i],
                lat = merchant.pos.lat,
                lng = merchant.pos.lat,
                address = merchant.address,
                city = merchant.city,
                _id = merchant._id,
                location;

            location = new google.maps.LatLng(lat, lng);
            console.log(location);
        }
    }

    function addMarker (location) {
        var marker = new google.maps.Marker({
            position: location,
            map: Findr.Setup.map,
            icon: markerIcon
        });
        markers.push(marker);
    }

    //Remove the overlays from the map, but not from array
    function clearOverlays () {
        if (markers) {
            var item;
            for (item in markers) {
                markers[item].setMapp(null);
            }
        }
    }

    //Show overlay items in the array
    function showOverlays () {
        if (markers) {
            var item;
            for (item in markers) {
                markers[item].setMap(map);
            }
        }
    }

    //Delete all markers in the array by removing references to them
    //TODO make sure this doesn't memory leak
    function deleteOverlays () {
        if (markers) {
            var item;
            for (item in markers) {
                markers[item].setMap(null);
            }
            markers.length = 0;
        }
    }

    return {
        processMarkers: processMarkers
    }

}();

window.onload = function () {
    Findr.Setup.loadMapsScript();
    jQuery.when(Findr.RestClient.getLocations()).then(

        //success
        function(data) {
            console.log(data);
            //Findr.Factory.processMarkers(data);
        },

        //fail
        function(error) {
            console.log(error);
        }
    );
    //var merchantLocations = ''; //get back JSON
    //Findr.Factory.processMarkers(merchantLocations);
};
