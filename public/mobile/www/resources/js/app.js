/**
 * Partners App v1.0
 * @developed_by YStudio, IL (www.ystudiodesign.com)
 * @version 1.2
 */
var partners = angular.module('Partners', []);
/* Adding Main Controller */
partners.controller('MainController', ['$scope', '$http', main_controller]);

var notifications_details = undefined;
var app_loaded = false;
var DEV_MODE = false;
var appInBackground = false;
var enterAppAjaxCalled = false;
var heightWithKBDown = null;
var keyBoardCallback = null;
var keyboardState = 'hide';

var pubNubinit = false;
var messages_to_save = {};
var server_configuration = {};
var client_configuration = {
    chat                 : {},
    notifications_counter: 0,
    notifications_map    : {}
};
var _push_notification_hanlder = undefined;
var _keyboard_listeners = {
    chat    : {show: {}, hide: {}},
    settings: {show: {}, hide: {}},
    connect : {show: {}, hide: {}},
    contact : {show: {}, hide: {}},
    home    : {show: {}, hide: {}},
    search  : {show: {}, hide: {}}
};
var _keyboard_size = {
    height: 0, width: 0
};
var socket = {};
var gotMessage = false;

function loadScript(url, callback) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.onload = callback;
    head.appendChild(script);
}

function noLoading() {
    $.mobile.loader.prototype.options.textVisible = false;
    $.mobile.loader.prototype.options.disabled = true;
    $.mobile.loadingMessage = false;
    $.mobile.loading().hide();
    $.mobile.loading('show', {text: "", textonly: false});
}

/**
 * DOM Ready
 */

function directionSwipeHandler(d) {
    var
        ce = function (e, n) {
            var a = document.createEvent("CustomEvent");
            a.initCustomEvent(n, true, true, e.target);
            e.target.dispatchEvent(a);
            a = null;
            return false
        },
        nm = true, sp = {x: 0, y: 0}, ep = {x: 0, y: 0},
        touch = {
            touchstart : function (e) {
                sp = {x: e.touches[0].pageX, y: e.touches[0].pageY}
            },
            touchmove  : function (e) {
                nm = false;
                ep = {x: e.touches[0].pageX, y: e.touches[0].pageY}
            },
            touchend   : function (e) {
                if (nm) {
                    ce(e, 'fc')
                } else {
                    var x = ep.x - sp.x, xr = Math.abs(x), y = ep.y - sp.y, yr = Math.abs(y);
                    if (Math.max(xr, yr) > 20) {
                        ce(e, (xr > yr ? (x < 0 ? 'swl' : 'swr') : (y < 0 ? 'swu' : 'swd')))
                    }
                }
                nm = true
            },
            touchcancel: function (e) {
                nm = false
            }
        };
    for (var a in touch) {
        d.addEventListener(a, touch[a], false);
    }
}


/* Generic Method */
function confirmMsg(title, yesCallback, noCallback) {
    /* Show Curtain */
    showCurtain();

    /* Set Title */
    $('.confirm-box span').html(title);

    $('#confirm-no').bind('tap', function (e) {
        e.preventDefault();
        $('.confirm-box').hide(function () {
            /* Calling Method */
            if (typeof(noCallback) == 'function') noCallback();
        });

        $('#confirm-no').unbind('tap');
        $('#confirm-yes').unbind('tap');

        hideCurtain();
    });

    $('#confirm-yes').bind('tap', function (e) {
        e.preventDefault();

        $('.confirm-box').hide(function () {
            /* Calling Method */
            if (typeof(yesCallback) == 'function') yesCallback();
        });

        $('#confirm-no').unbind('tap');
        $('#confirm-yes').unbind('tap');

        hideCurtain();
    });

    $('.confirm-box').show();
}

/* Generic Alert */
function alertMsg(title, callback, success, fail, options) {
    /* Show Curtain */
    showCurtain();

    /* Set Title */
    $('.alert-box span').html(title);

    $('.alert-box button').bind('tap', function (e) {
        e.preventDefault();

        /* Calling Method */
        if (typeof(callback) == 'function') callback(success, fail, options);

        $('.alert-box').hide();

        $('.alert-box button').unbind('tap');

        if (!success) hideCurtain();
    });

    $('.alert-box').show();
}
/* Generic Pop-up Message */
function popupMsg(text) {
    var popUp = $('.Popup-msg');
    //popUp.css("opacity","0.5");
    popUp.html(text);

    popUp.fadeIn("slow", "swing", function () {
        setTimeout(function () {
            popUp.fadeOut("slow", "swing", function () {
                popUp.html('');
            });
        }, 1000)
    });
}

function inputMsg(title, callback, type) {
    /* Show Curtain */
    showCurtain();

    if (!type) type = 'text';

    /* Set Title */
    $('.input-box span').html(title);
    $('#input-dox-field').attr('type', type);

    $('.input-box button').bind('tap', function (e) {
        e.preventDefault();

        $('.input-box').hide();
        $('.input-box button').unbind('tap');

        hideCurtain();

        /* Calling Method */
        if (typeof(callback) == 'function') callback($('#input-dox-field').val());
        $('#input-dox-field').val('');
    });

    $('.input-box').show();
    $('#input-dox-field').focus();
}

function showCurtain() {

    $('.popup_curtain').height(screen.height);
    $('.popup_curtain').width(screen.width);
    $('.popup_curtain').css('top', 0);
    $('.popup_curtain').show();

}

function hideCurtain() {
    $('.popup_curtain').hide();
}

/**
 * Adding Listener for keyboard
 * @param {string} for_showing
 * @param {string} key
 * @param {function} callback
 */
function addKeyboardListener(for_showing, key, callback) {
    if (for_showing) {
        _keyboard_listeners[key]['show'] = callback;
    } else {
        _keyboard_listeners[key]['hide'] = callback;
    }
}

/**
 * Removing Listener from keyboard
 * @param {boolean} for_showing
 * @param {string} key
 */

/**
 * Starting the listeners
 */


/**
 * Landing Page Animation
 * @return {void}
 */
