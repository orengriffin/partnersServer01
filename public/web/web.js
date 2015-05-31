/**
 * Created by admin on 5/31/2015.
 */
/**
 * Created by admin on 5/31/2015.
 */
var webURL = '../mobile/www/';
var lastLoggedToFace = null;
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
        //loadFacebook();
        updateOldChatFriends();
    });
    fabricatedResponse.use = false;
    var loadFacebook = function () {
        //var today = new Date().getTime();
        lastLoggedToFace = PStorage.get('firstFacebookConnect');
        if (/*today - week > lastLoggedToFace ||*/ isNaN(String(lastLoggedToFace))) {
            console.info('logging through facebook');
            fbController.getLoginStatus(fbController.loginStatusCallback, fbController.loginStatusCallback);
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

        $(window).resize(function (event) {
            console.log('resize!');
            if (keyBoardCallback.func) keyBoardCallback.run();
            if (Draw.currentPage() == 'chat')
                if (ChatPage.q.content.height() < ChatPage.q.contentWithKeyboardHeight) {
                    console.log('resize! twice');
                }
        });
        //sounds.init();

};
