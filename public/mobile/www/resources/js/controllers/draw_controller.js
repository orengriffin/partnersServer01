/* draw_controller */

var Draw = (function () {

    var _current_page = undefined;
    var _last_page = undefined;
    var _runtime = {};

    var _list_colors = ['#008133', '#339a5c', '#66b385', '#99cdad'];

    var _classes = {
        home    : 'page-landing',
        signin  : 'signin-page',
        search  : 'main-page',
        chat    : 'chat-page',
        connect : 'connection-page',
        settings: 'settings-page',
        contact : 'contact-us'

    };

    var _pages_swtich = [];

    /* Removing Focus from any focused element */
    function resetFocus() {
        document.activeElement.blur();
    }

    function showPage(page_name) {

        var method = _getMethod(page_name);

        /* Verify Page */
        if (typeof(Draw[method]) == 'function') {
            /* Reset Focus */
            Draw.resetFocus();

            /* Get The Page */
            var page = Draw[method](page_name);
            if (typeof page.element != 'undefined') {
                var controller = window[page.controller.split('.')[0]][page.controller.split('.')[1]];
                page = page.element;
                _current_page = 1;
            }

            /* in case of undefined hide page */
            if (_current_page != undefined) {

                /* Set the next page position */
                $('.root-wrapper').append(page);
                if (controller) controller();
                /* New Page */

                //$('.' + _classes[page_name]).children().css('margin-top', 0);
                //$('.' + _classes[page_name]).children().addClass('slide-in').css('z-index', 10);
                //$('.' + _classes[page_name]).addClass('slide-in').css('z-index', 10);
                //$('.' + _classes[page_name]).velocity("transition.slideDownIn");

                if (page_name == 'search') {
                    if (isIos()) {
                        //$('.menu-icon').css("top", $('.menu-icon').css("top"));
                        //$('.settings-icon').css("top", $('.settings-icon').css("top"));
                    }
                    //$('.search-input').children().height(($('.search-input').height() - 2)).css('line-height', ($('.search-input').height() - 2) + 'px');
                }

                /* Performing the switch  */
                var prev_page = $('.' + _classes[_current_page]);

                setTimeout(function () {
                    prev_page.children().hide();
                }, 1000);

                /* Define the second page */
                $('.' + _classes[page_name] + '>*').css('display', 'block');
            }
            else {
                /* Append the page */
                $('.root-wrapper').append(page);
            }

            /* Assign Current Page Name */
            _current_page = page_name;
        }
    };

    /*
     * Switching Supplied Page With Current
     */
    function switchPages(page) {
        /* Reset Focus */
        Draw.resetFocus();
        var dirToNumber = {left: -1, right: 1};
        var backDir = {left: 'right', right: 'left'};

        var switch_to_class = page.attr('class').split(' ')[0];
        var direction = page.attr('slideTo');
        // Append the switch to page if not exist
        if (!$('.' + switch_to_class)[0]) {
            //page.css("transform", 'translate3d(' + (dirToNumber[direction]*100) + '%,0,0)');
            page.css(direction, screen.width + 'px');
            $('.root-wrapper').append(page);
            if (switch_to_class == 'settings-page')
                $('.settings-page .my-interest .exist-activities .add-activity-wrapper button img').height($('.add-activity-wrapper input').outerHeight());
            var newHeaderHight = $('.settings-page header').outerHeight();
            $('.settings-list-wrapper').height(window.innerHeight - newHeaderHight).css("top", newHeaderHight + "px");

        }
        var animationObj = {};
        animationObj[direction] = '-' + screen.width + 'px';
        animationObj['margin' + direction.slice(0, 1).toUpperCase() + direction.slice(1)] = '-' + screen.width + 'px';
        console.log('animationDone will be called');
        $('.' + _classes[_current_page]).css(backDir[direction], "").css('margin-' + backDir[direction], "");
        $('.' + _classes[_current_page]).velocity(animationObj, 400, 'easeInOutExpo', function () {
            animationDone()
        });

        $('.' + _classes[_current_page]).find('input').attr('disabled', 'disabled');

        var cls = page.attr('class').split(" ")[0];
        animationObj = {};
        animationObj[direction] = '0px';

        //$('.' + cls).animate(animationObj, 300);
        $('.' + cls).velocity(animationObj, 400, 'easeInOutExpo');

        _pages_swtich.push(_current_page);
        if (cls == 'chat-page')
            ChatPage.q.init();

        var animationDone = function () {
            console.log('animationDone was called;');
            $.each(_classes, function (index, value) {
                if (value == cls) Draw.setCurrentPage(index);
            });
        };

        sendEevent(NAVIGATION, 'swtich-' + _current_page + '-to-' + page);
    }

    /**
     * Performing Switch Back
     */
    function switchBack() {
        /* Reset Focus */
        var dirToNumber = {left: -1, right: 1};
        Draw.resetFocus();

        var delete_page = _current_page;
        var delete_class = '.' + _classes[_current_page];
        var direction = $('.' + _classes[_current_page]).attr("slideTo");
        var animationObj = {};
        var newAnimationObj = {
            transform: 'translate3d(' + (dirToNumber[direction] * 100) + '%,0,0)'
        };
        animationObj[direction] = screen.width + 'px';
        //$('.' + _classes[_current_page]).animate(animationObj, 300, 'swing', function () {
        $('.' + _classes[_current_page]).velocity(animationObj, 400, 'easeInOutExpo', function () {

            /* Delete the page if chat */
            if (delete_page == 'chat' ||
                delete_page == 'connect' ||
                delete_page == 'settings' ||
                delete_page == 'contact')
                $(delete_class).remove();
        });

        var last_page = _pages_swtich.pop();
        animationObj = {};
        newAnimationObj = {transform: 'translate3d(0,0,0)'};
        animationObj[direction] = '0px';
        animationObj['margin' + direction.slice(0, 1).toUpperCase() + direction.slice(1)] = '0px';

        //$('.' + _classes[last_page]).animate(animationObj, 300);
        $('.' + _classes[last_page]).velocity(animationObj, 400, "easeInOutExpo");

        $('.' + _classes[last_page]).find('input').removeAttr('disabled');

        _current_page = last_page;

        sendEevent(NAVIGATION, 'swtich-back-' + delete_page + '-to-' + _current_page);
    }

    /* Setting Current Page */
    function setCurrentPage(page) {
        _current_page = page;
    }

    function _getMethod(page_name) {
        var parts = page_name.toLowerCase().split('');
        var first = parts.shift().toUpperCase();
        parts.unshift(first);

        return 'show' + parts.join('') + 'Page';
    }

    /**
     * Draw The Landing Page
     */
    function showHomePage(page_name) {
        var root = $('<div>').addClass(_classes[page_name]).height(window.innerHeight);

        /* Title */
        //$('<figure>').append($('<img>').attr('src', 'resources/images/splash_title.png')).appendTo(root);
        /* Landing Logo */
        $('<div>').addClass('landing-logo fadeMe').appendTo(root).attr("style", "display:none");
        /* Bottom */
        var qLandingBottom = $('<div>').addClass('landing-bottom fadeMe').attr("style", "display:none").append($('<span>').html('Loading...'));
        qLandingBottom.appendTo(root);
        /* Loading Image */
        //$('<div>').addClass('landing-loader').append($('<img>').attr('src', 'resources/images/landig_loader.png')).appendTo(qLandingBottom);

        /* Google Anlytics */
        ga('send', 'screenview', {'screenName': 'Home'});

        return root;
    }

    /**
     * Draw the Signin Page
     */
    function showSigninPage(page_name) {
        /* Google Anlytics */
        ga('send', 'screenview', {'screenName': 'Prelogin'});

        return PerLogin.getPage(page_name);
    }

    /* Show Chat Page */
    function showChatPage(params) {
        /* Google Anlytics */
        ga('send', 'screenview', {'screenName': 'Chat'});
        client_configuration['chatFriendsMap'] = spliceAndUnshift(client_configuration['chatFriendsMap'], params.user);

        return ChatPage.getPage(params);
    }

    function updateChatHeight(include_scroll) {
        //ChatPage.q.wrapper.height(ChatPage.getChatHeights());
        if (include_scroll) ChatPage.refreshScroll();
    }

    /* Appending Chat Message to Visible Area */
    function appendChatMessage(who, message, related_user_id, time) {

        var current_date = new Date(time);//new Date();
        /*
         var temp_id =  (new Date(time)).getTime();
         var message_time = (current_date.getHours() < 10 ? '0' + current_date.getHours() : current_date.getHours()) + ':' + (current_date.getMinutes() < 10 ? '0' + current_date.getMinutes() : current_date.getMinutes());
         message = decodeURI(message);

         */
        /* Get the last message */
        var chat_history = PStorage.get('chat_user_' + related_user_id);
        if (typeof(chat_history) == 'string') chat_history = JSON.parse(chat_history);
        var last_message = (chat_history ? chat_history.pop() : undefined);

        if (last_message) {
            var day_diff = Math.round(((new Date()).getTime() - last_message.time) / (1000 * 60 * 60 * 24));
            if (day_diff > 0) $('<div>').addClass('chat-date-note').html('Today').appendTo(ChatPage.q.wrapper);
        }
        else {
            $('<div>').addClass('chat-date-note').html('Today').appendTo(ChatPage.q.wrapper);
        }

        var chat_component = ChatPage.createMessageComponent({
            who    : who,
            message: encodeURI(message),
            time   : time
        }, current_date);

        var swing = (who == "me") ? ['swl', 'swr'] : ['swr', 'swl'];
        chat_component.find('.' + who)[0].addEventListener(swing[0], ChatPage.showDeleteMsgButton, false);
        chat_component.find('.' + who)[0].addEventListener(swing[1], ChatPage.hideDeleteMsgButton, false);

        chat_component.css("opacity", "0");
        ChatPage.q.wrapper.append(chat_component);
        var qMessages = $('[data-message-container-id=' + time + ']');
        var newMessageHeight = $(qMessages.children()[1]).outerHeight(true);
        chat_component.height(newMessageHeight);
        qMessages.animate({opacity: 1}, "slow");
        if (isIos())
            setTimeout(function () {
                ChatPage.refreshScroll(200);
            }, 100);
        else
            ChatPage.refreshScroll(200);
    }

    /**
     * Show Search Page
     */

    function showSearchPage(page_name) {
        ga('send', 'screenview', {'screenName': 'Search'});
        var headerClass = 'search-header',
            iconCls = 'location-or-nav icon-location';
        headerClass += (isIos7Above()) ? ' ios7Bar' : '';
        iconCls += (isIos7Above()) ? ' ios7Bar' : '';
        var page = createView({
            tag       : 'div',
            cls       : _classes[page_name] + ' search',
            atr       : [{style: 'display: none;'}],
            controller: 'SearchPage.searchPageController',
            items     : [
                {
                    tag  : 'header',
                    cls  : headerClass,
                    atr  : [{fixed: 'true'}],
                    items: [
                        {
                            tag: 'div',
                            cls: 'settings-icon icon-menu fademeIn',
                            atr: [{style: 'display:none; opacity:1;'}]

                        },
                        {
                            tag: 'div',
                            cls: iconCls,
                            atr: [{style: 'opacity:1'}]

                        },
                        {
                            tag  : 'form',
                            items: [{
                                tag  : 'div',
                                cls  : 'search-group group ',
                                items: [
                                    {
                                        tag: 'input',
                                        atr: [
                                            {type: 'search'},
                                            {style: 'display:none;'},
                                            {id: 'search_field'}
                                        ]

                                    },
                                    {
                                        tag  : 'div',
                                        atr  : [{style: 'display:none;'}],
                                        cls  : 'autocomplete',
                                        items: [
                                            {
                                                tag: 'ul'
                                            }
                                        ]
                                    },
                                    {
                                        tag: 'label'
                                        //html: 'Find a Partner For..'
                                    }
                                ]
                            }]
                        },
                        {
                            tag: 'div',
                            cls: 'chat-icon right icon-bubbles2 fademeIn',
                            atr: [{style: 'display:none'}]
                        },
                        {
                            tag: 'div',
                            cls: 'facebook-icon right icon-facebook3 fademeIn',
                            atr: [{style: 'display:none'}]
                        },
                        {
                            tag : 'div',
                            cls : 'notifications',
                            html: client_configuration['notifications_counter'] + '',
                            atr : [{style: (client_configuration['notifications_counter']) ? 'display:block;' : 'display: none;'}]
                        }
                    ]
                },
                {
                    tag: 'div',
                    cls: 'main-body'// results-container'
                }
            ]
        });

        return page.build();
    }

    function showMoreTapped(e) {

        if (e)
            e.preventDefault();
        //var li =$('li.show-more-row');
        var li = $(this);
        var tempParams = searchParams('temp', 1);
        var newParams = {};
        for (var prop in tempParams) {
            newParams[prop] = li.attr("data-" + prop);
        }
        newParams.searchIteration++;
        li.velocity("fadeOut", {
            complete: function () {
                li.remove();
                moreWasFaded = true;
                if (canAnimateResults)
                    animateResults();
            }
        });
        //li.remove();
        if (newParams.activity)
            performSearch(null, newParams);
        else {
            if (typeof newParams.search_female != 'undefined') {
                coolLoad(true);
                nearPartners(null, newParams);
            }
            else
                SearchPage.controller().onFacebookFriends(null, newParams.searchIteration)
        }
    }

    function makeLastFacebookRow(searched) {
        return createView({
            tag  : 'li',
            cls  : 'result-row show-more-row slideMe',
            atr  : [{style: 'display:none; height:144px; box-shadow:0px 0px; background-color:rgba(238,238,238,1);'}],
            items: [
                {
                    tag : 'div',
                    cls : 'last-facebook-row',
                    html: 'Get More Partners!'
                    //atr:[{style:'color:white; background-size:95%;'}]
                },
                {
                    tag : 'div',
                    cls : 'facebook-invite facebook-share',
                    html: 'Share On Facebook',
                    atr : [{style: 'color:white; background-size:71%;'}],
                    bind: [
                        {
                            tap: function (e) {
                                fbController.postToWall(e, searched);
                            }
                        }
                    ]
                }
            ]
        }).build().element;

    }

    function makeLastResultRow(searched) {
        var rowAttr = [],
            obj = {};
        delete searched.cb;
        for (var prop in searched) {
            obj['data-' + prop] = searched[prop];
            rowAttr.push(obj);
            obj = {};
        }
        rowAttr.push({style: 'display:none;'});
        return createView({
            tag  : 'li',
            cls  : 'result-row show-more-row noSlide',
            atr  : rowAttr,
            items: [
                {
                    tag : 'div',
                    cls : 'show-more',
                    html: 'Show More'
                }
            ]
        }).build().element;
    }

    /**
     * Draw the results as list
     * @param {Array} memebers
     */

    function makeResultRow(member, index, i) {
        if (member.sharedActivities[0])
            var sharedActivities = '#' + member.sharedActivities.join(' #');
        else sharedActivities = '';
        var age = (member.age) ? '(' + member.age + ')' : '';
        var slideMe = (index < 10) ? ' slideMe' : ' noSlide';
        var showStar = (member.sharedActivities.length > 2) ? 'inline-block;' : 'none;';
        var showFacebook = (member.facebookFriend) ? 'inline-block;' : 'none;';
        //var lazyImage = (index < 10) ?
        var lazyImage = (true) ?
        {
            tag: 'img',
            atr: [{src: member.image + '?width=200&height=200'}]

        } :
        {
            tag: 'img',
            cls: 'lazy',
            atr: [
                {'data-original': member.image + '?width=120&height=120'}
                //{'src': 'https://graph.facebook.com/1548953078652569/picture?width=76&height=76'},
                //{style:'display:none;'}
            ]
        };
        if (isIos())
            var iosTop = 'top:0px;';
        else iosTop = '';
        var distanceObj = (isIos()) ?
        {
            tag : 'span',
            cls : 'row-partner-distance',
            atr : [{style: iosTop}],
            html: displayLocation(member.location)

        } :
        {
            tag : 'span',
            cls : 'row-partner-distance',
            html: displayLocation(member.location)
        };
        return createView({
            tag  : 'li',
            cls  : 'result-row' + slideMe,
            atr  : [
                {'data-user': member.user},
                {'data-usernum': String(i)},
                {'store': 'results'},
                {style: 'display:none;'}
            ],
            items: [
                {
                    tag  : 'div',
                    cls  : 'row-partner-image',
                    items: [lazyImage],
                    bind : [{tap: showProfileNew}]
                    //atr: [{style:'width:'}]
                },
                {
                    tag  : 'div',
                    cls  : 'row-partner-content',
                    atr  : [
                        {'data-usernum': String(i)},
                        {'store': 'results'}
                    ],
                    items: [
                        {
                            tag  : 'div',
                            cls  : 'row-partner-details',
                            bind : [{tap: showProfileNew}],
                            items: [
                                {
                                    tag : 'div',
                                    cls : 'row-partner-name',
                                    html: member.first_name + ' ' + age
                                },
                                distanceObj,
                                {
                                    tag: 'span',
                                    cls: 'row-partner-online ' + member.user,
                                    atr: [{style: 'opacity:' + String(member.is_online) + ';' + iosTop}]
                                },
                                {
                                    tag  : 'div',
                                    cls  : 'shared-activities-wrapper',
                                    items: [
                                        {
                                            tag: 'span',
                                            cls: 'icon-facebook2 special-icons',
                                            atr: [{style: 'display:' + showFacebook}]
                                        },
                                        {
                                            tag: 'span',
                                            cls: 'icon-star-full special-icons',
                                            atr: [{style: 'display:' + showStar}]
                                        },
                                        {
                                            tag : 'div',
                                            cls : 'shared-activities',
                                            html: sharedActivities,
                                            atr : [{display: (member.sharedActivities.length) ? 'block;' : 'none;'}]
                                        }
                                    ]

                                }

                            ]
                        },
                        {   //will have more children divs once there will be more button
                            tag : 'div',
                            cls : 'row-partner-tasks',
                            html: 'Hi!',
                            bind: [{tap: ChatPage.sendHi}]

                        }
                    ]
                }
            ]
        }).build().element;
    }

    function displayResultRow(members, searched, fromStorage) {
        if (members.length == 0) return Draw.displayNoMembers(searched);

        var results = SearchPage.controller().mainBody;
        if (!results.find('ul')[0])
            results.append($('<div>').addClass('results-container').append($('<ul>').addClass('results-wrapper')));

        /* Google Anlytics */
        ga('send', 'screenview', {'screenName': 'Results'});

        results = SearchPage.controller().mainBody.children().children();
        $.each(members, function (index, value) {
            if (value.fb_uid == "null") {
                console.log(value.user + ' Has NULL Facebook ID');
                return;
            }

            var liNum = client_configuration.results.maxMembers + index;
            var toSlide = (searched.searchIteration == 1 ) ? index : index + 9;

            results.append(makeResultRow(value, (fromStorage) ? index : toSlide, (fromStorage) ? index : liNum));
        });
        canAnimateResults = true;

        if (searched.showMore)
            results.append(makeLastResultRow(searched).bind('tap', showMoreTapped));
        else
            results.append(makeLastFacebookRow(searched));

        if (moreWasFaded || searched.searchIteration == 1 || fromStorage)
            animateResults(searched.searchIteration, fromStorage);

    }

    function animateResults(searchIteration, fromStorage) {
        canAnimateResults = false;
        moreWasFaded = false;
        if (!fromStorage) coolLoad(false);
        $('.slideMe').velocity("transition.slideUpIn",
            {
                stagger : 50,
                complete: function () {
                    $('.slideMe').removeClass('slideMe');
                    $('.noSlide').show().removeClass('noSlide');
                    /*

                     $('img.lazy').lazyload({
                     effect : "fadeIn",
                     threshold : 200,
                     container:$('.results-container')
                     });
                     */
                    /* Create Scroller */
                    if (searchIteration == 1 || fromStorage) {
                        Draw.setRuntimeKey('results-container-scroller', new IScroll('.main-body', {mouseWheel: false}));
                        Draw.getRuntimekey('results-container-scroller').on('scrollEnd', function () {
                            //$('.results-container').trigger('scroll');
                            if (this.y == this.maxScrollY) {
                                //showMoreTapped();
                                console.log('got To the End Of the Scroll');
                            }
                        })
                    }
                    else
                        Draw.getRuntimekey('results-container-scroller').refresh();
                }
            });
    }

    /**
     * Show Partner Profile Details
     * @param {Object} member_object
     */
    function showPartnerProfileNew(userObj, index, fromChat) {

        var age = (parseInt(userObj['age']) ? ', ' + userObj['age'] : '');
        var top = parseInt(SearchPage.controller().mainBody.css('top'));
        var height = window.innerHeight - top;
        var imageHeight = parseInt(height - height * 29 / 100) + 1;
        var detailsHeight = window.innerHeight - imageHeight - 46; // 50px of padding in css
        var image = userObj.image + '?width=' + window.innerWidth + '&height=' + imageHeight;
        var location = userObj['location'];
        var showFacebook = (userObj.facebookFriend) ? 'inline;' : 'none;';

        var online = (Number(userObj.is_online)) ? '1' : '0';
        var showStar = 'none;';

        if (userObj.relation)
            var sharedActivities = '#' + userObj.relation;
        else {
            showStar = (userObj.sharedActivities.length > 2) ? 'inline-block;' : 'none;';
            if (userObj.sharedActivities[0])
                sharedActivities = '#' + userObj.sharedActivities.join(' #');
            else
                sharedActivities = '';
        }
        if (fromChat && userObj.relation == 'Many In Common') {
            showStar = 'inline-block;';
            $.ajax(
                {
                    url    : BASE_SERVER + '/activity/shared' + '?cb=' + (new Date().getTime()),
                    data   : {
                        me  : userModel.get('session'),
                        user: userObj.user
                    },
                    success: function (relations) {
                        var qShared = $('.sharedActivities-text');
                        var str = '';
                        if (qShared.length) {
                            for (var i = 0; i < relations.length; i++)
                                str += '#' + relations[i] + ' ';
                            qShared.html(str);
                        }
                    }

                }
            )
        }

        var chatIcon = (!fromChat) ?
        {
            tag : 'div',
            cls : 'profile-tasks icon-bubbles2',
            bind: [{tap: openChat}]
        } : {};
        var sharedPosition = (isIos()) ? 'static' : 'fixed;';


        if (!isNaN(location)) {
            location = displayLocation(location);
        }

        $('.' + Draw.currentPage()).append(
            createView({
                tag  : 'div',
                cls  : 'partner-profile',
                atr  : [{'data-user': userObj.user},
                    {style: 'height:' + heightWithKBDown + 'px;'}
                    //{style: 'top:' + top + 'px; height:' + height + 'px;'}
                ],
                items: [
                    {
                        tag  : 'div',
                        cls  : 'profile-picture',
                        items: [
                            {
                                tag : 'img',
                                atr : [{src: image}],
                                load: function () {
                                    coolLoad(false);
                                    $('.partner-profile').velocity("transition.slideUpIn");
                                }
                            }
                        ]
                    },
                    {
                        tag : 'div',
                        cls : 'profile-tick icon-arrow-back',
                        bind: [{tap: hideProfilePreview}]
                    },
                    {
                        tag: 'div',
                        cls: 'profile-details',
                        atr: [
                            {'data-usernum': index},
                            {'store': (fromChat) ? 'chat-friends' : 'results'},
                            {style: 'height:' + detailsHeight + 'px;'}
                        ],

                        items: [
                            {
                                tag : 'div',
                                cls : 'row-partner-name',
                                html: userObj.first_name + age
                            },
                            {
                                tag: 'span',
                                cls: 'row-partner-online ' + userObj.user,
                                atr: [{style: 'opacity:' + online + ';'}]
                            },
                            chatIcon,
                            {
                                tag : 'div',
                                cls : 'row-partner-last-seen',
                                html: 'Last seen ' + userObj.last_seen,
                                atr : [{style: (userObj.last_seen.length > 1) ? 'display:block;' : 'display:none;'}]
                            },
                            {
                                tag : 'div',
                                cls : 'row-partner-distance',
                                html: location
                            },
                            {   //will have more children divs once there will be more button
                                tag : 'div',
                                cls : 'row-partner-tasks',
                                html: 'Hi!',
                                //atr: [{style: (fromChat) ? 'display:none;' : 'display:block;'}],
                                bind: [{tap: ChatPage.sendHi}]
                            },
                            {
                                tag  : 'div',
                                //cls: 'row-partner-sharedActivities-wrapper',
                                cls  : 'row-partner-sharedActivities',
                                atr  : [{style: 'position:' + sharedPosition}],
                                items: [
                                    {
                                        tag: 'span',
                                        cls: 'icon-facebook2 special-icons',
                                        atr: [{style: 'display:' + showFacebook}]
                                    },
                                    {
                                        tag: 'span',
                                        cls: 'icon-star-full special-icons',
                                        atr: [{style: 'display:' + showStar}]
                                    },
                                    {
                                        tag : 'div',
                                        cls : 'sharedActivities-text',
                                        html: sharedActivities,
                                        atr : [{style: 'display :inline;'}]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }).build().element
        );
    }

    function showPartnerProfile(element, member_object, append_to_chat) {
        /* Google Anlytics */
        ga('send', 'screenview', {'screenName': 'Profile'});

        var root = $('<div>').addClass('partner-profile').attr('data-user', member_object['user']);

        /* Create Profile Picture */
        var percent = 87;
        if (!append_to_chat)
            percent = 73;

        // acording to app.css line 769 (and some more )
        var imageHight = parseInt(window.innerHeight * 78 / 100 * percent / 100);

        var imageWidthAndHeight = '?width=' + window.innerWidth + '&height=' + imageHight;
        var profile_picture = $('<div>').addClass('profile-picture').append($('<img>').attr('src', member_object['image'] + imageWidthAndHeight).load(function () {
            /* Turn off loader */
            if (append_to_chat) chatLoaderOff('#chat-profile-icon');
            loaderOff('#result_user_' + member_object['user']);
            hideCurtain();
            $('.partner-profile').velocity("fadeIn");
        }));
        /* Appending Profile Picture */
        root.append(profile_picture);

        /* Create Profile Tick */
        var profile_tick = $('<div>').addClass('profile-tick').bind('tap', hideProfilePreview).append($('<img>').attr('src', 'resources/images/profile_tick.png'));
        /* Appending To Root */
        root.append(profile_tick);

        /* ***** Profile Details ****** */

        profile_details_container = $('<div>').addClass('profile-details');

        // Create Elements
        // Details Wrapper
        var details_wrapper = $('<div>').addClass('row-parenter-details');
        var age = (parseInt(member_object['age']) ? '(' + member_object['age'] + ')' : '');

        details_wrapper.append($('<div>').addClass('row-parenter-name').html(member_object['name'] + ' ' + age));

        var location = member_object['location'];
        if (!isNaN(location)) {
            if (location < 1) {
                location = (location * 1000) + 'M';
            }
            else {
                location = location + 'Km';
            }
        }

        details_wrapper.append($('<div>').addClass('row-parenter-distance').html(location + '<span>' + (client_configuration.last_search ? ', #' + client_configuration.last_search.meta.activity : '') + '</span>'));
        // On Icon
        var on_icon_warpper = $('<div>').addClass('row-parenter-on-button');
        /* Create Online Icon */
        var online_icon = $('<div>').html('on');
        if (member_object.is_online) online_icon.addClass('online');
        on_icon_warpper.append(online_icon);
        on_icon_warpper.append($('<span>').html(member_object['last_seen']));
        details_wrapper.append(on_icon_warpper); // Appending the ON Button to its parent
        // Block Icon
        var block_icon = $('<div>').addClass('row-partner-block').html((member_object.isBlocked) ? 'unBlock' : 'Block').bind('tap', function (e) {
            e.preventDefault();

            // Block Function
            blockUser($(this).attr('data-user'));
        }).attr('data-user', member_object.user);
        details_wrapper.append(block_icon); // Appending the Block Item

        // Tasks Wrapper
        var tasks_wrapper = $('<div>').addClass('row-parenter-tasks');
        // Chat Icon
        if (!append_to_chat) {
            var chat_preview = $('<div>').addClass('row-parenter-chat').attr('data-user', member_object.user).bind('tap', openChatFromPreview);
            tasks_wrapper.append(chat_preview);
        }
        // Set Partner Icon
        if (append_to_chat)
            var set_partner = $('<div>').attr('data-user', member_object['user']).addClass('row-parenter-set-partner');
        else
            set_partner = $('<div>').attr('data-user', member_object['user']).addClass('row-parenter-set-partner').bind('tap', setPartnersPreview);
        /* if Partners adding Partner Class and flag */
        if (member_object.is_partners) {
            set_partner.attr('data-partners', 'yes');
            set_partner.addClass('im-a-partner');
        }

        if (client_configuration.last_search) set_partner.attr('data-activity', client_configuration.last_search.meta.activity);
        tasks_wrapper.append(set_partner);

        // Appending Wrappers to Container
        profile_details_container.append(details_wrapper);
        profile_details_container.append(tasks_wrapper);

        // Appending data to Root
        root.append(profile_details_container);

        if (append_to_chat) {
            root.addClass('partner-profile-chat');
            $('.chat-page').append(root);
        } else {
            $('.main-page').append(root);
        }
    }

    /**
     * Displaying New Activity
     * @return {void}
     */
    function displayNewActivity() {
        /* Google Anlytics */
        ga('send', 'screenview', {'screenName': 'NewActivity'});

        _hideAnyResultType();

        var root = $('<div>').addClass('no-results');

        $('.main-page').append(root);
        Draw.getRuntimekey('suggested_scroll').refresh()

    }

    /* Display No Members!! */
    function displayNoMembers(searched) {
        /* Google Anlytics */
        ga('send', 'screenview', {'screenName': 'NoMembers'});

        _hideAnyResultType();

        /* Init Root */
        var root = $('<div>').addClass('no-results');

        /* Adding Balloon Section */
        $('<div>').addClass('no-results-balloon').appendTo(root);

        /* Find me a partner */
        $('<div>').addClass('help-up-grow').html('Get More Partners!').appendTo(root);

        /* Adding Facebook Invite */
        $('<div>').addClass('facebook-invite').append($('<span>').html('Share On Facebook')).bind('tap', function (e) {
            fbController.postToWall(e,searched);
        }).appendTo(root);

        /* Adding Facebook Invite */
        if (window.whatsapp_available) {
            $('<div>').addClass('whatsapp-invite').append($('<span>').html('Invite Whatsapp Friends')).bind('tap', function (e) {
                e.preventDefault();
                whatsappShare(server_configuration.custom_messages.whatsapp_message, 'http://partners-app.com/?ref=app_share_whatsapp');
            }).appendTo(root);
        }

        coolLoad(false);
        //$('.main-page').append(root);
        SearchPage.controller().mainBody.append(root);
    }

    /**
     * Display Plural Result
     * @param {Object} meta
     */
    function displayPluralResult(meta) {
        /* Google Anlytics */
        ga('send', 'screenview', {'screenName': 'PluralResults'});

        _hideAnyResultType();

        /* Init Root */
        var root = $('<div>').addClass('no-results');
        /* Adding Title */
        $('<div>').addClass('help-up-grow').html('DID YOU MEAN TO:').appendTo(root);

        /* Set Unordered List */
        var unordered_list = $('<ul>').addClass('plural-results-list');

        $.each(meta, function (index, pack) {
            var item = $('<li>').attr('data-activity-id', pack.activity_id).attr('data-activity', pack.activity).bind('tap', SearchPage.pluralResultSearch);
            item.html(pack.activity);
            item.appendTo(unordered_list);
        });

        root.append(unordered_list).appendTo($('.main-page'));
    }

    /**
     * Removing Any Result Type - Resetting
     * Screen by check if result exist and remove it.
     */
    function _hideAnyResultType() {
        var results = $('.results-container');
        if (results.length > 0) {
            results.remove();
        }

        var results = $('.no-results');
        if (results.length > 0) {
            results.remove();
        }
    }

    function emptyAutoComplete(isSettings) {
        var specific = '.' + currentPage();
        if (isSettings)
            specific = isSettings;
        var qAutoComplete = $('.autocomplete' + specific);
        $('.autocomplete' + specific + ' ul').html('');
        qAutoComplete.hide();
    }

    function hideAutoComplete(isSettings) {
        if (window.innerHeight < $('page-landing').height())
            $('.go-button').animate({
                top: _runtime['go_last_position']
            }, 200);
        else
            $('.go-button').css('top', "");

        Draw.emptyAutoComplete();
        _runtime['go_last_position'] = undefined;
    }

    function noLocation(title, callback, success, fail, options) {

        var element = createView({
            tag  : 'div',
            atr  : [{id: 'nolocation'}],
            items: [
                {
                    tag : 'span',
                    html: title
                },
                {
                    tag : 'div',
                    cls : 'icon-location',
                    atr : [{id: 'nolocation-icon'}],
                    bind: [{
                        tap: function (e) {
                            if (e) e.preventDefault();
                            var q = SearchPage.controller();
                            q.searchOrLoc
                                .css("opacity", "1")
                                .show();
                            q.mainBody.children().velocity("transition.slideDownOut", function () {
                                q.mainBody.children().remove();
                            });
                            loadSatAnim(q.searchOrLoc);
                            if (callback)
                                callback(function (position) {
                                        coolLoad(false);
                                        success(position);
                                    },
                                    function (error) {
                                        coolLoad(false);
                                        fail(error);
                                    }, options);
                        }
                    }]
                },
                {
                    tag : 'span',
                    html: '<i>In the meantime you can update your profile settings...</i>'
                }
            ]
        }).build().element.hide();
        coolLoad(true);
        var q = SearchPage.controller();
        q.mainBody.children().remove();
        q.mainBody.append(element);
        q.mainBody.children().velocity("transition.slideUpIn");

    }

    function showAutoComplete(isSettings) {
        var specific = '.' + currentPage();
        if (isSettings)
            specific = isSettings;

        var qAutoComplete = $('.autocomplete' + specific);

        qAutoComplete.show();
    }

    function setRuntimeKey(key, value) {
        _runtime[key] = value;
        return this;
    }

    function getRuntimekey(key) {
        return _runtime[key];
    }

    /**
     * Switching Settings Icon to back Icon
     */
    function switchSettings2Back() {
        /* Reset Focus */
        Draw.resetFocus();
    }

    function currentPage() {
        return _current_page
    }

    return {
        showPartnerProfile   : showPartnerProfile,
        displayResultRow     : displayResultRow,
        displayNewActivity   : displayNewActivity,
        displayNoMembers     : displayNoMembers,
        displayPluralResult  : displayPluralResult,
        setRuntimeKey        : setRuntimeKey,
        getRuntimekey        : getRuntimekey,
        setCurrentPage       : setCurrentPage,
        showPage             : showPage,
        showChatPage         : showChatPage,
        showHomePage         : showHomePage,
        showSigninPage       : showSigninPage,
        showSearchPage       : showSearchPage,
        hideAutoComplete     : hideAutoComplete,
        showAutoComplete     : showAutoComplete,
        emptyAutoComplete    : emptyAutoComplete,
        switchPages          : switchPages,
        switchBack           : switchBack,
        appendChatMessage    : appendChatMessage,
        updateChatHeight     : updateChatHeight,
        switchSettings2Back  : switchSettings2Back,
        resetFocus           : resetFocus,
        currentPage          : currentPage,
        showPartnerProfileNew: showPartnerProfileNew,
        noLocation           : noLocation,
        classes              : _classes
    }
})();

//<script type="text/javascript" src="zepto.min.js"></script>