function applyLandingAnimation(_steps, callback) {
    var _number_of_steps = (Object.keys(_steps).length - 1);
    var _step = 0;

    var interval = setInterval(function () {
        /* Aborting Interval */
        if (_step == _number_of_steps) {
            clearInterval(interval);
            /* Calling Callback */

            $('.landing-logo').css('height', '180px');

            if (typeof(callback) == 'function') callback();
        }

        /* Set Position */
        var x = _steps['step_' + _step]['x'];
        var y = _steps['step_' + _step]['y'];

        $('.landing-logo').css('background-position', x + 'px ' + y + 'px');

        /* Appending Number to Counter */
        _step++;
    }, 80);
}

/**
 * Apply Add Partners Animation
 * @param {Object} _steps
 * @param {DOMElement} element
 * @param {function} callback
 */
function applyAddPartnerAnimation(_steps, element, callback) {
    var _number_of_steps = (Object.keys(_steps).length - 1);
    var _step = 0;

    var interval = setInterval(function () {
        /* Aborting Interval */
        if (_step == _number_of_steps) {
            clearInterval(interval);
            /* Calling Callback */
            if (typeof(callback) == 'function') callback(element);
        }

        /* Set Position */
        var x = _steps['step_' + _step]['x'];
        var y = _steps['step_' + _step]['y'];

        element.css('background-position', x + '% ' + y + '%');

        /* Appending Number to Counter */
        _step++;
    }, 50);
}


/* */
function addSearch(activity) {
    var last = SearchPage.getLastSearches();

    var index = last.indexOf(activity);
    if (index != -1)
        last.splice(index, 1);

    last.unshift(activity);

    if (last.length == 6)
        last.pop();
    var last_searches = last.join(':');

    PStorage.set('last_searches', last_searches);
}

function getFeaturedActivities() {
    return server_configuration['featured'];
}

function selectPreviousActivity(e) {
    e.preventDefault();

    if (_select_prev_move) {
        _select_prev_move = false;
        return;
    }

    SearchPage.hideSearchComponents();


    $('.static-logo-active').bind('tap', function (e) {
        e.preventDefault();

        navigator.notification.vibrate(1000);
    });

    $('#search_field').val(ucfirst($(this).attr('data-activity')));
    performSearch();
}

var _select_prev_move = false;

function previousReset() {
    _select_prev_move = false;
}

function previousMoved() {
    _select_prev_move = true;
}

function selectSuggestedActivity(e) {
    e.preventDefault();

    if (_select_prev_move) {
        _select_prev_move = false;
        return;
    }

    SearchPage.hideSearchComponents();

    /*
     $('.static-logo').addClass('static-logo-active').addClass('static-logo-result');
     $('.search-wrapper').addClass('search-wrapper-result');
     SearchPage.resultsInputHeight();
     */

    $('.static-logo-active').bind('tap', function (e) {
        e.preventDefault();
        navigator.notification.vibrate(1000);
    });

    $('#search_field').val($(this).attr('data-value'));
    performSearch();
}

/* Performing Search (Go-Button) */
function performSearch(event, appendParams) {
    Draw.setRuntimeKey('perform_search', true);

    var q = SearchPage.controller();
    if (q.facebookFriend.hasClass('icon-facebook3'))
        q.facebookFriend.velocity({opacity: 0}, {
            duration: 100,
            complete: function () {
                q.facebookFriend.unbind('tap')
            }
        });

    if (q.settingsMenu.hasClass('icon-menu')) {
        q.settingsMenu.velocity({opacity: 0}, {
            duration: 100,
            complete: function () {
                q.settingsMenu.removeClass('icon-menu');
                q.settingsMenu.addClass('icon-arrow-back');
                q.settingsMenu.velocity({opacity: 1}, {duration: 100});
            }
        })
    }

    q.headerLabel.hide();
    var value = q.input.val();
    /* Verify Length of Value */
    if (!value.length) {
        return Draw.setRuntimeKey('perform_search', false);
    }

    if (Draw.getRuntimekey('perfom_search')) {
        console.log('Already Searching...');
        return;
    }

    /* Notify about new search */
    if (typeof(PStorage.get('is_first_search')) == 'undefined') {
        alertMsg(server_configuration.custom_messages.first_search);
        PStorage.set('is_first_search', true);
    }

    /* Set Flag */
    Draw.resetFocus();
    coolLoad(true);

    /* Build Parameters for query */
    var finishedFadingOut = false, finishedSearching = false;
    if (!appendParams) {
        var oldResults = q.mainBody.children();
        oldResults.children().velocity('fadeOut', function () {
            oldResults.remove();
            finishedFadingOut = true;
            if (finishedSearching)
                gotPartners(globalResponse);
        });
    }
    else
        finishedFadingOut = true;

    var params = (appendParams) ? appendParams : searchParams(value, 1);
    var globalResponse = null;

    var gotPartners = function (response) {
        /* Verify Bluring */
        //$('#search_field').trigger('blur');
        Draw.setRuntimeKey('perform_search', false);

        /* Decoding */
        if (typeof(response) == 'string') {
            response = JSON.parse(response);
        }

        var _STATUSES = {
            activity_exist: 0,
            plural        : 1,
            new_activity  : 2
        };

        /* Set Metadata to Activity Meta */
        var activity_meta = response.message.data;
        var members = response.message.members.members;
        var searched = response.message.members.searched;

        /* Set as Cache */
        client_configuration['last_search'] = {
            meta   : activity_meta,
            members: members
        };
        if (!client_configuration['results'].meta.activity && typeof client_configuration['results'].searched.search_female != 'undefined')
            client_configuration['oldResults'] = client_configuration['results'];

        client_configuration['results'] = {
            meta          : activity_meta,
            searched      : searched,
            maxMembers    : (searched.searchIteration == 1) ?
                0 : client_configuration['results'].maxMembers + client_configuration['results'].currentMembers,
            currentMembers: members.length,

            members: (searched.searchIteration == 1)
                ? members : client_configuration['results'].members.concat(members)
        };

        /* Activity Exist */
        if (response.message.status == _STATUSES['activity_exist'] && members[0]) {
            return activityFound(activity_meta, members, searched);
        }
        /* in case of no memebers */
        if (response.message.status == _STATUSES['activity_exist'] && !members[0]) {
            return activityWithoutMembers(activity_meta);
        }

        if (response.message.status == _STATUSES['new_activity']) {
            return activityCreated(activity_meta);
        }

        if (response.message.status == _STATUSES['plural']) {
            return pluralFound(activity_meta);
        }
    };


    $.ajax({
        url    : BASE_SERVER + '/activity/getPartners',
        data   : params,
        success: function (response) {
            finishedSearching = true;
            if (finishedFadingOut)
                gotPartners(response);
            else {
                globalResponse = response
            }
        },
        error  : function (response) {
            console.log('performSearch: cant connect to server. response : ' + JSON.stringify(response));
            alertMsg('Unable to connect to server. Check connection and press Ok', performSearch);
        }
    });

    /* Adding Activity to local */
    addSearch(value);
}


