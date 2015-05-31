/**
 * Location Controller
 */
var locationController = (function () {

    var _position = {};
    var _intervalId = 0;
    //var _cantGetLocationStr = 'We are Having trouble getting location. Make sure Location services are enabled or try getting to a more open space and press "Ok"';
    var _cantGetLocationStr = '<b>To see who is around you';
    _cantGetLocationStr += ' make sure Location Services are enabled and tap here:</b>';
    var _oldLoadingMessage = '';
    var _newLoadingMessage = 'Getting Gps Coordinates...';
    var qLoadingMask = undefined;
    var qfaceBookButton = undefined;
    var faceBookButtonEvent = undefined;
    var enteredApp = false;
    var _timeoutId = 0;
    var gettingLoc = false;

    function init() {
        if (!userModel.get('latitude') && ($('.alert-box').css("display") == "none") && !gettingLoc) {
            console.log('Getting Location..');
            gettingLoc = true;
            navigator.geolocation.getCurrentPosition(onLocationReceived, onLocationFailed, getLocationOptionsFirst());
        }
        if (!qLoadingMask)
            qLoadingMask = $('#gps');
        if (!qfaceBookButton)
            qfaceBookButton = $('button')[0];
        /* Track the location every 15 seconds */
        //initInterval();
        timeoutLocation();
    }

    function getLocBack() {
        if (!_timeoutId)
            navigator.geolocation.getCurrentPosition(onLocationReceived, intervalFail, getLocationOptionsFirst());
    }

    /* Return the Position Object */
    function getPosition() {
        return _position;
    }

    /**
     * On Location Received
     * @param {Object} position
     */
    function onLocationReceived(position) {
        _position = position;
        gettingLoc = false;
        console.log('Got Location!');
        console.log(position.coords.latitude + ", " + position.coords.longitude);
        if (!!userModel.get('latitude')) {
            var oldLocation = {
                lat: userModel.get('latitude'),
                lon: userModel.get('longitude')
            };
            if (distance(oldLocation, position.coords) > 100)
                locationUpdate(position);

        }
        else {
            storage.set(position);
            userModel.set('latitude', position.coords.latitude);
            userModel.set('longitude', position.coords.longitude);
            if (app_loaded) {
                locationUpdate(position, function () {
                    nearPartners(1);
                });
                stopAnim(SearchPage.controller().searchOrLoc);
                SearchPage.controller().input.velocity("fadeIn");
            }
        }

        //hideGettingLocation();

        timeoutLocation();
        if (!app_loaded &&                  //not allready in app
            !!userModel.get('sn_user_id')) //&&        //got backfrom facebook
            enterApp(0, []);
    }

    /**
     * On Location Failed
     * @param {Object} error
     */
    function onLocationFailed(error) {
        gettingLoc = false;
/*
        if (error.code == 1) {
            //showCurtain();
            $('.location-error-msg').show();
        }
*/
        if (error.code == error.TIMEOUT || error.code ==1)
            onLocationFailedTest(error)
    }

    function onLocationFailedTest(error) {
        console.log('no location in cache. error - ' + error.message);
        //if ($('.popup_curtain').css("display") != "none") hideCurtain();
        //hideGettingLocation();
        var oldPos = storage.get();
        if (!!oldPos.coords.latitude) {
            popupMsg('Previous location used');
            onLocationReceived(oldPos);
        }
        else {
            nolocIcon(function () {
                //alertMsg(_cantGetLocationStr, getLocationButton, onLocationReceived, onLocationFailed, getLocationOptionsSecond());
                Draw.noLocation(_cantGetLocationStr, getLocationButton, onLocationReceived, onLocationFailed, getLocationOptionsSecond());
            });
        }

    }

    function getLocationButton(success, fail, options) {
        //showGettingLocation();
        //hideCurtain();
        //loadSatAnim($('.sat'));
        console.log('getting location after fail');
        navigator.geolocation.getCurrentPosition(success, fail, options);
    }

    function intervalFail() {
        console.log('couldnt find location after login');
        //popupMsg('Location not updated');
    }

    function getLocationOptionsInterval() {
        return {
            enableHighAccuracy: true,
            maximumAge        : 4000, // should be default, just in case
            timeout           : 10000
        };
    }

    function getLocationOptionsFirst() {
        var oldPos = storage.get();
        var wasInFacebook = PStorage.get('firstFacebookConnect');
        if (!!oldPos.latitude || !!wasInFacebook)
            var timeout = 10000;
        else timeout = 20000;
        console.log('timeout is : ' + timeout);
        return {
            enableHighAccuracy: false,
            maximumAge        : 0, // cache is location of 15 minutes is ok
            timeout           : timeout
        };
    }

    function getLocationOptionsSecond() {
        return {
            enableHighAccuracy: true,
            maximumAge        : 0, // cache is location of 15 minutes is ok
            timeout           : 6000
        };
    }

    function stopGettingLocation() {
        pub.unsubscribe();
        if (pub.getInterval())
            clearInterval(pub.getInterval());
        appInBackground = true;
        if (_intervalId) {
            clearInterval(_intervalId);
            _intervalId = 0;
            console.log('stopping location interval');
        }
        if (_timeoutId) {
            clearTimeout(_timeoutId);
            _timeoutId = 0;
            console.log('stopping location timeout');
        }
    }

    /*
     lon    : position.coords.longitude,
     lat    : position.coords.latitude
     */


    function locationUpdate(position, callback) {
        storage.set(position);
        userModel.set('latitude', position.coords.latitude);
        userModel.set('longitude', position.coords.longitude);
        if (!!userModel.get('session')) {
            $.ajax(
                {
                    url    : BASE_SERVER + '/user/updateLocation',
                    type   : 'POST',
                    data   : {
                        session: userModel.get('session'),
                        lon    : position.coords.latitude,     // Its backwards on on purpose
                        lat    : position.coords.longitude
                    },
                    error  : function (response) {
                        /* Google Analytics? */
                        console.log('didnt not update location on server. response: ' + response);
                    },
                    success: function (response) {
                        if (callback) callback();
                        //popupMsg('Location Updated');
                        console.log('Location Updated in server. message: ' + JSON.parse(response).message);
                    }
                })
        }

    }

    function distance(newLocation, oldLocation) {
        if (typeof(Number.prototype.toRad) === "undefined") {
            Number.prototype.toRad = function () {
                return this * Math.PI / 180;
            }
        }
        var lat1 = newLocation.lat;
        var lon1 = newLocation.lon;
        var lon2 = oldLocation.longitude;
        var lat2 = oldLocation.latitude;


        var R = 6371; // km
        var φ1 = lat1.toRad();
        var φ2 = lat2.toRad();
        var Δφ = (lat2 - lat1).toRad();
        var Δλ = (lon2 - lon1).toRad();

        var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        var d = R * c * 1000;

        console.log('distance is ' + d);
        return d;
    }

    function initInterval() {
        if (!_intervalId && locationController.enteredApp) {
            console.log('starting location interval');
            _intervalId = setInterval(function () {
                navigator.geolocation.getCurrentPosition(onLocationReceived, intervalFail, getLocationOptionsInterval());
            }, 300000);
        }
    }

    function showGettingLocation() {
        if (!_oldLoadingMessage) _oldLoadingMessage = qLoadingMask.text();
        if (isIos7Above())
            qLoadingMask.css("top", "20px");

        qLoadingMask.text(_newLoadingMessage);
        qLoadingMask.show();

    }

    function timeoutLocation() {
        if (!_timeoutId && locationController.enteredApp) {
            console.log('starting location timeout');
            _timeoutId = setTimeout(function () {
                console.log('Getting Location.. (timeout)');
                navigator.geolocation.getCurrentPosition(onLocationReceived, intervalFail, getLocationOptionsSecond());
            }, 180000);
        }
    }

    var storage = {
        get: function () {
            var pos = {
                coords: {
                    latitude : parseFloat(PStorage.get('latitude')),
                    longitude: parseFloat(PStorage.get('longitude'))
                }
            };
            return pos;

        },
        set: function (position) {
            PStorage.set('latitude', position.coords.latitude);
            PStorage.set('longitude', position.coords.longitude);
        }

    };

    return {
        init                   : init,
        storage                : storage,
        initInterval           : initInterval,
        timeoutLocation        : timeoutLocation,
        getPosition            : getPosition,
        onLocationReceived     : onLocationReceived,
        onLocationFailed       : onLocationFailed,
        getLocationOptionsFirst: getLocationOptionsFirst,
        stopGettingLocation    : stopGettingLocation,
        enteredApp             : enteredApp,
        showGettingLocation    : showGettingLocation,
        getLocBack             : getLocBack,
        locationUpdate         : locationUpdate
    };
})();