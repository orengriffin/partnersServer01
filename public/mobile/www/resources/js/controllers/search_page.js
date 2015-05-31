/* Search Page */
var SearchPage = (function () {

    var _is_scrolling = false;
    var isFocused = false;
    var isBlured = true;
    var loaderShowing = false;


    /**
     * On Search Blur - Called When User Leave the Search Box
     */
    function onSearchBlur() {
        isFocused = false;
        isBlured = true;
        cordova.plugins.Keyboard.close();
        Draw.setRuntimeKey('on_focus', undefined);
        /* Blue Event */
        Draw.hideAutoComplete();
        $('.menu-icon, .settings-icon').removeClass('icons-search-active');

        /* Rewrite the canvas after search is performed */
        if (Draw.getRuntimekey('perform_search')) {

            $('#main-title, .go-button, .last-searches-title, .last-searches').fadeOut(200, function () {
                //$('#main-title, .go-button, .last-searches-title, .last-searches').remove();
            });

            $('#main-title').css('top', '0px');
            $('.static-logo').addClass('static-logo-result');
            $('.search-wrapper').addClass('search-wrapper-result');

            $('.go-button').removeClass('go-button-focus');
            $('.search-wrapper').removeClass('search-wrapper-focus');
        }
        else if (!$('.settings-icon-back')[0]) {
            /* Otherwise - do it. */
            $('.static-logo-active').unbind('tap');
            $('.static-logo').removeClass('static-logo-active');
            $('.search-wrapper').removeClass('search-wrapper-focus');
            setTimeout(function () {
                $('.go-button').removeClass('go-button-focus');
            }, 200);
            if (!!$('.last-searches-title')[0]) {
                $('.last-searches-title').show();
                $('.last-searches').show();
            }

        }
    }

    /**
     * On Search Focus - Called When User Tag the Screen
     */
    function onSearchFocus() {
        isFocused = true;
        isBlured = false;


        if ($('.partner-profile').length) hideProfilePreview();

        /* Set Flag */
        Draw.setRuntimeKey('on_focus', true);

        if (Draw.getRuntimekey('perform_search')) return;
        if ($('.results-container').length || $('.no-results').length) return;

        /* Focus Event */
        $('.static-logo').addClass('static-logo-active');
        if (!isIos())
            $('.menu-icon, .settings-icon').addClass('icons-search-active');

        if (!!$('.last-searches-title')[0]) {
            $('.last-searches-title').hide();
            $('.last-searches').hide();
        }
        $('.go-button').css("top", "");
        $('.static-logo-active').bind('tap', function (e) {
            e.preventDefault();

            navigator.notification.vibrate(1000);
        });

        $('.go-button').addClass('go-button-focus');
        $('.search-wrapper').addClass('search-wrapper-focus');
    }

    /**
     * On Key Up - Called When user typing stuff in search box
     */
    function onKeyUp(event, thou, isSettings) {
        /* Getting the current value */
        if (!thou)  thou = this;
        var search_value = $(thou).val();
        if (event.keyCode == 13) {
            event.preventDefault();
            return;
        }

        /* Performing Length Check */
        if (search_value.length < 2) {
            Draw.hideAutoComplete();
            return;
        }
        var specific = '.' + Draw.currentPage();
        if (isSettings)
            specific = isSettings;

        $.ajax({
            url    : BASE_SERVER + '/activity/search?activity=' + search_value + '&cb=' + (new Date().getTime()),
            success: function (response) {
                /* Aborting Update in case of blur */
                if (!Draw.getRuntimekey('on_focus')) return;

                /* Verify Code */
                if (response.code != SERVER_SUCCESS_CODE) {
                    /* Clean the auto complate */
                    Draw.emptyAutoComplete(isSettings);

                    /* Parsing String */
                    if (typeof(response) == 'string') {
                        response = JSON.parse(response);
                    }
                    /* Verify the response  */
                    if (typeof(response) == 'object') {
                        $.each(response.message, function (index, value) {
                            $('.autocomplete' + specific + ' ul').append($('<li>').html('#' + value.activity).bind('tap', function (e) {
                                e.preventDefault();
                                if (Draw.currentPage() == "search") {
                                    $('#search_field').val($(this).attr('data-activity'));
                                    performSearch();
                                }
                                else // settings activity
                                    $('#addActivityButton').val($(this).attr('data-activity'));

                            }).attr('data-activity', value.activity));
                        });
                    }

                    if (response.message.length >= 1) {
                        Draw.showAutoComplete(isSettings);
                    } else {
                        //Draw.hideAutoComplete(isSettings);
                        Draw.emptyAutoComplete(isSettings);

                    }
                }
            }
        });
    }

    /**
     * Touched On Go Button
     * @return {void}
     */
    function goButtonTouch(e) {
        e.preventDefault();

        if ($('#search_field').val().length == 0) return;
        performSearch(event);
    }

    /**
     * Return Array of Last Searches
     * @return {Array}
     */
    function getLastSearches() {
        var response = PStorage.get('last_searches');
        if (typeof(response) == 'undefined') return [];

        var parts = response.split(':');
        return parts.slice(0, 5); // Return the last 5.
    }

    /**
     * Open the ability to update the last searches
     * @param {Array} searches
     */
    function setLastSearches(searches) {
        if (typeof(searches) == 'undefined') return false;

        PStorage.set('last_searches', searches.join(':'));

        setTimeout(function () {
            SearchPage.refreshLastSearches();
        }, 750);

        return true;
    }

    /**
     * Update the last searches Setcion
     */
    function refreshLastSearches() {
        /* Check if exist */
        if (!$('.last-searches ul').length) return;

        var last_searches = getLastSearches();
        var last_search_list = $('.last-searches ul');

        $('.last-searches ul').html('');

        $.each(last_searches, function (index, value) {
            /* Appending list item */
            last_search_list.append($('<li>').html('#' + value.toUpperCase()).bind('tap', selectPreviousActivity).attr('data-activity', value.toLowerCase()));
        });

        var length = 0;
        for (var index = 0; index <= $('.last-searches>ul li').length; index++) length = (length + $($('.last-searches>ul li')[index]).outerWidth(true));

        $('.last-searches>ul').width(length);
        Draw.getRuntimekey('last_searches_scroll').refresh();

    }

    function hideSearchComponents() {
        /* Performing the Search */
        $('.go-button, .last-searches-title, .last-searches').fadeOut(200, function () {
            //$('#main-title, .go-button, .last-searches-title, .last-searches, .suggested').remove();
        });

        $('#main-title').slideUp(200);
        var newHeight = $('.search-input').outerHeight(true);
        $('.autocomplete').css("top", newHeight + "px");
        $('.autocomplete').css("position", "absolute");
    }

    /* Bluring Touch */
    function bluringTouch(e) {
        /* Reset Focus */
        e.preventDefault();
        Draw.resetFocus();

    }

    /* Performing Search After User Choose From Suggetemetns */
    function pluralResultSearch(event) {
        event.preventDefault();
        /* Setting the search field */
        $('#search_field').val($(this).attr('data-activity'));

        performSearch(event);
    }

    /**
     * Show Search Loader
     */
    function showSearchLoader() {
        $('.search-mag').fadeOut(200, function () {
            $('.search-loader').fadeIn(200, function () {
                loaderShowing = true
            });
        });
    }

    function hideSearchLoader() {
        if (loaderShowing)
            $('.search-loader').fadeOut(200, function () {
                $('.search-mag').fadeIn(200);
                loaderShowing = false;
            });
        else {
            setTimeout(function () {
                hideSearchLoader();
            }, 100);
        }
    }

    function resultsInputHeight() {
        //var resultsContainerTop = parseFloat($('.results-container').css("top"));
        var resultsContainerTop = $('.page-landing').height() * 22 / 100;
        var newTop = resultsContainerTop - $('.search-input').outerHeight(true);
        $('.search-wrapper').css("top", newTop + "px");
    }

    function setupKeyboardListeners() {
        addKeyboardListener(false, 'search', function () {
            SearchPage.controller().input.blur();
        });
        //addKeyboardListener(true, 'search', SearchPage.searchKeyboardUp);
    }

    function searchKeyboardUp() {
        var originalHeight = heightWithKBDown;
        console.log(window.innerHeight);
        if (window.innerHeight < originalHeight) {
            console.log(window.innerHeight);

            if (!!$('.settings-icon-back')[0])
                $('.main-page').height(originalHeight);
            else {

                $('.main-page').css("height", window.innerHeight);
            }
            if (!isFocused) onSearchFocus();
            if (isIos())
                setTimeout(function () {
                    $('[type="search"]').trigger('focus');
                }, 300);
        }
        else setTimeout(function () {
            searchKeyboardUp();
        }, 50);
    }

    function searchKeyboardDown() {
        $('.main-page').css("height", heightWithKBDown);
        if (!isBlured) SearchPage.onSearchBlur();
    }

    var controller = null;

    function getController() {
        return controller;
    }

    function searchPageController() {
        controller = createControler({
            refs   : {
                form             : '.main-page form',
                searchOrLoc      : '.main-page .location-or-nav',
                settingsMenu     : '.main-page .settings-icon',
                conversationsMenu: '.main-page .chat-icon',
                facebookFriend   : '.main-page .facebook-icon',
                mainBody         : '.main-page .main-body',
                headerLabel      : '.main-page header label',
                input            : '.main-page form input',
                fademeIn         : '.main-page .fademeIn',
                mainPage         : '.main-page',
                header           : '.main-page header'
            },
            control: {
                facebookFriend   : {
                    tap: 'onFacebookFriends'
                },
                form             : {
                    submit: 'preventSubmit'
                },
                settingsMenu     : {
                    tap: 'settingsMenuTapped,proxy'
                },
                conversationsMenu: {
                    tap: 'conversationsMenuTapped'
                },
                input            : {
                    keyup: 'onInputKeyUp,proxy',
                    focus: 'onInputFocus,proxy',
                    blur : 'onInputBlur,proxy'
                },
                mainBody         : {
                    tap: 'onMainBodyTapped'
                }
            },

            initialize: function () {
                console.log('initializing search page controller');
                this.mainBody.height(window.innerHeight - this.header.outerHeight());
                //if (isIos())
                this.mainBody.css("top", this.header.outerHeight() + 'px');
                if (userModel.get('latitude'))
                    loadSearchIcon(this.searchOrLoc);
                else
                    loadSatAnim(this.searchOrLoc);
            },

            onFacebookFriends: function (e, searchedIteration) {
                if (e)
                    e.preventDefault();
                if (client_configuration['oldResults'] && !searchedIteration) return;

                var q = SearchPage.controller();
                if (q.settingsMenu.hasClass('icon-menu')) {  // show arrow
                    q.settingsMenu.velocity({opacity: 0}, {
                        duration: 100,
                        complete: function () {
                            q.settingsMenu.removeClass('icon-menu');
                            q.settingsMenu.addClass('icon-arrow-back');
                            q.settingsMenu.velocity({opacity: 1}, {duration: 100});
                        }
                    })
                }

                coolLoad(true);
                var resp = null;

                asyncParallel([
                    function (callback) {
                        $.ajax({
                            url : BASE_SERVER + '/user/getNearFacebookPartners',
                            //data: (params) ? params : searchParams(null, searchIteration),
                            data: {
                                id             : userModel.get('session'),
                                cb             : (new Date().getTime()),
                                searchIteration: (searchedIteration) ? searchedIteration : 1
                            },
                            type: 'POST',

                            success: function (response) {
                                resp = response;
                                callback(response);
                            }
                        });
                    },
                    function (callback) {
                        var oldResults = q.mainBody.children();
                        if (!searchedIteration)
                            oldResults.children().velocity('fadeOut', function () {
                                oldResults.remove();
                                callback();
                            });
                        else
                                callback();


                    }
                ], function () {
                    coolLoad(false);
                    var response = resp;
                    //canAnimateResults = true;
                    if (!client_configuration['oldResults'])
                        client_configuration['oldResults'] = client_configuration['results'];

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

                });


            },

            onMainBodyTapped: function () {
                Draw.resetFocus();
            },

            onInputFocus: function () {
                if (this.headerLabel.css('display') != 'none')
                    this.headerLabel.velocity("fadeOut");

                var specific = '.' + Draw.currentPage();
                var autocompleteElement = $(specific + ' .autocomplete ul');

                this.appendAutocomplete({message: SearchPage.getLastSearches()}, autocompleteElement, true);

            },

            onInputBlur: function () {
                if (this.headerLabel.css('display') == 'none' && this.input.val() == '' && !Draw.getRuntimekey('perform_search'))
                    this.headerLabel.velocity("fadeIn");

                var specific = '.' + Draw.currentPage();
                //$( specific + ' .autocomplete').velocity('fadeOut'); // velocity not used so later ".show" will work
                $(specific + ' .autocomplete').fadeOut(); // velocity not used so later ".show" will work

            },

            appendAutocomplete: function (response, autocompleteElement, fromLastSearches) {
                if (typeof(response) == 'object') {
                    if (fromLastSearches) {
                        var tempArray = response.message;
                        response.message = [];
                        for (var i = 0; i < tempArray.length; i++) {
                            response.message.push({activity: tempArray[i]});
                        }
                    }
                    autocompleteElement.children().remove();
                    $.each(response.message, function (index, value) {
                        autocompleteElement.append($('<li>').html('#' + value.activity).bind('tap', function (e) {
                            e.preventDefault();
                            var element = (Draw.currentPage() == "search") ? $('#search_field') : $('#addActivityButton');
                            element.val($(this).attr('data-activity'));
                            if (Draw.currentPage() == "search")
                                performSearch();
                            autocompleteElement.parent().hide();


                        }).attr('data-activity', value.activity));
                    });

                    if (response.message.length && response.message)
                        autocompleteElement.parent().show();
                    else
                        autocompleteElement.parent().hide();

                }
            },


            onInputKeyUp: function (event, thou) {
                /* Getting the current value */
                if (!thou)  thou = this;
                var search_value = this.input.val();
                if (event.keyCode == 13) {
                    event.preventDefault();
                    return;
                }

                var specific = '.' + Draw.currentPage();
                var autocompleteElement = $(specific + ' .autocomplete ul');


                if (!search_value || !search_value.length)
                    this.appendAutocomplete({message: SearchPage.getLastSearches()}, autocompleteElement, true);
                else
                    $.ajax({
                        url    : BASE_SERVER + '/activity/search?activity=' + search_value + '&cb=' + (new Date().getTime()),
                        success: function (response) {

                            //Aborting Update in case of blur
                            if (!thou.input.is(':focus')) return;

                            if (response.code != SERVER_SUCCESS_CODE) {

                                if (typeof(response) == 'string') {
                                    response = JSON.parse(response);
                                }
                                thou.appendAutocomplete(response, autocompleteElement);

                            }
                        }
                    });
            },

            /**
             * Perfoming Transition to Connection Page
             */

            conversationsMenuTapped: function (e) {
                e.preventDefault();

                var page = ConnectionPage.getPage();
                Draw.switchPages(page);

            },
            /**
             * Performing Transition to Settings Page
             */
            settingsMenuTapped     : function (e, fromBack) {
                if (e)
                    e.preventDefault();
                /* Changin back the page */
                if ( typeof cordova != 'undefined')
                {
                    cordova.plugins.Keyboard.close();
                    searchKeyboardDown();
                }
                var q = this;
                if (q.settingsMenu.hasClass('icon-arrow-back') && client_configuration['oldResults']) {

                    var oldResults = q.mainBody.children();
                    var oldResultsData = client_configuration['oldResults'];
                    delete client_configuration['oldResults'];
                    client_configuration['results'] = oldResultsData;
                    q.headerLabel.velocity("fadeIn");
                    q.input.val('');
                    Draw.resetFocus();
                    this.facebookFriend.velocity({opacity: 1}, {
                        duration: 200,
                        complete: function () {
                            q.facebookFriend.bind("tap", q.onFacebookFriends);
                        }
                    });
                    this.settingsMenu.velocity({opacity: 0}, {
                        duration: 200,
                        complete: function () {
                            q.settingsMenu.removeClass('icon-arrow-back');
                            q.settingsMenu.addClass('icon-menu');
                            q.settingsMenu.velocity({opacity: 1}, {duration: 200});
                        }
                    });
                    oldResults.children().velocity('fadeOut', function () {
                        oldResults.remove();
                        Draw.displayResultRow(oldResultsData.members, oldResultsData.searched, true)
                    });
                }
                else {
                    if (!fromBack) {
                        var page = SettingsPage.getPage();
                        if (!!page) Draw.switchPages(page);
                    }
                }
            },

            preventSubmit: function (e) {
                e.preventDefault();
                performSearch();
            }

        });
        return controller.init();
    }

    return {
        onSearchFocus         : onSearchFocus,
        onSearchBlur          : onSearchBlur,
        onKeyUp               : onKeyUp,
        //onMenuIcon            : onMenuIcon, test
        //onSettingsIcon        : onSettingsIcon,
        getLastSearches       : getLastSearches,
        goButtonTouch         : goButtonTouch,
        hideSearchComponents  : hideSearchComponents,
        bluringTouch          : bluringTouch,
        pluralResultSearch    : pluralResultSearch,
        setLastSearches       : setLastSearches,
        refreshLastSearches   : refreshLastSearches,
        showSearchLoader      : showSearchLoader,
        hideSearchLoader      : hideSearchLoader,
        setupKeyboardListeners: setupKeyboardListeners,
        resultsInputHeight    : resultsInputHeight,
        searchKeyboardUp      : searchKeyboardUp,
        searchKeyboardDown    : searchKeyboardDown,
        searchPageController  : searchPageController,
        controller            : getController
    };
})();