/**
 * Activity Found Function
 * @param {Object} meta
 * @param {Object} memebers
 */
function activityFound(meta, members, searched) {
    //Draw.switchSettings2Back();

    Draw.displayResultRow(members, searched);
}

/**
 * Display No Members Result
 * @param {Object} meta
 */
function activityWithoutMembers(meta) {
    Draw.switchSettings2Back();
    Draw.displayNoMembers(meta);
}

function pluralFound(meta) {
    Draw.displayPluralResult(meta);
}

/**
 * Activity Crearted Function
 *
 */
function activityCreated(meta) {
    Draw.switchSettings2Back();
    Draw.displayNoMembers(meta);
    //Draw.displayNewActivity();
}

/**
 * Open Chat From Results
 * @{DomEvent} event
 */
function getUser(element, getParent, fromProfile) {
    if ($(element).hasClass('icon-bubbles2'))
        getParent = false;
    element = (!getParent) ? $(element).parent() : $(element);
    var storeIndex = element.attr('data-usernum');
    var resultsOrConnections = element.attr('store');
    var userObj = client_configuration[resultsOrConnections].members[storeIndex];
    userObj.storeIndex = storeIndex;
    userObj.store = resultsOrConnections;
    userObj.fromChat = element.attr('from-chat');
    if (userObj.fromChat)
    //userObj.is_online =( $('#online-status-'+userObj.storeIndex).html().length > 2) ? 1 : 0;
        userObj.is_online = ( $('.chat-page .screen-title > div :first-child').html().length > 2) ? 1 : 0;
    else
        userObj.is_online = element.find('.row-partner-online').css('opacity');

    if (!userObj.relation) {
        if (typeof client_configuration[resultsOrConnections].meta != 'undefined')
            var relation = client_configuration[resultsOrConnections].meta.activity;
        if (!relation) {
            relation = (userObj.sharedActivities.length > 1 ) ?
                'Many In Common' :
                (userObj.sharedActivities[0]) ?
                    userObj.sharedActivities[0] : 'From Your Area';
        }
        if (!fromProfile)
            userObj.relation = relation;
    }

    return userObj;
}

function openChat(e) {
    if (e)
        e.preventDefault();

    var userObj = getUser(this, true);

    hideProfilePreview(null, function () {

    });

    client_configuration['chat']['chat_user'] = userObj;

    Draw.switchPages(Draw.showChatPage(userObj));
    resetNotificationForUser(userObj.user);

    if (!userObj.is_partners) {
        createPartnersConnection(userObj.user, userObj['relation']);
        addingStrangerAsLocalPartner(userObj);
    }
}


/**
 * Adding the current user as local partner
 * @param {object} userObj
 */

function addingStrangerAsLocalPartner(userObj, callback) {
    userObj.is_partners = 1;
    updateStoredUsers(userObj.user, 'is_partners', 1);
    var user_object = jQuery.extend(true, {}, userObj);
    delete user_object.location;
    delete user_object.is_online;
    if (!PStorage.get('chat-friends')) {
        PStorage.set('chat-friends', JSON.stringify({}), function () {
            addingStrangerAsLocalPartner(user_object);
        });
        return;
    }

    var list = PStorage.get('chat-friends');
    if (list) list = JSON.parse(list);
    list['chat_user_' + user_object.user] = user_object;

    if (client_configuration['chat-friends'])
        client_configuration['chat-friends'].members[user_object.user + ''] = userObj;


    PStorage.set('chat-friends', JSON.stringify(list), function () {
        if (callback) callback();
    }); // Saving
}
function addingManyLocalPartner(user_objects, mainCallback, notFirst) {

    if (!PStorage.get('chat-friends')) {
        PStorage.set('chat-friends', JSON.stringify({}), function () {
            addingManyLocalPartner(user_objects, mainCallback, notFirst);
        });
        return;
    }

    var list = PStorage.get('chat-friends');
    if (list) list = JSON.parse(list);
    for (var prop  in user_objects) {
        user_objects[prop].is_partners = 1;
        list['chat_user_' + user_objects[prop].user] = user_objects[prop];
        if (!notFirst) // like saying if first
            client_configuration['chatFriendsMap'].addToSet(String(user_objects[prop].user))
    }
    asyncParallel([
        function (callback) {
            if (!notFirst)
                PStorage.set('chatFriendsMap', JSON.stringify(client_configuration['chatFriendsMap']), callback);
            else
                callback();
        },
        function (callback) {
            PStorage.set('chat-friends', JSON.stringify(list), callback);
        }
    ], function () {
        if (mainCallback) mainCallback();

    });
    /*
     if (!notFirst)
     PStorage.set('chatFriendsMap', JSON.stringify(client_configuration['chatFriendsMap']));
     PStorage.set('chat-friends', JSON.stringify(list), function () {
     if (mainCallback) mainCallback();
     }); // Saving
     */
}


/**
 * Removing Partners Based Partner ID
 * @param {int} partner_id
 */
function removePartners(partner_id) {
    $.ajax({
        url  : BASE_SERVER + '/user/removePartners' + '?cb=' + (new Date().getTime()),
        type : 'POST',
        data : {
            session   : userModel.get('session'),
            partner_id: partner_id
        },
        error: function (response) {
            /* Google Analytics? */
            sendEevent(HTTP_ERROR, 'remove-partner');
        }
    })
}

function removeLocalPartner(user_id) {
    /* Remove from server as Well */
    updateStoredUsers(user_id, 'is_partners', 0);
    removePartners(user_id);

    client_configuration['chatFriendsMap'] =
        spliceAndUnshift(client_configuration['chatFriendsMap'], user_id, true);
    var local_list = JSON.parse(PStorage.get('chat-friends'));
    if (!local_list) {
        console.log('Failed with local list');
        return;
    }
    client_configuration['chat-friends'].members.splice(user_id, 1);

    if (!local_list['chat_user_' + user_id]) return;

    /* Deleting */
    delete local_list['chat_user_' + user_id];
    PStorage.set('chat-friends', JSON.stringify(local_list));
}

