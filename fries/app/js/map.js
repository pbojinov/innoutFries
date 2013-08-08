/**
 * Author: petar
 * Date: 8/4/13
 */

var Findr = {
    Setup : {}, //load maps related info
    RestClient : {} //rest client to get data
};

Findr.Cache = function() {

    var merchants;

    function getItem (key) {
        if (window.localStorage) {
            return window.localStorage.getItem(key);
        }
        else {
            throw 'localStorage is not supported';
        }
    }

    function setItem (key, value) {
        if (window.localStorage) {
            window.localStorage.setItem(key, value);
        }
        else {
            throw 'localStorage is not supported';
        }
    }

    function removeItem (key) {
        if (window.localStorage) {
            window.localStorage.removeItem(key);
        }
        else {
            throw 'localStorage is not supported';
        }
    }

    function clearCache () {
        if (window.localStorage) {
            window.localStorage.clear();
        }
        else {
            throw 'localStorage is not supported';
        }
    }

    return {
        merchants: merchants,
        getItem: getItem,
        setItem: setItem,
        remoteItem: removeItem,
        clearCache: clearCache
    }

}();

Findr.Map = function () {

    var map,
        mapOptions,
        mapCenter = {
            lat: 37.77492950,
            lng: -122.41941550
        },
        gmapsUrl = 'http://maps.googleapis.com/maps/api/js?key=AIzaSyCBUF1Kv8dJR0xd2w2BMtxNsAMSsqU7tI0&sensor=true&callback=Findr.Map.mapInit';

    function loadMapsScript () {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = gmapsUrl;
        document.body.appendChild(script);
    }

    function mapInit () {
        var center = new google.maps.LatLng(mapCenter.lat, mapCenter.lng);
        google.maps.visualRefresh = true; // Enable the visual refresh before the map is rendered
        mapOptions = {
            zoom: 8,
            center: center,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true
        };
        Findr.Map.map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    }

    /**
     * Map Helper Functions
     * Wrap google maps functions in our own API
     */

    /**
     * Set Map Center
     * @param lat {float}
     * @param lng {float}
     *
     * Example usage:
     *      Findr.Map.setMapCenter.(37.4419, -122.1419)
     */
    function setMapCenter (lat, lng) {
        if (typeof lat === 'number' && typeof lng === 'number') {
            if (Findr.Map.map) {
                var center = new google.maps.LatLng(lat, lng);
                Findr.Map.map.setCenter(center);
            }
            else {
                throw 'Cant set map center. Reason: Map does not exist';
            }
        }
        else {
            throw 'setMapCenter() received invalid parameters. Reason: Parameters must be a number';
        }
    }

    /**
     * Set Map Zoom Level
     * @param amount {int}
     */
    function setMapZoom (amount) {
        if (typeof amount === 'number') {
            if (Findr.Map.map) {
                Findr.Map.map.setZoom(amount);
            }
            else {
                throw 'Cant set map zoom. Reason: Map does not exist';
            }
        }
        else {
            throw 'setMapZoom() received invalid parameters. Reason: Parameters must be a number';
        }

    }

    /**
     * Set Map Type
     * @param type {google.maps.MapTypeId}
     */
    function setMapTypeId (type) {
        if (Findr.Map.map) {
            Findr.Map.map.setMapTypeId(type);
        }
        else {
            throw 'Cant set map type. Reason: Map does not exist';
        }
    }

    /**
     * Returns
     * @returns center {Object} center.lat, center.lng
     */

    function getMapCenter () {
        if (Findr.Map.map) {
            var center = {},
                mapCenter = Findr.Map.map.getCenter();
            center.lat = mapCenter.jb;
            center.lng = mapCenter.kb;
            return center;
        }
        else {
            throw 'Cant get map center. Reason: Map does not exist';
        }
    }

    return {

        //init functions
        loadMapsScript: loadMapsScript,

        //public google maps needs global function for onload callback
        mapInit : mapInit,

        //our main map object, expose so MarkerFactory can use
        map: map,

        //public helper functions for map
        //getters
        getMapCenter: getMapCenter,

        //setters
        setMapCenter: setMapCenter,
        setMapZoom: setMapZoom,
        setMapTypeId: setMapTypeId
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
            //check localStorage first
            if (Findr.Cache.merchants) {

            }
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
                    dfd.resolve(data);
                },
                error: function (error) {
                    dfd.reject();
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
            //TODO call nearest five endpoint
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

Findr.Markers = function () {

    var markers = [],
        markerIcon = 'img/sign-plain.png';

    function processMarkers (merchantLocations) {
        var m = merchantLocations.merchants;
        for (var i = 0, length = m.length; i < length; i++) {
            var merchant = m[i],
                lat = merchant.pos.lat,
                lng = merchant.pos.lng,
                address = merchant.address,
                city = merchant.city,
                _id = merchant._id;

            console.log(city, address, _id, lat, lng);

            var location = new google.maps.LatLng(lat, lng);
            //console.log(location);
            addMarker(location, address);
        }

        //after all markers are placed on map, show them
        showOverlays();
    }

    function addMarker (location, title) {
        if ((location !== 'undefined') && (title !== 'undefined')) {
            var marker = new google.maps.Marker({
                position: location,
                map: Findr.Map.map,
                icon: markerIcon,
                title: title
            });
            markers.push(marker);
        }
        else {
            throw 'Cannot set markers. Reason: Undefined parameters'
        }
    }

    //Remove the overlays from the map, but not from array
    function clearOverlays () {
        if (markers) {
            var item;
            for (item in markers) {
                markers[item].setMap(null);
            }
        }
    }

    //Show overlay items in the array
    function showOverlays () {
        if (markers) {
            var item;
            for (item in markers) {
                markers[item].setMap(Findr.Map.map);
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
        processMarkers: processMarkers,
        markers: markers,
        showOverlays: showOverlays
    }

}();

window.onload = function () {
    Findr.Map.loadMapsScript();
    jQuery.when(Findr.RestClient.getLocations()).then(

        //success
        function(data) {
            console.log(data);
            Findr.Markers.processMarkers(data);
        },

        //fail
        function(error) {
            console.log(error);
        }
    );
    //var merchantLocations = ''; //get back JSON
    //Findr.Markers.processMarkers(merchantLocations);
};
