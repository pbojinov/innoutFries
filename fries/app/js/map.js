/**
 * Author: petar
 * Date: 8/4/13
 */

var Findr = {
    Cache: {}, //app cache
    Map: {}, //load maps content
    RestClient: {}, //gets our data from the API,
    Markers: {} //map marker manager
};

Findr.Helper = function () {

    function isGoogleExist() {
        return typeof window.google === 'object';
    }

    function isGoogleMapsExist() {
        return typeof window.google.maps === 'object';
    }

    return {
        isGoogleExist: isGoogleExist,
        isGoogleMapsExist: isGoogleMapsExist
    }
}();

Findr.AlertManager = function () {

    var currentAlert,
        previousAlert;

    function alert(message, title) {
        navigator.notification.alert(
            message,            // message
            _alertDismissed,    // callback
            title,              // title
            'Done'              // buttonName
        );
    }

    // Android / BlackBerry WebWorks (OS 5.0 and higher) / iOS / Tizen
    function _alertDismissed() {

    }

    return {
        alert: alert
    }
}();

Findr.Cache = function () {

    var merchants;

    function getItem(key) {
        if (window.localStorage) {
            return window.localStorage.getItem(key);
        }
        else {
            throw 'localStorage is not supported';
        }
    }

    function setItem(key, value) {
        if (window.localStorage) {
            window.localStorage.setItem(key, value);
        }
        else {
            throw 'localStorage is not supported';
        }
    }

    function removeItem(key) {
        if (window.localStorage) {
            window.localStorage.removeItem(key);
        }
        else {
            throw 'localStorage is not supported';
        }
    }

    function clearCache() {
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

    function loadMapsScript() {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = gmapsUrl;
        document.body.appendChild(script);
    }

    /**
     * The meat of the app initialization happens here
     */
    function mapInit() {
        var center = new google.maps.LatLng(mapCenter.lat, mapCenter.lng);
        google.maps.visualRefresh = true; // Enable the visual refresh before the map is rendered
        mapOptions = {
            zoom: 8,
            center: center,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true
        };
        Findr.Map.map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

        //refactor to load after maps has loaded, otherwise we get google is undefined
        jQuery.when(Findr.RestClient.getLocations()).then(

            //success
            function (data) {
                console.log(data);
                Findr.Markers.processMarkers(data);
            },

            //fail
            function (error) {
                console.log(error);
            }
        );
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
    function setMapCenter(lat, lng) {
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
     * Pan to location smoothly
     * @param lat {float}
     * @param lng {float}
     *
     * Example usage:
     *      Findr.Map.panTo.(37.4419, -122.1419)
     */
    function panTo(lat, lng) {
        if (typeof lat === 'number' && typeof lng === 'number') {
            if (Findr.Map.map) {
                var center = new google.maps.LatLng(lat, lng);
                Findr.Map.map.panTo(center);
            }
            else {
                throw 'Cant panTo location. Reason: Map does not exist';
            }
        }
        else {
            throw 'panTo() received invalid parameters. Reason: Parameters must be a number';
        }
    }

    /**
     * Set Map Zoom Level
     * @param amount {int}
     */
    function setMapZoom(amount) {
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
    function setMapTypeId(type) {
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

    function getMapCenter() {
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
        mapInit: mapInit,

        //our main map object, expose so MarkerFactory can use
        map: map,

        //public helper functions for map
        //getters
        getMapCenter: getMapCenter,

        //setters
        setMapCenter: setMapCenter,
        setMapZoom: setMapZoom,
        setMapTypeId: setMapTypeId,
        panTo: panTo
    }

}();

Findr.RestClient = function () {

    var endpoint = 'http://innoutapi.hp.af.cm',
        routes = {
            merchants: '/merchants'
        },
        basicAuth = {
            username: 'findr',
            password: 'showmethelocations'
        };

    /**
     * Return all IN-N-OUT locations
     */
    function getLocations(limit, maxDistance) {
        var dfd = jQuery.Deferred();
        if ((limit !== undefined) && (maxDistance !== undefined)) {
            return dfd.promise();
        }
        else {
            //check localStorage first
            if (Findr.Cache.merchants) {

            }
            var url = _buildUrl('merchants'),
                auth = _buildBaseAuth();
            jQuery.ajax({
                type: 'GET',
                url: url,
                cache: true,
                dataType: 'json',
                crossDomain: true,
                headers: {'Authorization': auth},
                success: function (data) {
                    dfd.resolve(data);
                },
                error: function (error) {
                    dfd.reject(error);
                    //TODO display some error
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
    function getNearestFiveLocations(currentLocation) {
        jQuery.ajax({
            //TODO call nearest five endpoint
        });
    }

    /**
     * Help build the full API call url
     * @param route
     */
    function _buildUrl(route) {
        var url = endpoint + routes[route];
        console.log(url);
        return url;
    }

    function _buildBaseAuth() {
        var token = basicAuth.username + ':' + basicAuth.password,
            hash;
        if (typeof btoa === 'function') {
            hash = btoa(token); //native hash method
        }
        else {
            hash = Base64.encode(token); //else use library
        }
        return 'Basic ' + hash;
    }

    return {
        getLocations: getLocations,
        getNearestFiveLocations: getNearestFiveLocations
    }

}();

/**
 * Using GMaps v3 cluster manager
 * http://google-maps-utility-library-v3.googlecode.com/svn/trunk/markerclusterer/docs/reference.html
 *
 * @type {Findr.Markers}
 */
Findr.Markers = function () {

    var markers = [],
        markerIcon = 'img/sign.png',
        markerClusterer,
        markerClustererOptions = {
            maxZoom: '',
            gridSize: ''
        },
        currentMarker = null;

    function processMarkers(merchantLocations) {
        var m = merchantLocations.merchants;
        for (var i = 0, length = m.length; i < length; i++) {
            var merchant = m[i],
                lat = merchant.pos.lat,
                lng = merchant.pos.lng,
                address = merchant.address,
                city = merchant.city,
                _id = merchant._id;

            //console.log(city, address, _id, lat, lng);
            var location = new google.maps.LatLng(lat, lng);
            addMarker(location, address, 'location');
        }

        //after all markers are placed on map, add them to Cluster Manager which will display them
        setOverlaysCluster();
    }

    function setOverlaysCluster() {
        if (markers) {
            markerClusterer = new MarkerClusterer(Findr.Map.map, markers);
        }
    }

    function clearOverlaysCluster() {
        if (markerClusterer) {
            markerClusterer.clearMarkers();
        }
    }

    function addMarker(location, title, type) {
        if (type === 'user') {
            var marker = new google.maps.Marker({
                position: location,
                map: Findr.Map.map,
                animation: google.maps.Animation.DROP,
                icon: 'img/pulse.gif',
                title: title,
                optimized: false
            });
            marker.setMap(Findr.Map.map);
        }
        else if (type === 'location') {
            if ((location !== 'undefined') && (title !== 'undefined')) {
                var marker = new google.maps.Marker({
                    position: location,
                    map: Findr.Map.map,
                    icon: markerIcon,
                    title: title
                });
                google.maps.event.addListener(marker, 'click', (function (marker) {
                    return function () {
                        if (currentMarker) {
                            currentMarker.setAnimation(null);
                        }
                        currentMarker = marker;
                        if (marker.getAnimation() != null) {
                            marker.setAnimation(null);
                        }
                        else {
                            marker.setAnimation(google.maps.Animation.BOUNCE);
                        }
                    }
                })(marker));
                markers.push(marker);
            }
            else {
                throw 'Cannot set markers. Reason: Undefined parameters'
            }
        }
    }

    function toggleBounce() {

    }

    //Remove the overlays from the map, but not from array
    function clearOverlays() {
        if (markers) {
            var item;
            for (item in markers) {
                markers[item].setMap(null);
            }
        }
    }

    //Show overlay items in the array
    function showOverlayIcons() {
        if (markers) {
            var item;
            for (item in markers) {
                markers[item].setMap(Findr.Map.map);
            }
        }
    }

    /**
     * Delete all markers in the array by removing references to them
     *
     * Emptying Arrays:
     *      Good: markers.length = 0
     *      Bad: markers = [];
     */
    function deleteOverlays() {
        if (markers) {
            var item;
            for (item in markers) {
                markers[item].setMap(null);
            }
            markers.length = 0;
        }
    }

    //noinspection JSValidateTypes
    return {
        processMarkers: processMarkers,
        addMarker: addMarker,
        markers: markers,
        showOverlayIcons: showOverlayIcons
    }

}();

Findr.Geo = function () {

    var watchID = null,
        pos = {
            lat: '',
            lng: ''
        },
        positionExists = false,
        accuracy,
        geoLocationOptions = {
            maximumAge: 0,
            timeout: 30000,
            enableHighAccuracy: true
        };

    /**
     * Watches for changes to the device's current position.
     */
    function watchPosition() {
        // Throw an error if no update is received every 30 seconds
        watchID = navigator.geolocation.watchPosition(_onGeolocationSuccess, _onGeolocationError, geoLocationOptions);
    }

    /**
     * Returns the device's current position as a Position object.
     */
    function getCurrentPosition() {
        navigator.geolocation.getCurrentPosition(_onGeolocationSuccess, _onGeolocationError);
    }

    /**
     * Stop watching for changes to the device's location
     *
     * Should be called when user closes app
     */
    function clearWatch() {
        if (watchID != null) {
            navigator.geolocation.clearWatch(watchID);
            watchID = null;
        }
    }

    /**
     * get position of user coordinates if they exist
     * @returns {*}
     */
    function getPositionData() {
        if ((typeof pos.lat === 'number') && typeof pos.lng === 'number') {
            return pos;
        }
        else {
            return undefined;
        }
    }

    /**
     * navigator.geolocation callback function
     *
     * Draw the users location on the map if it exists
     * @param position
     * @private
     */
    function _onGeolocationSuccess(position) {

        console.log('we got position');
        pos.lat = position.coords.latitude;
        pos.lng = position.coords.longitude;
        accuracy = position.coords.accuracy;
        positionExists = true;

        if (Findr.Helper.isGoogleMapsExist()) {
            var location = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            Findr.Markers.addMarker(location, '', 'user');

            //Enable the user center button
            Findr.CustomUI.setup();
        }
        else {
            //TODO what do we want to do with location when we do not have maps
        }
    }

    function _onGeolocationError(error) {
        Findr.AlertManager.alert(error.message, error.code);
    }

    return {
        watchPosition: watchPosition,
        getCurrentPosition: getCurrentPosition,
        clearWatch: clearWatch,
        getPositionData: getPositionData
    }

}();

Findr.EventManager = function () {

    var events = [];

    function addEvent() {

    }

    return {
        addEvent: addEvent
    }
}();

Findr.CustomUI = function () {

    var centerLocationButton;

    function setup() {
        console.log('when dis happen');
        centerLocationButton = document.getElementById('centerLocation');
        jQuery(centerLocationButton).delay(100).animate({"opacity": "1"});
        _addEvents();
    }

    function centerLocation() {
        var coordinates = Findr.Geo.getPositionData();
        Findr.Map.panTo(coordinates.lat, coordinates.lng);
    }

    function _addEvents() {
        centerLocationButton.addEventListener('click', centerLocation, false);
    }

    return {
        setup: setup,
        centerLocation: centerLocation
    }
}();

window.onload = function () {
    Findr.Map.loadMapsScript();
    Findr.Geo.watchPosition();
};

//Wait for Cordova to load
document.addEventListener('deviceready', onDeviceReady, false);


//Cordova is ready
function onDeviceReady() {
    console.log('loaded');
}