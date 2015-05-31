/**
 * Created by admin on 5/31/2015.
 */
    var webURL = '';
var onDeviceReady = function () {
    $.event.special.tap.emitTapOnTaphold = false;
    Object.defineProperty(Array.prototype, 'addToSet', {
        value        : function (value) {
            if (this.indexOf(value) == -1) this.push(value)
        }, enumerable: false
    });
    heightWithKBDown = window.innerHeight;
    noLoading();
    coolLoad(true);
    //var week = 604800000; // in ms
    /* Init database */
    Draw.showPage('search');
    PStorage.init(function () {
        if (!logOutPos(PStorage.get('logout')));
        locationController.init();
        loadFacebook();
        updateOldChatFriends();
    });
    fabricatedResponse.use = false;
    var loadFacebook = function () {
        //var today = new Date().getTime();
        var lastLoggedToFace = PStorage.get('firstFacebookConnect');
        if (/*today - week > lastLoggedToFace ||*/ isNaN(String(lastLoggedToFace))) {
            console.info('logging through facebook');
            if (fabricatedResponse.use)
                fbController.loginStatusCallback(fabricatedResponse.res1);
            else
                facebookConnectPlugin.getLoginStatus(fbController.loginStatusCallback, fbController.loginStatusCallback);
        }
        else {
            SearchPage.controller().mainPage.velocity("transition.slideDownIn");
            console.info('logging with out face');
            var session = PStorage.get('user_id');
            var fbuid = PStorage.get('facebookId');
            if (session && PStorage.get('facebookId')) {
                pub.init(session + '-' + fbuid + '-' + PStorage.get('first_name') + '-' + PStorage.get('last_name'));
                pubNubinit = true;
            }

            enterApp(0, [], {
                fb_uid   : PStorage.get('facebookId'),
                udid     : (userModel.get('udid') ? userModel.get('udid') : ''),
                latitude : (userModel.get('latitude') ? userModel.get('latitude') : ''),
                longitude: (userModel.get('longitude') ? userModel.get('longitude') : '')
            });
        }
    };

    /* Init Touch */
    directionSwipeHandler(document);

    /* Check internet Connection */
    if (device.platform != 'web' && navigator.connection.type == Connection.NONE) {
        alertMsg('No Internet Connection!')
    }

    if (device.platform != 'web') unregisterNotification();

    /* Check if Whatsapp Available */
    if (!fabricatedResponse.use)
        window.plugins.socialsharing.canShareVia('whatsapp', '', null, null, null, function (e) {
            window.whatsapp_available = true;
        }, function (e) {
        });
    initIos();
    /* Document Ready jQuery */
    $(document).ready(function () {
        console.log('documentreamobile');
        /* Configure Keyboard Settings */
        if (!fabricatedResponse.use) {
            if (window.Keyboard) {
                /* Set few settings */
                Keyboard.hideFormAccessoryBar(true);
                Keyboard.shrinkView(false);

            }
            keyboardListener();
        }

        $(window).resize(function (event) {
            console.log('resize!');
            if (keyBoardCallback.func) keyBoardCallback.run();
            if (Draw.currentPage() == 'chat')
                if (ChatPage.q.content.height() < ChatPage.q.contentWithKeyboardHeight) {
                    console.log('resize! twice');
                }
        });
        sounds.init();

        navigator.splashscreen.hide();

        /* Fading the loader */
        $('.landing-loader').fadeIn();

        // Events to save battery when app is on background to stop checking gps every 15 seconds:
        document.addEventListener("pause", function () {
            if (!isIos())
                locationController.stopGettingLocation()
        }, false);
        document.addEventListener("resume", backToApp, false);
        document.addEventListener("backbutton", mainBackButton, false);


        sendEevent(VERSION, APP_VERSION);
    });
    /* Prevent Scrolling */
    document.addEventListener('touchmove', function (e) {
        e.preventDefault();
    }, false);

};

document.addEventListener("deviceready", onDeviceReady, false);
function backToApp(event, fromTimeOut) {
    if (isIos() && !fromTimeOut)
        setTimeout(function () {
            if (pub.wasInit())
                pub.unsubscribe(function () {
                    backToApp(null, true);
                });
            else
                backToApp(null, true);
        }, 0);
    else {
        if (app_loaded) {
            pub.reSubscribe();
            console.log('coming back');
            appInBackground = false;
            setTimeout(function () {
                locationController.getLocBack();
            }, 1000);
            initChat();
        }
        if (Draw.currentPage() == 'chat') {
            ChatPage.refreshScroll();
        }
    }
}
function mainBackButton() {
    var q = SearchPage.controller();
    switch (Draw.currentPage()) {
        case 'settings' :
            SettingsPage.connectBackButton();
            return;
        case 'connect' :
            ConnectionPage.connectBackButton();
            return;
        case 'chat' :
            if (!!$('.partner-profile')[0]) {
                hideProfilePreview();
                return
            }
            chatBackButton();
            return;
        case 'contact':
            ContactUs.contactBackbutton();
            return;
        case 'search' :
            if (!!$('.partner-profile')[0]) {
                hideProfilePreview();
                return;
            }
            if (q.settingsMenu.hasClass('icon-arrow-back')) {
                q.settingsMenuTapped(null, true);
                return;
            }

    }
    navigator.app.exitApp();
}

/**
 * Called By Native
 */
function appBecameActive() {
    console.log('Application Became Active');
    initChat();
}

function keyboardListener() {
    SettingsPage.setupKeyboardListeners();
    ChatPage.setupKeyboardListener();
    SearchPage.setupKeyboardListeners();
    ContactUs.setupKeyboardListeners();

    if (device.platform.toLocaleLowerCase() == 'ios') {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);
    }

    window.addEventListener('native.keyboardshow', keyboardHandler);
    window.addEventListener('native.keyboardhide', keyboardHandler);

    function keyboardHandler(e) {
        var showingORhiding = e.type.slice(15); // cutting 'native.keyboard' from native.keyboardshow
        console.log('Keyboard is: ' + showingORhiding);
        keyboardState = showingORhiding;
        var method = _keyboard_listeners[Draw.currentPage()][showingORhiding];
        if (typeof(method) == 'function') method(e.keyboardHeight);
    }
}