/**
 * Create Partners Connection Between 2 Users
 * @param {int} partner_id
 */
function createPartnersConnection(partner_id, activity) {
    /* Reset Focus */
    Draw.resetFocus();

    $.ajax({
        url  : BASE_SERVER + '/user/setPartners' + '?cb=' + (new Date().getTime()),
        type : 'POST',
        data : {
            session   : userModel.get('session'),
            partner_id: partner_id,
            activity  : activity
        },
        error: function (response) {
            /* Google Analytics? */
            sendEevent(HTTP_ERROR, 'create-partners-connection');
        }
    });
}

function showProfileNew(e, fromChat) {
    if (e)
        e.preventDefault();

    var userObj = getUser(this, null, true);

    coolLoad(true);
    if (keyboardState == 'hide')
        Draw.showPartnerProfileNew(userObj, userObj.storeIndex, userObj.fromChat);
    else {
        if (userObj.fromChat)
            Draw.resetFocus();
        keyBoardCallback.setFunc(function () {
            Draw.showPartnerProfileNew(userObj, userObj.storeIndex, userObj.fromChat);
        })
    }
}


/**
 * Blocking User
 */
function blockUser(user_id) {
    console.log();
    var ajaxFunc = function () {
        $.ajax({
            url    : BASE_SERVER + '/user/blockUser' + '?cb=' + (new Date().getTime()),
            data   : {
                user_id: user_id,
                session: userModel.get('session')
            },
            type   : "POST",
            success: function (response) {
                /* Parsing Response */
                response = JSON.parse(response);

                if (response.code == 0) {
                    $('#result_user_' + user_id).remove();
                    return hideProfilePreview();
                }
            },
            error  : function () {
                /* Google Analytics? */
            }
        });

    };
    if ($('.row-partner-block').html() == "Block")
        confirmMsg('ARE YOU SURE ABOUT BLOCKING THIS USER?', ajaxFunc);
    else
        ajaxFunc();

    /* Report User? */
    /*
     confirmMsg('DO YOU WANT TO REPORT THIS USER?', function () {
     */
    /* Performing User Report */
    /*

     reportUser(user_id, 'REPORT REASON');

     }, function () {
     */
    /* Google Analytics? */
    /*

     sendEevent(HTTP_ERROR, 'block-user');
     });
     */

    //});
}

/* Performing User Report */
function reportUser(user_id, reason) {
    $.ajax({
        url    : BASE_SERVER + '/user/report' + '?cb=' + (new Date().getTime()),
        data   : {
            user_id    : user_id,
            report_text: reason,
            session    : userModel.get('session')
        },
        type   : "POST",
        success: function (response) {
            /* Parsing Response */
            response = JSON.parse(response);

            if (response.code == 0) {
                $('#result_user_' + user_id).remove();
                return hideProfilePreview();
            }
        },
        error  : function () {
            /* Google Analytics? */
            sendEevent(HTTP_ERROR, 'report-user');
        }
    });
}

/**
 * Hiding Profile Preview
 */
function hideProfilePreview(e, callback) {
    if (e)
        e.preventDefault();

    $('.partner-profile').velocity('transition.slideDownOut', function () {
        $('.partner-profile').remove();
        if (callback)
            callback();
    });
}

/* When User Tap the Back button */
function chatBackButton(e) {
    if (e) e.preventDefault();
    client_configuration['chat']['chat_user'] = undefined;
    if ( typeof cordova != 'undefined')
        cordova.plugins.Keyboard.close();
    //ChatPage.keyboardDidHide;

    Draw.switchBack();
}

/* Pushing Message to Local Storage */
function pushMessage(user_id, chat_message, who) {
    var storage_key = 'chat_user_' + user_id;
    var storage_object = PStorage.get(storage_key);
    /* */
    if (typeof(storage_object) == 'undefined') {
        storage_object = [];
    }
    else {
        storage_object = JSON.parse(storage_object);
    }

    /* Initializing Array */
    if (typeof(storage_object) == 'undefined') storage_object = [];

    storage_object.push({
        who    : who,
        message: chat_message,
        time   : (new Date()).getTime()
    });


    PStorage.set(storage_key, JSON.stringify(storage_object));
}

/**
 * Increasing Notification Counter By One
 */
function increaseNotificationCounter(sender) {
    client_configuration['notifications_counter']++;
    $('.notifications').html(client_configuration['notifications_counter']).fadeIn(200);

    if (!client_configuration.notifications_map['user_' + sender]) {
        client_configuration.notifications_map['user_' + sender] = 0;
    }

    client_configuration.notifications_map['user_' + sender]++;
}

function resetNotificationForUser(sender) {
    if (!client_configuration.notifications_map['user_' + sender]) return;

    var notification_number = client_configuration.notifications_map['user_' + sender];
    client_configuration.notifications_map['user_' + sender] = 0;

    client_configuration['notifications_counter'] = (client_configuration['notifications_counter'] - notification_number);
    if (client_configuration['notifications_counter'])
        $('.notifications').html(client_configuration['notifications_counter']).fadeIn(200);
    else
        $('.notifications').html(client_configuration['notifications_counter']).fadeOut(200);


    $('#connection-messages-counter-' + sender).css('visibility', 'hidden');
    $('#connection-messages-counter-' + sender + ' span').html(0);
}

/**
 * Resetting Notifiaciton Counter
 */
function resetNotificationCounter() {
    client_configuration['notifications_counter'] = 0;
    $('.notifications').html(client_configuration['notifications_counter']).fadeOut(200);
    client_configuration.notifications_map = {};
}

/**
 * Remove Registration from Notification Service
 * @return {void}
 */
function unregisterNotification() {
    _push_notification_hanlder = window.plugins.pushNotification;
    _push_notification_hanlder.unregister(function (response) {
        console.log('Unregister notifications status = ' + response);
        //console.log(JSON.stringify(response));

        /* Register Notifications */
        notificationRegister();
    }, function (err) {
        console.log('err');
    });
}

/**
 * Notification Registration Handler
 * @return {void}
 */
