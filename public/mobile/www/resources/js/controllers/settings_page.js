/* Settings Page */
var SettingsPage = (function () {

    var _is_scrolled = false;
    var touched = false;
    var _last_ages = {
        min: 17,
        max: 89
    };

    var settingsChanged = false;

    function getPage() {
        // Init Search Settings
        if (!PStorage.get('search_settings')) InitSearchSettings();
        if (!PStorage.get('notifications_settings')) {
            InitNotificationSettings(function () {
                Draw.switchPages(SettingsPage.getPage());
            });
            return;
        }

        var root = $('<div>').addClass('settings-page settings').height(heightWithKBDown).attr("slideTo", "right");

        // Header
        root.append(_getHeader());

        var wrapper = $('<ul>');
        // Show Me Section
        wrapper.append(_getShowMe());
        // My Intereset Section
        wrapper.append(_myInterest());
        // Appending Notifications
        wrapper.append(_getNotifications());
        // Appending Others
        wrapper.append(_getOthers());

        root.append($('<div>').addClass('settings-list-wrapper').append(wrapper));

        setTimeout(function () {   // will be fixed later
            $('.settings-page header').height($('.settings-page header').height());
            Draw.setRuntimeKey('settings_scroll', new IScroll('.settings-list-wrapper', {mouseWheel: false}));
        }, 600);
        setTimeout(function () {
            // Calculating height

            var search_settings = JSON.parse(PStorage.get('search_settings'));

            var ageSlider = $('#age_range'); //.attr("data-mini","true").attr("data-role","rangeslider");
            var values = [(search_settings['search_min_age'] ? search_settings['search_min_age'] : 17), (search_settings['search_max_age'] ? search_settings['search_max_age'] : 89)];
            var inputLeft = $('<input>');
            var inputRight = $('<input>');
            inputLeft.attr("id", "rangeLeft").attr("min", 17).attr("max", 89).attr("value", values[0]).attr("type", "range").css("display", "none");
            inputLeft.attr("name", "range-1a");
            inputRight.attr("name", "range-1b");
            inputRight.attr("id", "rangeRight").attr("min", 17).attr("max", 89).attr("value", values[1]).attr("type", "range").css("display", "none");
            //;
            ageSlider.append(inputLeft);
            ageSlider.append(inputRight);
            ageSlider.rangeslider({
                mini     : true,
                highlight: false,
                create   : function () {
                    $("[aria-labelledby='rangeRight-label']").bind("touchmove", sliderMoved).bind("touchend", sliderStop);
                    $("[aria-labelledby='rangeLeft-label']").bind("touchmove", sliderMoved).bind("touchend", sliderStop);
                }
            });

        }, 300);

        return root;
    }


    function connectBackButton(e) {
        if (e)
            e.preventDefault();
        if (settingsChanged) {
            SearchPage.controller().mainBody.children().remove(); //delete old results
            coolLoad(true);
            nearPartners(1);
            settingsChanged = false;
        }
        if ( typeof cordova != 'undefined')
            cordova.plugins.Keyboard.close();
        // Init Search Settings
        if (!PStorage.get('search_settings')) InitSearchSettings();
        var settings = JSON.parse(PStorage.get('search_settings'));

        settings['search_min_age'] = _last_ages['min'];
        settings['search_max_age'] = _last_ages['max'];

        PStorage.set('search_settings', JSON.stringify(settings));

        Draw.switchBack();
    }

    /**
     * Getting the Header
     * @return element
     */
    function _getHeader() {
        var header = $('<header>').attr("id", "settings-header");
        // Appending the Back Button
        if (isIos7Above())
            header.addClass('ios7Bar');
        // Appending the left Content Section
        var left_div = $('<div>').addClass('right-content');
        header.append(left_div);

        // Appending Screen Title
        var main_div = $('<div>').addClass('screen-title');
        main_div.append($('<div>').html('Settings')); // Set Name
        // Appending the Dtails

        header.append(main_div); // Appending to Header


        header.append($('<div>').addClass('back-button right icon-arrow-back').bind('tap', SettingsPage.connectBackButton));

        return header;
    }

    function _getShowMe() {
        var search_settings = JSON.parse(PStorage.get('search_settings'));
        var current_age = (search_settings['search_age'] ? search_settings['search_age'] : 50);

        var container = $('<li>').addClass('show-me');
        // Appending Title
        $('<div>').html('Show Me:').addClass('show-me-title').appendTo(container);

        // Appending Silder
        var slider_container = $('<div>').addClass('age-range-wrapper');

        $('<div>').html('Ages').appendTo(slider_container);
        // Slider it self
        //$('<input>').val(current_age).attr('type', 'range').attr('id', 'age_range').attr('min', '17').attr('max', '89').appendTo(slider_container).bind('touchstart', SettingsPage.sliderStart).bind('touchend', SettingsPage.sliderStop).bind('touchmove', SettingsPage.sliderMove);
        $('<div>').attr('id', 'age_range').appendTo(slider_container);//.bind('touchstart', SettingsPage.sliderStart).bind('touchend', SettingsPage.sliderStop).bind('touchmove', SettingsPage.sliderMove);
        // Slider Display
        var range_display = $('<div>').addClass('range-display');
        // Adding Sections
        var min_age = (search_settings['search_min_age'] ? search_settings['search_min_age'] : 17);
        var max_age = (search_settings['search_max_age'] ? search_settings['search_max_age'] : 89);

        $('<div>').html(min_age).appendTo(range_display);
        $('<div>').addClass('current-selection').html((parseInt(current_age) >= 89 ? '' : '')).appendTo(range_display);
        $('<div>').html(max_age).appendTo(range_display);
        slider_container.append(range_display).appendTo(container);

        // Genders
        var gender_container = $('<div>').addClass('gender');

        var male_container = $('<div>');
        $('<span>').html("Male").appendTo(male_container);
        $('<div>').addClass('male').bind('tap', SettingsPage.filterByMale).appendTo(male_container);

        if (search_settings.search_male) male_container.addClass('selected');

        var female_container = $('<div>').addClass('female');
        $('<div>').bind('tap', SettingsPage.filterByFemale).appendTo(female_container);
        $('<span>').html("Female").appendTo(female_container);

        if (search_settings.search_female) female_container.addClass('selected');

        gender_container.append(male_container).append(female_container).appendTo(container);

        //gender_container.appendTo(container);
        return container;
    }

    /* Return My Interest Section */
    function _myInterest() {
        var container = $('<li>').addClass('my-interest').bind('tap', SettingsPage.exitInterest);

        $('<div>').html('My Interests:').addClass('my-interest-title').appendTo(container);
        // Activities Container
        var activity_container = $('<div>').addClass('exist-activities');
        $('<ul>').appendTo(activity_container);

        var activity_wrapper = $('<div>').addClass('add-activity-wrapper');
        var search_prefix = $('<div>').addClass('search-prefix').addClass('settings-prefix').html('#');
        var interest_input = $('<input>').attr('tabindex', '-1').attr('type', 'text').attr('id', 'addActivityButton').attr('placeholder', '#add interest').bind('keyup', SettingsPage.onActivityKeyUp);
        if (isIos())
        {
            interest_input.css("top", "-15px");
            search_prefix.css("margin-top", "8px");
        }
        activity_wrapper.append(search_prefix);
        // Appending Input
        //$('<input>').attr('type', 'text').attr('id', 'addActivityButton').attr('placeholder', '#add interest').appendTo(activity_wrapper).bind('input', SettingsPage.onActivityKeyUp);

        interest_input.appendTo(activity_wrapper);
        //$('<input>').attr('tabindex', '-1').attr('type', 'text').attr('id', 'addActivityButton').attr('placeholder', '#add interest').appendTo(activity_wrapper).bind('keyup', SettingsPage.onActivityKeyUp);
        // Appending
        $('<button>').append($('<img>').attr('src', webURL + 'resources/images/chat_send_button.png')).bind('tap', SettingsPage.addActivity).appendTo(activity_wrapper);
        activity_wrapper.append($('<div>').addClass('autocomplete').addClass('settings-autocomplete').append($('<ul>')));

        activity_container.append(activity_wrapper).appendTo(container);

        $.ajax({
            url    : BASE_SERVER + '/user/activities?session=' + userModel.get('session'),
            success: function (response) {

                response = JSON.parse(response);
                /* Appending Elements */
                $.each(response['message'], function (index, value) {
                    $('<li>').attr('data-id', value.activity_id).append($('<span>').html('#' + value.activity)).append($('<div>').addClass('remove-activity').bind('tap', SettingsPage.removeActivity)).appendTo($('.exist-activities ul:first'));
                });

                setTimeout(function () {
                    /* Calculate and init */
                    calculateInterestWidth();
                    Draw.setRuntimeKey('settings_interest_scroll', new IScroll('.exist-activities', {
                        eventPassthrough: true,
                        scrollX         : true,
                        scrollY         : false,
                        preventDefault  : false
                    }));
                    Draw.getRuntimekey('settings_scroll').refresh();

                }, 500);
            },
            error  : function () {
                /* Google Analytics */
            }
        });

        return container;
    }

    function _getNotifications() {
        var notification_settings = JSON.parse(PStorage.get('notifications_settings'));

        var container = $('<li>').addClass('notification').bind('tap', SettingsPage.exitInterest);
        // Title
        $('<div>').html('Notifications').appendTo(container);

        var wrapper = $('<div>').addClass('requested-notification');

        var new_message_container = $('<div>').addClass('new-messages').addClass('selected');//.bind('touchend', SettingsPage.notifyNewMessages).bind('touchmove', SettingsPage.moveStarted);
        // Create Checkbox - New Message
        $('<div>').appendTo(new_message_container);
        $('<span>').html('New Message').appendTo(new_message_container);

        if (notification_settings.notify_new_messages) new_message_container.addClass('selected');

/*
        var new_partner_container = $('<div>').addClass('new-partner').bind('tap', SettingsPage.notifyNewPartners);
        // Create Checkbox - New Partners
        $('<div>').appendTo(new_partner_container);
        $('<span>').html('New Partner').appendTo(new_partner_container);
*/

        var email_notification_container = $('<div>').addClass('email-notifications').bind('tap', SettingsPage.emailNotifications);
        // Create Checkbox
        $('<div>').appendTo(email_notification_container);
        $('<span>').html('Via Email').appendTo(email_notification_container);

        //if (notification_settings.notify_new_partners) new_partner_container.addClass('selected');

        if (notification_settings.notify_via_email) email_notification_container.addClass('selected');

        wrapper.append(new_message_container).append(email_notification_container).appendTo(container);
        return container;
    }

    function _getOthers() {
        var container = $('<li>').addClass('others').bind('tap', SettingsPage.exitInterest);
        // Appending Invite
        $('<div>').attr('id', 'invite-friend').bind('tap', SettingsPage.inviteFriend);
        // Appending Questions and Answers
//		$('<h4>').attr('id', 'qna').html('Questions & Answers').appendTo(container).bind('tap', SettingsPage.onQna).bind('touchmove', SettingsPage.moveStarted);
        // Appending Terms
        $('<div>').attr('id', 'terms').html('Terms').appendTo(container).bind('tap', SettingsPage.onTerms);
        // Appending Button
        $('<div>').attr('id', 'logout').html('Logout').bind('tap', SettingsPage.onLogout).appendTo(container);
        // Appending Contact Us
        $('<div>').attr('id', 'contactUs').html('Contact us').bind('tap', SettingsPage.contactUs).appendTo(container);

        var invite_button = $('<div>').attr('id', 'invite');
        invite_button.append($('<div>').html('Invite a Friend:').addClass('invite-title'));

        // Create Facebook Invite Button
        $('<div>').addClass('settings-facebook-invite').bind('tap', SettingsPage.facebookInvite).appendTo(invite_button);
        // Adding Whatsapp Invite
        if (window.whatsapp_available) {
            var whatsapp_invite = $('<div>').addClass('settings-whatsapp-invite').bind('tap', SettingsPage.whatsappkInvite).appendTo(invite_button);
        }

        invite_button.appendTo(container);

        return container;
    }

    /* if user tapped the whatsapp invite */
    function whatsappkInvite(e) {
        e.preventDefault();

        /* Check if is scrolled */
        if (_is_scrolled) {
            _is_scrolled = false;
            return;
        }

        whatsappShare(server_configuration.custom_messages.whatsapp_message, 'http://partners-app.com/?ref=app_share_whatsapp');

    }
    function calculateInterestWidth()
    {
        /* Calculate Width */
        var total_width = 0;

        $('.exist-activities > ul').children().each(function(index, value) {
            total_width = (total_width + $(value).outerWidth(true));
        });
        /* Setup Total Width */
        $('.exist-activities > ul').width(total_width);
    }

    function whatsappSuccess(e) {
        console.log(e);
    }

    function whatsappFail(e) {
        console.log(e);
    }

    /* if user tapped the facebook invite */
    function facebookInvite(e) {
        e.preventDefault();

        /* Check if is scrolled */

        fbController.openRequest(server_configuration.custom_messages.facebook_message);

    }

    /* Turn off or on filtering */
    function filterByMale(e) {
        e.preventDefault();
        settingsChanged = true;
        // Init Search Settings
        if (!PStorage.get('search_settings')) InitSearchSettings();
        var settings = JSON.parse(PStorage.get('search_settings'));

        if ($(this).parent().hasClass('selected')) {
            // Remove Filter
            settings['search_male'] = false;
            $(this).parent().removeClass('selected');
        } else {
            // Add Filter
            settings['search_male'] = true;
            $(this).parent().addClass('selected');
        }
        PStorage.set('search_settings', JSON.stringify(settings));
    }

    function filterByFemale(e) {
        e.preventDefault();
        settingsChanged = true;
        // Init Search Settings
        if (!PStorage.get('search_settings')) InitSearchSettings();
        var settings = JSON.parse(PStorage.get('search_settings'));

        if ($(this).parent().hasClass('selected')) {
            // Remove Filter
            settings['search_female'] = false;
            $(this).parent().removeClass('selected');
        } else {
            // Add Filter
            settings['search_female'] = true;
            $(this).parent().addClass('selected');
        }

        PStorage.set('search_settings', JSON.stringify(settings));

    }

    /**
     * In Case the User Touch New Messages Section
     */
    function notifyNewMessages() {

        // Init Search Settings
        if (!PStorage.get('notifications_settings')) {
            InitNotificationSettings(function () {
                SettingsPage.notifyNewMessages();
            });
            return;
        }
        var settings = JSON.parse(PStorage.get('notifications_settings'));

        if ($(this).hasClass('selected')) {
            // Remove Filter
            settings['notify_new_messages'] = false;
            $(this).removeClass('selected');
        } else {
            // Add Filter
            settings['notify_new_messages'] = true;
            $(this).addClass('selected');
        }

        PStorage.set('notifications_settings', JSON.stringify(settings));

    }

    /**
     * In Case the User Touch New Partners Section
     */
    function notifyNewPartners(e) {
        e.preventDefault();

        // Init Search Settings
        //if(!PStorage.get('notifications_settings')) InitNotificationSettings();
        var settings = JSON.parse(PStorage.get('notifications_settings'));

        if ($(this).hasClass('selected')) {
            // Remove Filter
            settings['notify_new_partners'] = false;
            $(this).removeClass('selected');
        } else {
            // Add Filter
            settings['notify_new_partners'] = true;
            $(this).addClass('selected');
        }

        PStorage.set('notifications_settings', JSON.stringify(settings));

        $.ajax({
            url : BASE_SERVER + '/user/notification',
            data: {
                type   : 'newPartner',
                session: userModel.get('session'),
                status : (settings['notify_new_partners'] ? 1 : 0)
            },
            type: "POST"
        });

    }

    /**
     * Do Email Notifications
     */
    function emailNotifications(e) {
        e.preventDefault();

        // Init Search Settings
        //if(!PStorage.get('notifications_settings')) InitNotificationSettings();
        var settings = JSON.parse(PStorage.get('notifications_settings'));

        if ($(this).hasClass('selected')) {
            // Remove Filter
            settings['notify_via_email'] = false;
            $(this).removeClass('selected');
        } else {
            // Add Filter
            settings['notify_via_email'] = true;
            $(this).addClass('selected');
        }

        PStorage.set('notifications_settings', JSON.stringify(settings));

        $.ajax({
            url : BASE_SERVER + '/user/notification',
            data: {
                type   : 'viaEmail',
                session: userModel.get('session'),
                status : (settings['notify_via_email'] ? 1 : 0)
            },
            type: "POST"
        });

    }

    /**
     * When User Touch The Search Event
     * @param {DOM#Event} event
     */
    function addActivity(e) {
        e.preventDefault();
        var input = $('#addActivityButton');
        if (!input.val().length) {
            console.log('Empty Field. Aborting...');
            return;
        }

        $.ajax({
            url    : BASE_SERVER + '/user/subscribeActivity',
            type   : 'POST',
            data   : {
                session : userModel.get('session'),
                activity: input.val()
            },
            success: function (response) {

                response = $.parseJSON(response);

                if (!response || !response['message']) {
                    /* Notify About Error */
                    return alertMsg('Something Went Wrong. Please Try Again.');
                    /* Google Analytics */
                }

                $.each(response['message'], function (index, pack) {
                    $('.exist-activities ul').prepend($('<li>').attr('data-id', pack.activity_id).append($('<span>').html('#' + pack.activity)).append($('<div>').addClass('remove-activity').bind('tap', SettingsPage.removeActivity)));
                });

                /* Calculating the with */
                calculateInterestWidth();

                Draw.getRuntimekey('settings_interest_scroll').refresh();
            },
            error  : function (response) {
                /* Google Analytics */
            }
        });

        var prefix = $('.add-activity-wrapper .search-prefix');
        input.val('');
        input.attr("rel", "");
        prefix.animate({opacity: 0}, "slow");


    }

    /* Removing Current Activity */
    function removeActivity(e) {
        e.preventDefault();
        var parent = $(this).parent();
        var activity_id = parent.attr('data-id');
        var self = this;

        $.ajax({
            url    : BASE_SERVER + '/user/removeActivity',
            type   : 'DELETE',
            data   : {
                session    : userModel.get('session'),
                activity_id: activity_id
            },
            success: function (response) {

            },
            error  : function (response) {
                /* Google Analytics */
            }
        });

        $(self).parent().fadeOut('fast', function () {
            $(this).remove();

            Draw.getRuntimekey('settings_interest_scroll').refresh();
        });

        /* Delete the activity from last searches */
        var last_searches = SearchPage.getLastSearches();
        var activity = $(this).parent().find('span').html().split('#').pop().toLowerCase();

        var new_searches = [];

        $.each(last_searches, function (index, word) {
            if (word.toLowerCase() != activity) new_searches.push(word);
        });

        SearchPage.setLastSearches(new_searches);
    }

    /* Calculating Interest Width */

    /**
     * Verify User Request to Logout
     * @param {DOM#Event} e
     */
    function onLogout(e) {
        e.preventDefault();

        /* Check with the user about */
        confirmMsg('ARE YOU SURE ABOUT THE LOGOUT??', function () {
            logout();
        });
    }

    /**
     * Inviting Friends
     * @param {DOM#Event} e
     */
    function inviteFriend(e) {
        e.preventDefault();

        /* Inviting Friends */
        fbController.openRequest('Awesome App! Partners, Let\'s Doing it Together!');

    }

    /* When User Touch the term */
    function onTerms(e) {
        e.preventDefault();
        if (isIos())
            window.open('http://partners-app.com/terms.html', '_system');

        window.open('http://partners-app.com/terms.html', '_blank', 'location=false');

    }

    function exitInterest(e) {
        //e.preventDefault();

        var btn = $('#addActivityButton');
        if (btn.is(':focus')) btn.blur();

    }

    function onQna(e) {
        e.preventDefault();

        /* Inviting Friends */
        window.open('http://partners-app.com/qna/', '_blank', 'location=false');

    }


    /**
     * Slider Event
     * @param {object} event
     * @param {object} ui
     */


    function onActivityKeyUp(event) {
        var input = $(event.currentTarget);
        if (!input.attr("rel")) {
            var prefix = $('.add-activity-wrapper .search-prefix');
            prefix.animate({opacity: 1}, "slow");
            input.attr("rel", "notFirst");
        }

        if (input.val() == '') {
            var prefix = $('.add-activity-wrapper .search-prefix');
            input.attr("rel", "");
            prefix.animate({opacity: 0}, "slow");

        }
        if (event.which == 13) Draw.resetFocus();
        SearchPage.onKeyUp(event, this, '.settings-autocomplete');
    }

    function setupKeyboardListeners() {
        addKeyboardListener(false, 'settings', settingsKeyboardDown);
        addKeyboardListener(true, 'settings', settingsKeyboardUp);
    }

    function settingsKeyboardUp() {
        console.log(window.innerHeight);
        if (window.innerHeight >= heightWithKBDown) {
            setTimeout(settingsKeyboardUp, 50);
            return;
        }
        var qSettingsList = $('.settings-list-wrapper');
        var qHeaderTop = $('.settings-page header');
        qSettingsList.height(window.innerHeight - qHeaderTop.outerHeight());
        qSettingsList.css("top", qHeaderTop.outerHeight());
        qSettingsList.css("position", "fixed");

        setTimeout(function () {
            Draw.getRuntimekey('settings_scroll').refresh();
        }, 0);
        Draw.setRuntimeKey('on_focus', true);
        setTimeout(function () {
            Draw.getRuntimekey('settings_scroll').scrollToElement($('.my-interest')[0]);
        }, 50);

    }

    function settingsKeyboardDown() {
        var qSettingsList = $('.settings-list-wrapper');
        qSettingsList.css("height", "");
        qSettingsList.css("position", "");
        qSettingsList.css("top", "");
        $('input').trigger('blur');
        Draw.setRuntimeKey('on_focus', undefined);
        setTimeout(function () {

            Draw.getRuntimekey('settings_scroll').refresh();
        }, 50);

    }

    function contactUs(e) {
        e.preventDefault();


        console.log('Contact us!');
        var page = ContactUs.getPage();
        $('.' + Draw.currentPage()).append(page);
        //('')
        ContactUs.init();

        setTimeout(function () {
           $('#settings-header').velocity("fadeOut");
        },400);
        ContactUs.q.mainPage.velocity({transfrom: ['']}).velocity("transition.slideUpIn");

    }

    function sliderStop(e) {
        if (e)
            e.preventDefault();

        sliderMoved(null, this);

        var settings = JSON.parse(PStorage.get('search_settings'));

        settings['search_min_age'] = _last_ages['min'];
        settings['search_max_age'] = _last_ages['max'];

        PStorage.set('search_settings', JSON.stringify(settings));

    }

    function sliderMoved(e, element) {
        if (e)

            e.preventDefault();
        if (element)
            var self = element;
        else
            self = this;
        var newAge = $(self).attr("title");
        var picker = $(self).attr("aria-labelledby").replace("-label", "").slice(5);
        settingsChanged = true;

        var pickerObj = {
            Right: ['last', 'max'],
            Left : ['first', 'min']

        };


        $('.range-display div:' + pickerObj[picker][0] + '-child').html(newAge);

        _last_ages[[pickerObj[picker][1]]] = newAge;

    }

    return {
        getPage               : getPage,
        filterByMale          : filterByMale,
        filterByFemale        : filterByFemale,
        connectBackButton     : connectBackButton,
        sliderStop            : sliderStop,
        removeActivity        : removeActivity,
        addActivity           : addActivity,
        notifyNewMessages     : notifyNewMessages,
        notifyNewPartners     : notifyNewPartners,
        onLogout              : onLogout,
        inviteFriend          : inviteFriend,
        onTerms               : onTerms,
        onActivityKeyUp       : onActivityKeyUp,
        onQna                 : onQna,
        facebookInvite        : facebookInvite,
        whatsappkInvite       : whatsappkInvite,
        exitInterest          : exitInterest,
        emailNotifications    : emailNotifications,
        setupKeyboardListeners: setupKeyboardListeners,
        contactUs             : contactUs
    };
})();