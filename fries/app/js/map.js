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

Findr.Util = function () {

    function isGoogleExist() {
        return typeof window.google === 'object';
    }

    function isGoogleMapsExist() {
        return typeof Findr.Map.map === 'object';
    }

    function loadScript(src, callback) {
        var script = document.createElement('script'),
            loaded;
        script.setAttribute('src', src);
        if (callback) {
            script.onreadystatechange = script.onload = function () {
                if (!loaded) {
                    callback();
                }
                loaded = true;
            };
        }
        document.getElementsByTagName('head')[0].appendChild(script);
    }

    return {
        loadScript: loadScript,
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

        google.maps.event.addListener(Findr.Map.map, 'click', function(event) {
            Findr.InfoBox.close();
        });

        Findr.Util.loadScript('js/lib/infobox_packed.js', function () {
            /**
             * We know the following are loaded:
             *      - maps
             *      - markers
             *      - TODO info box
             */

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

            ).then(
                function () {
                    console.log('done loading markers');
                }
            );
        });
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

        //expose gmaps URL
        gmapsUrl: gmapsUrl,

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
        svgMarker = {
            big: 'M132.518,30.377l-11.724-12.9l-0.35,7.349L9.015,3.428l1.665,0.32c-0.214-0.023-2.102-0.32-2.322-0.32c-3.327,0-6.025,2.697-6.025,6.025c0,1.624,0.643,3.096,1.688,4.18l55.751,73.145h3.359h4.824h4.722l-3.446-5.664l0.052,0.006c0,0-0.73-1.166-1.981-3.176L65.024,74.2h-0.048c-5.961-9.614-16.818-27.256-24.133-39.914c-6.958-12.04-3.582-11.887,5.862-10.258l73.601,9.607l-0.489,6.513L132.518,30.377z',
            small: 'M22.886,5.406l-1.983-2.182l-0.059,1.243l-18.85-3.62l0.282,0.054C2.24,0.898,1.92,0.847,1.883,0.847c-0.563,0-1.019,0.456-1.019,1.019c0,0.275,0.109,0.524,0.286,0.707l9.431,12.373h0.568h0.816h0.799l-0.583-0.958l0.009,0.001c0,0-0.123-0.197-0.335-0.537l-0.385-0.633h-0.008c-1.008-1.626-2.845-4.611-4.082-6.752C6.201,4.03,6.772,4.056,8.37,4.332l12.45,1.625l-0.083,1.102L22.886,5.406z'
        },
        markerIcon = 'img/sign.png',
        userIcon = 'img/pulse.gif',
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
                data = {
                    address: merchant.address,
                    city: merchant.city,
                    id: merchant._id
                };

            //console.log(city, address, _id, lat, lng);
            var location = new google.maps.LatLng(lat, lng);
            addMarker(location, data, 'location');
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

    function addMarker(location, data, type) {
        if (type === 'user') {
            var marker = new google.maps.Marker({
                position: location,
                map: Findr.Map.map,
                animation: google.maps.Animation.DROP,
                icon: userIcon,
                optimized: false
            });
            marker.setMap(Findr.Map.map);
        }
        else if (type === 'location') {
            if ((location !== 'undefined') && (data !== 'undefined')) {
                var marker = new google.maps.Marker({
                    position: location,
                    map: Findr.Map.map,
                    icon: {
                        path: svgMarker.small,
                        fillOpacity: 1,
                        fillColor: '#FDEE11',
                        strokeColor: '#DB1F26',
                        strokeWeight: 2,
                        scale: 2
                    }
                });
                marker.specialInfo = {
                    address: data.address,
                    city: data.city,
                    _id: data._id
                };
                google.maps.event.addListener(marker, 'mousedown', (function (marker) {
                    return function () {
                        if (currentMarker) {
                            currentMarker.setAnimation(null);
                            //currentMarker.infoBox.close();
                            Findr.InfoBox.updateInfoBox(marker);
                        }
                        currentMarker = marker;
                        if (marker.getAnimation() != null) {
                            marker.setAnimation(null);
                        }
                        else {
                            marker.setAnimation(google.maps.Animation.BOUNCE);
                        }

                        //marker.infoBox.open(Findr.Map.map, this);
                        Findr.InfoBox.open(marker);
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

Findr.InfoBox = function () {

    var _bottomNav,
        _infoBox,
        _city,
        _address,
        _isVisible = false,
        _toggleSpeed = 'slow',
        _currentMarker = {
            address:'',
            city: '',
            id: ''
        }

    function updateInfoBox(marker) {
        _currentMarker.address = marker.specialInfo.address;
        _currentMarker.city = marker.specialInfo.address;
        _currentMarker.id = marker.specialInfo._id;
        _setInfoBoxData(); //set box with new data
    }

    function open(marker) {
        _currentMarker.address = marker.specialInfo.address;
        _currentMarker.city = marker.specialInfo.address;
        _currentMarker.id = marker.specialInfo._id;
        _setInfoBoxData(); //set box with new data

        _isVisible = false;
        toggleInfoBox(); //then open it up
    }

    function close() {
        _isVisible = true;
        toggleInfoBox();
    }

    function _setInfoBoxData() {
        //will always be true on first run, so we cache selectors
        if (typeof _infoBox !== 'object') {
            _infoBox = document.getElementById('infoBox');
            _city = jQuery(_infoBox).find('.city');
            _address = jQuery(_infoBox).find('.address');
        }
        _city.html(_currentMarker.city);
        _address.html(_currentMarker.address);
        jQuery(_infoBox).data('id', _currentMarker.id);
    }

    function toggleInfoBox() {
        //will always be true on first run, so we cache selectors
        if (typeof _bottomNav !== 'object') {
            _bottomNav = document.getElementById('bottomNav');
        }
        //hide it
        if (_isVisible) {
            jQuery(bottomNav).slideUp(_toggleSpeed); //slide up when visible
            _isVisible = false;
        }
        //show it
        else {
            jQuery(bottomNav).slideDown(_toggleSpeed); //slide down when hidden
            _isVisible = true;
        }
    }

    function isInfoVisible() {
        return _isVisible;
    }

    return {
        isInfoVisible: isInfoVisible,
        toggleInfoBox: toggleInfoBox,
        updateInfoBox: updateInfoBox,
        close: close,
        open: open
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

        if (Findr.Util.isGoogleMapsExist()) {
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
        centerLocationButton = document.getElementById('centerLocation');
        jQuery(centerLocationButton).delay(100).animate({"opacity": "1"});
        _addEvents();
    }

    function centerLocation() {
        var coordinates = Findr.Geo.getPositionData();
        Findr.Map.panTo(coordinates.lat, coordinates.lng);
    }

    function _addEvents() {
        centerLocationButton.addEventListener('mousedown', centerLocation, false);
    }

    return {
        setup: setup,
        centerLocation: centerLocation
    }
}();

window.onload = function () {
    Findr.Util.loadScript(Findr.Map.gmapsUrl);
    Findr.Geo.watchPosition();
};

//Wait for Cordova to load
document.addEventListener('deviceready', onDeviceReady, false);


//Cordova is ready
function onDeviceReady() {
    console.log('loaded');
}