function notificationRegister() {
    _push_notification_hanlder = window.plugins.pushNotification;

    /* Register APN Notification */
    if (device.platform == 'android' || device.platform == 'Android' || device.platform == "amazon-fireos") {
        _push_notification_hanlder.register(
            successHandler,
            notificationRegisterFailed,
            {
                "senderID": "716650648161",
                "ecb"     : "onNotification"
            });
    } else _push_notification_hanlder.register
    (
        tokenHandler,
        notificationRegisterFailed,
        {
            "badge": "true",
            "sound": "true",
            "alert": "true",
            "ecb"  : "onAppleNotification"
        }
    )
}

function successHandler(result) {
    console.log('Re-registration status = ' + result);
}
/**
 * This Function is called when application is logged in
 * and the user is known.
 *
 */
var gettingMessages = false;
function initChat(cameFromNotification) {
    if (gettingMessages) return;
    gettingMessages = true;
    $.ajax({
        url    : BASE_SERVER + '/chat/getHistory',
        data   : {
            session: userModel.get('session')
        },
        success: function (response) {
            gettingMessages = false;

            /* Parsing Response */
            response = $.parseJSON(response);

            /* Create Archive Array */
            var appended = [];
            var new_messages = [];
            /* Walking over messages and appending them to storage */
            $.each(response.message, function (index, message) {

                /* Getting the chat content */
                var storage_key = 'chat_user_' + message.sender;
                var storage_object = PStorage.get(storage_key);

                /* Verify Existance of Object */
                if (typeof(storage_object) == 'undefined') {
                    storage_object = [];
                }
                else {
                    storage_object = JSON.parse(storage_object);
                }

                /* Initializing Array in Case of Array */
                if (typeof(storage_object) == 'undefined') storage_object = [];

                if (!messages_to_save[storage_key]) messages_to_save[storage_key] = storage_object;

                // Split timestamp into [ Y, M, D, h, m, s ]
                var t = message.time.split(/[- :]/);
                // Apply each element to the Date function
                var d = new Date(t[0], t[1] - 1, t[2], t[3], t[4], t[5]);
                d = new Date(d.getTime() - (new Date().getTimezoneOffset() * 60000));

                messages_to_save[storage_key].push({
                    who    : 'you',
                    message: message.message,
                    time   : d.getTime()
                });

                var foreground = (notifications_details ? notifications_details['foreground'] : 0);

                new_messages.push({
                    who       : 'you',
                    message   : message.message,
                    body      : message.message,
                    time      : getMessageTime(d),
                    sender    : message.sender,
                    foreground: foreground
                });

                appended.push(message.id);

            });

            /* Saving the Messages */
            for (var key in messages_to_save) {
                /* Saving Content in PStorage */
                PStorage.set(key, JSON.stringify(messages_to_save[key]));
            }

            /* Check if it came from notification */
            if (!!new_messages.length) {
                /* Handler for Relevant Routes */
                ChatPage.onMessageReceivedHandler(new_messages, cameFromNotification);

                /*
                 if (!isIos())
                 $.ajax({
                 url    : BASE_SERVER + '/chat/appendCompleted',
                 type   : 'POST',
                 data   : {
                 messages: appended.join(',')
                 },
                 success: function (response) {

                 }
                 });
                 */
            }
            messages_to_save = [];

        },
        error  : function (response) {
            console.log('initChat: cant connect to server. response :' + JSON.stringify(response));
        }
    })
}
function onNotification(e) {
    switch (e.event) {
        case 'registered':
            if (e.regid.length > 0) {
                // Your GCM push server needs to know the regID before it can push to this device
                // here is where you might want to send it the regID for later use.
                console.log("regID = " + e.regid);
                tokenHandler(e.regid);
            }
            break;

        case 'message':
            if (e.foreground) {
                console.log('notification received in foreground');
            }
            else {  // otherwise we were launched because the user touched a notification in the notification tray.
                if (e.coldstart) {
                    console.log('COLDSTART NOTIFICATION');
                }
                else {
                    console.log('BACKGROUND NOTIFICATION-');
                }
            }
            console.log('MESSAGE -> MSG: ' + e.message);
            var convertToIos = e.payload.data;
            convertToIos.foreground = Number(e.foreground);
            onAppleNotification(convertToIos);
            break;

        case 'error':
            console.log('ERROR -> MSG:' + e.msg);
            break;

        default:
            console.log('EVENT -> Unknown, an event was received and we do not know what it is');
            break;
    }
}
/**
 * Dispatched When Apple Notification Called (APN)
 * @param {Object} data
 */
function onAppleNotification(data) {
    var body = data['body'];
    var message = decodeURIComponent(decodeURI(decodeURI(data['message'])));
    var sender = data['sender'];

    /* In Case of new partner and not simple Message */
    if (data.message && data.message == 'new_partner' && data.foreground == 0 && $('.connection-page').length == 0) return SearchPage.onMenuIcon();

    //pushMessage(sender, message, 'you');

    if (app_loaded && !gotMessage) {
        notifications_details = data;
        console.log('Message Recieved through Notificaion');
        gotMessage = !gotMessage;
        setTimeout(function () {
            gotMessage = !gotMessage
        }, 5000);
        initChat(true);
    }
}

/**
 * The handler for Apple's APN Token
 * @param
 */
function tokenHandler(response) {
    client_configuration['notifications'] = {
        status: true,
        token : response
    };
    updateToken(response);
    userModel.set('udid', response);
}
/**
 * Generic Method for Failure Callback - if
 * Somehow the notification service response badly
 */
function notificationRegisterFailed(response) {
    console.log('Register Failed: ' + response);

    client_configuration['notifications'] = {
        status: false
    };

    return;
}

/**
 * Check if String is Hebrew
 */
function isHebrew(str) {
    return (str.charCodeAt(0) > 0x590 && str.charCodeAt(0) < 0x5FF)
}

function ucfirst(str) {
    str += '';
    var f = str.charAt(0)
        .toUpperCase();
    return f + str.substr(1);
}

function InitSearchSettings(init_params) {
    PStorage.set('search_settings', JSON.stringify((init_params ? init_params : {})));
}

function InitNotificationSettings(callback) {
    PStorage.set('notifications_settings', JSON.stringify({
        notify_via_email   : (userModel.get('notifications').email ? true : false),
        notify_new_partners: (userModel.get('notifications').new_partner ? true : false)
    }), callback);
}

/**
 * This method will logout the user from the app
 * @return void
 */
function logout() {

    /* Cleanning up user's history */
    PStorage.drop();
    PStorage.init(function () {
        PStorage.set('logout', JSON.stringify({
            lat: userModel.get('latitude'),
            lon: userModel.get('longitude')
        }), function () {
            facebookConnectPlugin.logout(function () {
                location.reload();
            });

        });
    });
}

function whatsappShare(msg, image, url, success, failure) {

    var link = image;
    if (isIos())
        image = null;
    else
        image = 'http://img.youtube.com/vi/DzF85pJgzxU/mqdefault.jpg';
//    var link = ((new String(device.platform)).toLowerCase() == 'ios' ? server_configuration.links.appstore : server_configuration.links.google_play);

    window.plugins.socialsharing.shareViaWhatsApp(msg, (image ? image : null), (url ? url : link), function () {
        if (typeof(success) == 'function') success();
    }, function (errormsg) {
        if (typeof(failure) == 'function') failure(errormsg);
    });
}

/**
 *
 */
function loaderOn(selector) {
    if (!$(selector)) return;

    var height = $(selector).height();
    var width = $(selector).width();
    var left = $(selector).offset().left;
    var top = $(selector).offset().top;

    var loader = $('#loader').clone();

    loader.css('top', top).css('left', left).width(width).height(height).css('line-height', height + 'px').attr('data-id', selector.replace('.', '').replace('#', '')).appendTo($('body'));

    $('[data-id="' + selector.replace('.', '').replace('#', '') + '"]').fadeIn(200);

//	$('.loader-mask').show();
}
function chatLoaderOn(selector, opacity) {
    var offsetLeft = 0;
    if (!$(selector)) return;

    var height = $(selector).height();
    if ($(selector).width() > height) {
        offsetLeft = $(selector).width() - height;
        var width = height
    } else  width = $(selector).width();

    var left = $(selector).offset().left + (offsetLeft / 2);
    var top = $(selector).offset().top;

    var loader = $('.default-loader').clone();

    loader.css('top', top).css('left', left).width(width).height(height).appendTo($('.' + Draw.classes[Draw.currentPage()]));
    loader.fadeIn(200, function () {
        if (!!opacity) loader.css("opacity", opacity);
    });

//	$('.loader-mask').show();
}

function loaderOff(selector) {
    if (selector) {
        return $('[data-id="' + selector.replace('.', '').replace('#', '') + '"]').remove();
    }

    $('#loader').hide();
}
function chatLoaderOff(selector) {
    //if(selector) {
    //	return $('[data-id="' + selector.replace('.', '').replace('#', '') + '"]').remove();
    //}

    $('.default-loader').hide();
}

function getMessageTime(time_object) {
    var str = time_object.getYear() + 1900 + '-' + (time_object.getMonth() + 1) + '-' + time_object.getDate();
    str += ' ' + (time_object.getHours() < 10 ? '0' + time_object.getHours() : time_object.getHours()) + ':' + (time_object.getMinutes() < 10 ? '0' + time_object.getMinutes() : time_object.getMinutes());
    return str + ':00';
}

/* Check if current is iphone 4*/
function isIphone4() {
    return (device.platform == 'iOS' && screen.height == 480);

}

function isValidEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function enterApp(failiureCount, errorMsgArr, params) {
    if (enterAppAjaxCalled || app_loaded) return;
    /*
     var params = {
     fb_uid    : userModel.get('sn_user_id'),
     first_name: userModel.get('first_name'),
     last_name : userModel.get('last_name'),
     locale    : userModel.get('locale'),
     image     : 'https://graph.facebook.com/' + userModel.get('sn_user_id') + '/picture',
     birthday  : userModel.get('birthday'),
     email     : (userModel.get('email') ? userModel.get('email') : (PStorage.get('local_email') ? PStorage.get('local_email') : '')),
     latitude  : (userModel.get('latitude') ? userModel.get('latitude') : ''),
     longitude : (userModel.get('longitude') ? userModel.get('longitude') : ''),
     udid      : (userModel.get('udid') ? userModel.get('udid') : ''),
     gender    : (userModel.get('gender') ? userModel.get('gender') : 'unknown'),
     platform  : device.platform,
     newVersion: true
     };
     */
    if (device)
        params.platform = device.platform;
    params.newVersion = true;

    enterAppAjaxCalled = true;
    $.ajax({
        url    : BASE_SERVER + '/user/newEnterApp?cb=' + (new Date()).getTime(),
        data   : params,
        type   : 'POST',
        success: function (response) {
            enterAppAjaxCalled = false;
            app_loaded = true;

            if (typeof(response) == 'string') {
                response = JSON.parse(response);
            }
            fbController.sendMyFriends();

            /* Check Response Code */
            if (response.code == SERVER_SUCCESS_CODE) {
                /* Login Failed */
                if (!response.message.login_success) {
                    alertMsg('Login Failed. Please Contact the Administrator.');
                    return;
                }
                /* Set Data */
                userModel.set('user_id', response.message.uid);
                userModel.set('session', response.message.session);
                userModel.set('notifications', response.message.notifications);
                userModel.set('email', response.message.email);
                userModel.set('channel', response.message.channel);

                PStorage.set('session', response.message.session);
                if (!pubNubinit)
                    pub.init(response.message.channel + '-' + PStorage.get('first_name') + '-' + PStorage.get('last_name'));
                if (userModel.get('udid'))
                    updateToken(userModel.get('udid'));
                if (!!userModel.get('latitude'))
                    locationController.locationUpdate({
                        coords: {
                            latitude : userModel.get('latitude'),
                            longitude: userModel.get('longitude')
                        }
                    });
                var q = SearchPage.controller();
                q = SearchPage.controller();
                q.fademeIn.velocity({translateY: ['-50%']})
                    .velocity("fadeIn", {
                        complete: function () {
                            var hiddenHeader = $('#orange');
                            if (isIos7Above())
                            {
                                hiddenHeader.addClass('ios7Bar');
                                q.input.addClass('ios7Bar');
                            }

                            hiddenHeader.show();
                        }
                    });
                q.headerLabel.html("What's Your Hobby?");
                if (!q.searchOrLoc.hasClass('icon-search') && userModel.get('latitude')) {
                    q.input.velocity("fadeIn");
                    stopAnim(q.searchOrLoc);
                    loadSearchIcon(q.searchOrLoc);
                    nearPartners(1);
                }

                testLocalPartners(response.message.partners, response.message.session);

                var locationTimeout = function () {
                    setTimeout(function () {
                        locationController.enteredApp = true;
                        locationController.timeoutLocation();
                    }, 4000);
                };

                if (!userModel.get('latitude')) {
                    //loadSatAnim(SearchPage.controller().searchOrLoc);
                    //whenNoLocation(null, locationTimeout);
                }
                else
                    locationTimeout();

                pub.subscribe(response.message.channel);
                //pub.subscribe(response.message.session + response.message.channel);
                /* Init Chat Section */
                initChat();


            }
            else {
                confirmMsg('Oooops! Something Went Wrong. Do you need some help?', function () {
                    alert('Need Help');
                }, function () {
                    alert('Dont need help.');
                });
            }
        },
        error  : function (response) {
            enterAppAjaxCalled = false;
            if (locationController.enteredApp) return;
            var description = response.statusText;//JSON.parse(response).desc;
            errorMsgArr.push('enterApp (Failure number ' + (failiureCount + 1) + '): cant connect to server. response :' + description);
            console.log(errorMsgArr[failiureCount]);
            if (failiureCount == 10) {
                sendMailonError(errorMsgArr);
                alertMsg('Oops... Something went wrong... Press "OK" and we will try again!',
                    function () {
                        enterApp(0, [])
                    });
            }
            else
                setTimeout(function () {
                    enterApp(++failiureCount, errorMsgArr);
                }, 1000);
        }
    });
}

/**
 * Sending Google Analytics event based on supplied params
 * @param {string} category
 * @param {string} event
 * @param {string} label
 */
function sendEevent(category, event, label) {
    ga(category, event, label);
}

function isISO8() {
    var version_8 = new RegExp(/^8/);
    return version_8.test(device.version);
}
function updateToken(redID) {
    if (!!userModel.get('session')) {

        $.ajax(
            {
                url    : BASE_SERVER + '/user/updateToken',
                type   : 'POST',
                data   : {
                    session: userModel.get('session'),
                    token  : redID
                },
                success: function (response) {
                    /* Google Analytics? */
                    console.log('token updated');
                },
                error  : function (response) {
                    console.log('token not updated. message: ' + JSON.parse(response).message);
                    popupMsg('NO NOTIFICATIONS');
                }
            })
    }
}

function noPos() {
    var pos = {
        coords: {
            latitude : 32.100614,
            longitude: 34.875644
        }

    };
    locationController.onLocationReceived(pos);
}

function isIos7Above() {
    return (isIos() && parseInt(device.version) >= 7)

}
function sendMailonError(text) {
    return;

    for (var i = 0; i < text.length; i++) {
        var textToSend = text[i] + "<br>";

    }
    $.ajax(
        {
            url    : 'https://api.sendgrid.com/api/mail.send.json',
            type   : 'POST',
            data   : {
                api_user: 'Partnersapp',
                api_key : 'partners3434',
                to      : 'partnersapp1@gmail.com',
                toname  : 'Partners Developers',
                subject : userModel.get('first_name') + ' ' + userModel.get('last_name') + ': Failure to enterApp',
                text    : textToSend,
                from    : userModel.get('email')

            },
            error  : function (response) {
            },
            success: function (response) {
                console.log('email sent. response message: ' + response.message);
                popupMsg('Email Sent to Developer');

            }
        })
}

function isIos() {
    return (device.platform.toLowerCase() == 'ios')
}
function initIos() {
    var body = $('body');
    if (!isIos()) return;
    body.css('-webkit-touch-callout', 'none');
    body.css('-webkit-tap-highlight-color', 'rgba(0,0,0,0)');
    loadScript('fastClick.js', function () {
        $(function () {
            FastClick.attach(document.body);
        });
    });

}


function isEmpty(obj) {

    // null and undefined are "empty"
    if (obj == null) return true;

    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0)    return false;
    if (obj.length === 0)  return true;

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }

    return true;
}

var store = {};
function loadSatAnim(sat) {
    sat.velocity({translateY: ['-50%']})
        .velocity({
            opacity: 0
        },
        {
            duration: 500,
            loop    : true
        });
}
function stopAnim(sat) {

    sat.velocity('stop', true);
    sat.velocity({translateY: ['-50%']})
        .velocity({opacity: 0}, {
            duration: 100, complete: function () {
                if (app_loaded) loadSearchIcon(sat);
            }
        });
}

function loadSearchIcon(sat) {
    sat.removeClass('icon-location');
    sat.addClass('icon-search');
    sat.velocity({translateY: ['-50%']})
        .velocity({opacity: 1}, {duration: 500});

}
function nolocIcon(callback) {
    var sat = $('.main-page .location-or-nav');
    sat.velocity('stop', true);
    sat.fadeOut(function () {
        //sat.remove();
        callback();
    });
}
function whenNoLocation(root, element) {
    if (!store.root)
        store.root = root;
    if (typeof store.index == "undefined")
        store.index = 0;
    else
        store.index++;
    if (!store.elements)
        store.elements = [];
    store.elements[store.index] = element;
}

function updateOnlineStatus(m) {
    var onlineCssStatus = $('.row-partner-online.' + String(m.user));
    onlineCssStatus.css("opacity", (m.online) ? '1' : '0');
    $('#online-status-' + m.user).html((m.online) ? 'Online, ' : '');
    if (!m.online)
        $('.row-partner-last-seen').css('display', 'block');
    else
        $('.row-partner-last-seen').css('display', 'none').html('');

    if (client_configuration['chat-friends'])
        if (client_configuration['chat-friends'].members)
            if (client_configuration['chat-friends'].members[m.user])
                client_configuration['chat-friends'].members[m.user].last_seen = '';

    updateStoredUsers(m.user, 'last_seen', '');

    var onlineSTR = (m.online) ? 'online' : 'offline';
    console.log('updating user : ' + m.user + ' to : ' + onlineSTR);

}

function updateDistance(m) {

    if ($('.connection-page')[0])
        client_configuration['chat-friends'].members[m.user + ''].location = String(m.distance);

    if ($('.chat-page')[0] && $('.chat-page .screen-title').attr('data-user') == m.user)
        $('#distance').html(displayLocation(m.distance));

}

function updateOldChatFriends() {
    var oldList = PStorage.get('chat_friends');
    var newList = PStorage.get('chat-friends');
    if (!oldList || newList) return;
    oldList = JSON.parse(oldList);
    PStorage.set('chat-friends', JSON.stringify({}), function () {
        for (var prop in oldList) {
            var user = prop.split('_')[2];
            createPartnersConnection(user, oldList[prop].relation);
            addingStrangerAsLocalPartner(oldList[prop]);
        }
        PStorage.set('chat_friends', 'false');
    });
}

function testLocalPartners(partners, id, callback) {
    var localPartners = PStorage.get('chat-friends');
    var localArray = [];
    var localPartnersToAdd = [];
    if (localPartners) {
        localPartners = JSON.parse(localPartners);
        for (var prop in localPartners)
            localArray.push(prop.split('_')[2]);
    }
    client_configuration['chatFriendsMap'] = PStorage.get('chatFriendsMap');
    if (!client_configuration['chatFriendsMap'])
        client_configuration['chatFriendsMap'] = localArray;
    else
        client_configuration['chatFriendsMap'] = JSON.parse(client_configuration['chatFriendsMap']);
    for (var i = 0; i < partners.length; i++) {
        var equals = false;
        for (var j = 0; j < localArray.length; j++) {
            equals = localArray[j] == partners[i];
            if (equals)
                break;
        }
        if (!equals)
            localPartnersToAdd.push({user: partners[i]});
    }

    if (localPartnersToAdd.length)
        $.ajax({
                type   : 'POST',
                url    : BASE_SERVER + '/user/specificPartners',
                data   : {
                    session : id,
                    partners: JSON.stringify(localPartnersToAdd)

                },
                success: function (response) {
                    var partners = (JSON.parse(response)).message.partners;
                    if (!localPartners)
                        PStorage.set('chat-friends', JSON.stringify({}), function () {
                                addingManyLocalPartner(partners, callback);
                            }
                        );
                    else
                        addingManyLocalPartner(partners);

                }
            }
        );
    console.log(localPartnersToAdd);
}

function logOutPos(pos) {
    if (!pos) return false;
    pos = JSON.parse(pos);
    userModel.set('latitude', pos.lat);
    userModel.set('longitude', pos.lon);
    if (SearchPage.controller().searchOrLoc.hasClass('icon-location'))
        stopAnim(SearchPage.controller().searchOrLoc);
    PStorage.set('logout', '');
    return true;
}

function coolLoad(loaderIsLoading) {
    //var body = SearchPage.controller().mainBody;
    if (loaderIsLoading)
    //body.append(createView({
    //    tag: 'svg',
    //    cls: 'spinner',
    //    atr: [
    //        {width:'50px'},
    //        {viewBox: '0 0 66 66'},
    //        {xmlns:'http://www.w3.org/2000/svg'}
    //    ],
    //    items:[
    //        {
    //            tag: 'circle',
    //            cls: 'path',
    //            atr: [
    //                {fill:'none'},
    //                {'stroke-width':'6'},
    //                {'stroke-linecap':'round'},
    //                {cx:'33'},
    //                {cy:'33'},
    //                {r:'30'}
    //            ]
    //        }
    //    ]
    //}).build().element);
        $('.root-wrapper').append($('<div>').addClass('loader'));
    else
        $('.loader').remove();
    //$('.spinner').remove();
}
function searchParams(activity, searchIteration) {
    var params = {
        activity       : activity,
        session        : userModel.get('session'),
        cb             : (new Date().getTime()),
        searchIteration: searchIteration
    };

    var search_settings = PStorage.get('search_settings');
    /* In Case of Missing Search Settings - Initializing it */
    if (!search_settings) {
        InitSearchSettings();
    } else {
        search_settings = (JSON.parse(search_settings));
        /* Set if Search for frmales */
        params['search_female'] = (search_settings['search_female'] ? 1 : 0);
        /* Set if search for males */
        params['search_male'] = (search_settings['search_male'] ? 1 : 0);
        /* Set Max Age */
        params['max_age'] = (search_settings['search_max_age'] ? search_settings['search_max_age'] : 89);
        params['min_age'] = (search_settings['search_min_age'] ? search_settings['search_min_age'] : 17);
    }
    return params

}
var canAnimateResults = false;
var moreWasFaded = false;
function nearPartners(searchIteration, params) {
    //coolLoad();
    $.ajax({
        url : BASE_SERVER + '/user/getNearPartners',
        data: (params) ? params : searchParams(null, searchIteration),
        type: 'POST',

        success: function (response) {
            //canAnimateResults = true;
            client_configuration['results'] = {
                meta          : {activity: ''},
                searched      : response.searched,
                maxMembers    : (response.searched.searchIteration == 1) ?
                    0 : client_configuration['results'].maxMembers + client_configuration['results'].currentMembers,
                currentMembers: response.members.length,
                members       : (response.searched.searchIteration == 1)
                    ? response.members : client_configuration['results'].members.concat(response.members)
            };
            Draw.displayResultRow(response.members, response.searched);
        }
    });
}

function spliceAndUnshift(array, sender, spliceOnly) {
    sender = sender + '';
    if (array.indexOf(sender) != -1)
        array.splice(array.indexOf(sender), 1);
    if (!spliceOnly) array.unshift(sender);
    PStorage.set('chatFriendsMap', JSON.stringify(array));
    return array;
}

function displayLocation(location) {
    if (location > 1) {
        location = parseInt(location * 100) / 100;
        location += 'Km'
    }
    else {
        location = Math.round(location * 100) * 10;
        location = (!location) ? location + 5 : location;
        location += 'M'
    }
    return location
}

keyBoardCallback = {
    get      : function () {
        return keyboardState;
    },
    func     : null,
    setFunc  : function (f) {
        var self = this;
        if (!isIos())
            this.func = f;
        else {
            setTimeout(function () {
                if (window.innerHeight == heightWithKBDown) {
                    self.func = f;
                    self.run();
                }
                else
                    keyBoardCallback.setFunc(f);
            }, 50)
        }
    },
    run      : function () {
        this.func();
        this.resetFunc();
    },
    resetFunc: function () {
        this.func = null;
    }
};

function updateStoredUsers(user_id, key, online) {
    for (var i = 0; i < client_configuration.results.members.length; i++) {
        if (client_configuration.results.members[i].user == user_id)
            client_configuration.results.members[i][key] = online;
    }
    if (client_configuration.oldResults)
        for (i = 0; i < client_configuration.oldResults.members.length; i++) {
            if (client_configuration.oldResults.members[i].user == user_id)
                client_configuration.oldResults.members[i][key] = online;
        }

}

