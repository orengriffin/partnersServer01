/* Chat Page */
var ChatPage = (function () {

    var HImessage = 'Hi!';

    var _classes = {
        home  : 'page-landing',
        signin: 'signin-page',
        search: 'main-page',
        chat  : 'chat-page'
    };
    var q = {
        init                        : function () {
            this.content = $('.chat-content');
            this.wrapper = $('.chat-wrapper');
            this.input = $('.chat-input');
            this.header = $('.chat-page header');
            this.mainPage = $('.chat-page');
            this.inputText = $('#chat-input');
            this.senderFBid = $('.chat-page .right-content').attr("fbid");
            this.button = $('.chat-input button');
            this.chatDoodle = $('.chat-doodle');
            this.input.height(this.input.height());  //turn from % to number
            this.header.height(this.header.height());
            this.button.height(this.button.height());
            this.contentOriginalHeight = heightWithKBDown - this.input.outerHeight() - this.header.outerHeight();
            this.content.height(this.contentOriginalHeight);
            this.chatDoodle.css("background-size", parseInt(heightWithKBDown / window.innerWidth * 100) + "% 100%");
            this.chatDoodle.height(heightWithKBDown + "px");
            _already_changed = false;
            this.content.css("top", this.header.outerHeight() + "px");
            if (!this.inputOriginalOuterHeight) {   //only init once
                this.inputOriginalOuterHeight = this.input.outerHeight();
                this.inputOriginalHeight = this.input.height();
                this.inputTextOriginalOuterHeight = q.inputText.outerHeight(true);
            }

        },
        chatDoodle                  : undefined,
        chatHistory                 : [],
        senderFBid                  : undefined,
        button                      : undefined,
        content                     : undefined,
        contentWithKeyboardHeight   : undefined,
        wrapper                     : undefined,
        input                       : undefined,
        header                      : undefined,
        inputText                   : undefined,
        inputOriginalHeight         : undefined,
        inputOriginalOuterHeight    : undefined,
        inputTextOriginalOuterHeight: undefined,
        inputTextGap                : undefined,
        contentOriginalHeight       : undefined,
        scrollWrapper               : undefined,
        wrappBheight                : undefined,
        initScroll                  : function (wrapper) {
            this.scroll = wrapper;
        },
        lastMessage                 : function () {   // return the last message that was not deleted by the user
            var i = q.wrapper.children().length - 1;
            for (; i >= 0; i--) {
                if ($(q.wrapper.children()[i]).css("display") != "none")
                    return $(q.wrapper.children()[i]);
            }
        }
    };


    var _is_scrolled = false;
    var _original_height = undefined;
    var _already_changed = false;
    var _original_input_line_height = undefined;
    var _is_keyboard_opened = false;
    var number_of_lines = 1;

    /**
     * Main Method - Creating the Chat Page
     * @params {Objecct}
     */
    function getPage(params) {
        //var root = $('<div>').addClass(_classes['chat']).height(screen.height );
        var root = $('<div>').addClass(_classes['chat'] + ' chat').height(window.innerHeight).attr("slideTo", "left");
        root.append(_createChatHeader(params));
        root.append($('<div>').addClass('chat-doodle'));

        //	root.append(_createHiddenHeader(params));

        // Chat Content
        var chat_content = $('<div>').addClass('chat-content').bind('tap', ChatPage.onChatContentTap);
        var char_wrapper = $('<ul>').addClass('chat-wrapper');
        q.chatHistory = PStorage.get('chat_user_' + params.user);

        if (typeof(q.chatHistory) == 'undefined') {
            q.chatHistory = [];
            PStorage.set('chat_user_' + params.user, q.chatHistory);
        } else {
            // Getting the Chat history from storage
            //var chat_history = JSON.parse(PStorage.get('chat_user_' + params.user).encodeURI());
            q.chatHistory = JSON.parse(q.chatHistory);
        }

        var dayDisplayed = 0;
        var today = dateToCoolString(new Date());

        // Adding Messages
        for (var index = 0; index < q.chatHistory.length; index++) {
            //$.each(chat_history, function (index, value) {
            /* Set Date Object */
            var current_date = new Date(q.chatHistory[index].time);

            var currentMessageDayString = dateToCoolString(current_date);

            /* Appenidng for the first element */
            if (dayDisplayed != currentMessageDayString) {

                //today here
                var date_note = $('<div>').addClass('chat-date-note').html(
                    (today == currentMessageDayString) ? 'Today' : currentMessageDayString);
                dayDisplayed = currentMessageDayString;
                char_wrapper.append(date_note);
            }

            // Appending the Message Container
            q.chatHistory[index].message = encodeURI( q.chatHistory[index].message);
            char_wrapper.append(createMessageComponent(q.chatHistory[index], current_date));
        }

        chat_content.append(char_wrapper);
        // display all histroy they are now display none
        root.append(chat_content);

        // Adding Chat Input
        var chat_input = $('<div>').addClass('chat-input');
        // Adding Text Area to Chat Input
        $('<textarea>').attr('tabindex', '-1').attr('id', 'chat-input').appendTo(chat_input).focus(ChatPage.inputFocus).blur(ChatPage.inputBlur).bind('keyup', ChatPage.inputKeyPress).attr('autocorrect', 'off');
        // Adding Button
        chat_input.append($('<button>').append($('<img>').attr('src', webURL + 'resources/images/chat_send_button.png')).bind('tap', ChatPage.sendMessage));

        root.append(chat_input);
        setTimeout(function () {

            $('.message').each(function (key, value) {
                $(value).parent().height($(value).outerHeight(true));
            });

            // Attach Scrolling
            Draw.setRuntimeKey('chat_scroll', new IScroll('.chat-content', {mouseWheel: false}));
            q.initScroll(Draw.getRuntimekey('chat_scroll'));

            $('<textarea>').height($('<textarea>').height());
            q.inputText.textareaAutoSize();

            ChatPage.refreshScroll(0);

            var exist = q.wrapper.css('transition');
            q.wrapper.css('transition', exist);
            q.wrapper.css('opacity', 0);
            setTimeout(function () {
                q.wrapper.animate({opacity: 1}, "fast");
            }, 100);

            $('.me').each(function (index, el) {

                el.addEventListener('swl', ChatPage.showDeleteMsgButton, false);
                el.addEventListener('swr', ChatPage.hideDeleteMsgButton, false);

            });

            $('.you').each(function (index, el) {

                el.addEventListener('swr', ChatPage.showDeleteMsgButton, false);
                el.addEventListener('swl', ChatPage.hideDeleteMsgButton, false);

            });

            _original_height = q.content.height();

        }, 300);
        return root;
    }

    /**
     * Create HTML Element For Any message
     * @return {DOM#Element}
     */
    function createMessageComponent(message_object, current_date) {
        /* Set Message Time */
        if (isNaN(current_date))
            var message_time = current_date;
        else    message_time = (current_date.getHours() < 10 ? '0' + current_date.getHours() : current_date.getHours()) + ':' + (current_date.getMinutes() < 10 ? '0' + current_date.getMinutes() : current_date.getMinutes());

        if (message_object['server_time']) message_time = message_object['server_time'];

        var message_container = $('<li>').attr('data-message-container-id', message_object.time).addClass('container-' + message_object.who);

        /* Create Delete Div */
        $('<div>').addClass('chat-page-delete-button').html('<img src="resources/images/delete_tick.png" /><br />Delete').bind('tap', ChatPage.deleteMessage).appendTo(message_container);

        /* Create Message Body Div */
        var body = $('<div>').addClass('message').addClass((message_object.who == 'me' ? 'me' : 'you')).attr('data-time-id', message_object.time);

        // Appending the Message
        var hiColor = (message_object.who == 'me') ? 'white' :  '#339a5c';
        var hiShadow = (message_object.who == 'me') ? '0px 0px 2px rgb(111, 111, 111);' :  '#0px 0px';
        if (decodeURI(message_object.message) == "Hi!")
            var span = $("<span>")
                    .addClass('flaticon-hi1')
                    .css("color",hiColor)
                    .css("text-shadow",hiShadow)
                    .css("margin-top","14px");

        else
            span = $('<span>').html(decodeURI(message_object.message));
        /* Check if Message is Hebrew */
        if (isHebrew(decodeURI(message_object.message))) span.addClass('utf8-direction');
        body.append(span);
        body.append($('<i>').html(message_time));

        // Appending the icon
        body.append($('<div>').addClass('relation-icon'));


        /* Appending */
        message_container.append(body);

        return message_container;
    }

    /**
     * Dispatched When Input is in Focus
     * @param {DOM#Event}
     */
    function inputFocus() {
        console.log('input Focus was called');
        /*
         if (isIos())
         ChatPage.q.input.css("position", "absolute");
         */
        /*
         if (device.platform != 'Android')   // does some bad shit on android
         $('.chat-page').css('position', 'fixed');
         */
    }

    /**
     * Dispatched when input blur
     * @param {DOM#Event}
     */
    function inputBlur(event) {
        if (isIos())
            ChatPage.q.input.css("position", "fixed");
        $('.chat-page').css('position', 'absolute');
        cordova.plugins.Keyboard.close();
        event.preventDefault();
    }

///*	*//**
//	* Handler for Keypress
//	* @param {DOM#Event}
//	*/
    function inputKeyPress() {
        if (isHebrew(q.inputText.val())) {
            q.inputText.addClass('utf8-direction');
        }
        // if two lines
        if ((q.inputText.outerHeight(true) > q.inputTextOriginalOuterHeight)
            && (!_already_changed)) {
            q.input.height(q.inputText.outerHeight(true));
            var newGap = q.inputText.outerHeight(true) - q.inputTextOriginalOuterHeight;
            //q.inputTextGap = (!q.inputTextGap) ? newGap : q.inputTextGap;
            q.inputTextGap = newGap;
            q.content.height(q.content.height() - q.inputTextGap);
            //q.content.css("background-size", parseInt(q.content.height() / q.content.width() * 100) + "% 100%");
            _already_changed = true;
            refreshScroll(200);
        }
    }


    /**
     * This Function will send Message to Selected User
     * @param {DOM#Event}
     */
    function sendMessage(event) {
        event.preventDefault();

        var destination_user = client_configuration['chat']['chat_user']['user'];
        var chat_message = q.inputText.val();

        if (!chat_message.length) {
            console.log('Try to send an empty message');
            return false;
        }
        q.inputText.val('');
        q.inputText.removeClass('utf8-direction');

        /*          Check if two lines and revert back original sizes               */
        if (q.inputText.outerHeight(true) > q.inputTextOriginalOuterHeight) {
            var newContentHeight = (q.contentWithKeyboardHeight < q.content.height()) //if keyboard is open
                ? q.contentOriginalHeight : q.contentWithKeyboardHeight;
            q.content.height(newContentHeight);
            //q.content.css("background-size", parseInt(q.content.height() / q.content.width() * 100) + "% 100%");
            q.input.css("height", q.inputOriginalHeight + "px");
            q.inputText.css("height", "");
            _already_changed = false;
        }
        //var messageToSend = encodeURI(chat_message);
        ConnectionPage.updateLastMessage(/*messageToSend*/ chat_message, destination_user);

        var url = (DEV_MODE ? '/chat/dev/sendSpecific' : '/chat/sendMessage');
        $.ajax({
            url    : BASE_SERVER + url,
            type   : 'POST',
            data   : {
                user_id : destination_user,
                message : /*messageToSend*/ encodeURI(chat_message),
                session : userModel.get('session'),
                relation: $('#hash').html().split(',')[0].slice(1),
                cb      : (new Date().getTime())
            },
            success: function (response) {
                /* Parsing the Response */

                response = JSON.parse(response);
                /* Provide alert Message */
                if (response.code != 0) return alertMsg('Something Went Wrong. Please try again...');
            },
            error  : function (response) {
                console.log('Failed');
                console.log(JSON.stringify(response));
            }
        });

        /* Appending Messages */
        pushMessage(destination_user, chat_message, 'me');
        Draw.appendChatMessage('me', chat_message, destination_user, (new Date()).getTime());

        console.log('Sending Message: ' + chat_message + ', To: ' + destination_user + ', From: ' + userModel.get('session'));
    }

    /**
     * Performing Auto Scroll to Bottom
     */
    function refreshScroll(speed) {
        //q.content.css('transition', '-webkit-transform 0.5s');
        // Update The Scroll
        setTimeout(function () {
            q.scroll.refresh();
            if (q.content.height() < q.wrapper.height()) {
                var lastMessage = q.lastMessage();
                var offsetY = lastMessage.height();
                q.scroll.scrollToElement(lastMessage[0], speed, 0, offsetY);
            }
        }, 50);
    }

    /**
     * Calculate the Messages Height - not all the messages are the same
     * @return {int}
     */
    function getChatHeights() {
        var height_counter = 30;

        $.each($('.message, .chat-date-note'), function (index, element) {
            height_counter = (height_counter + $(element).outerHeight(true));
        });

        return height_counter;
    }

    /* on Chat Content Tap */
    function onChatContentTap(e) {
        e.preventDefault();

        /* Reset Focus */
        Draw.resetFocus();

    }

    /* Handler for moving */
    function onContentScrolled() {
        _is_scrolled = true;
        if (q.content.height() > q.contentWithKeyboardHeight)
            Draw.resetFocus();
    }

    /* Create Chat Header Menu */
    function _createChatHeader(params) {
        var header = $('<header>');
        // Appending the Back Button
        if (isIos7Above())
            header.addClass('ios7Bar');
        header.append($('<div>').addClass('back-button icon-arrow-back').bind('tap', chatBackButton));

        // Appending Screen Title

        var main_div = $('<div>').addClass('screen-title').attr("data-user", String(params.user));
        main_div.append($('<h3>').html(params.first_name)); // ' ' + params.last_name)); // Set Name
        // Appending the Dtails

        var relation = (params['relation'] ? params['relation'] : (client_configuration['chat']['chat_user']['relation'] ? client_configuration['chat']['chat_user']['relation'] : undefined));

        var activity = (relation ? '#' + relation + ', ' : '');

        var distance = displayLocation(params['location']);

        main_div.append($('<div>').html('<span id="online-status-'+params.user+'">' + (Number(params.is_online) ? 'Online, ' : '') +
        '</span><span id="hash">' + activity +
        '</span><span id="distance">' + distance + '</span>'))
            .bind('tap', showProfileNew);

        header.append(main_div); // Appending to Header
        header.attr('data-usernum', params.storeIndex)
            .attr('from-chat', true)
            .attr('store', params.store);//.attr('fbid', params.fb_uid);

        // Appending the Right Content Section
        var right_div = $('<div>').addClass('right-content');
        right_div.append($('<img>').attr('id', 'chat-profile-icon')
            .attr('src', params.image + '?width=83&height=83'))
            .bind('tap', showProfileNew); // Appending the Image

        header.append(right_div);

        return header;
    }

    /* Setup keyboard listeners */
    function _setupKeyboardListener() {
        addKeyboardListener(true, 'chat', keyboardDidShown);

        addKeyboardListener(false, 'chat', keyboardDidHide);
    }

    /* Show Handler */
    function keyboardDidShown(height) {
        console.log(height);
        console.log('Keyboard show was called.');
        if (isIos()) {
            ChatPage.q.input.css("position", "absolute");
            setTimeout(function () {
                q.inputText.trigger('focus');
            }, 50);
        }
//		var onShowF = function () {
        console.log(window.innerHeight);
        if (!q.contentWithKeyboardHeight) {
            if (q.contentOriginalHeight < window.innerHeight) {
                setTimeout(function () {
                    keyboardDidShown(height);
                }, 50);
                return;
            }
            var newChatContentHeight = window.innerHeight - q.input.outerHeight() - q.header.outerHeight();
            q.content.height(newChatContentHeight);
            if (!q.contentWithKeyboardHeight) q.contentWithKeyboardHeight = newChatContentHeight;
            q.wrappBheight = window.innerHeight;
        } else  q.content.height(q.contentWithKeyboardHeight);
        //q.content.css("background-size", '100% ' + parseInt(q.content.height() / q.content.width() * 100 + 100) + '%');
        q.content.css("top", q.header.outerHeight() + "px");
        q.mainPage.height(q.wrappBheight);
        refreshScroll(200);
    }

    /* Hide Handler */
    function keyboardDidHide(height, width) {
        if (device.platform.toLocaleLowerCase() == 'ios')
            q.input.css("bottom", "");

        if (q.inputText.outerHeight(true) > q.inputTextOriginalOuterHeight)
            q.content.height(q.contentOriginalHeight - q.inputTextGap);
        else q.content.css('height', q.contentOriginalHeight + "px");
        q.mainPage.height(q.mainPage.parent().height());
        //q.content.css("background-size", parseInt(q.content.height() / q.content.width() * 100) + "% 100%");
        refreshScroll(200);
    }

    /* Main Handler for Chat Message */
    function onMessageReceivedHandler(data, cameFromNotification) {

        console.log('####');
        console.log(data);
        console.log('####');

        var counter = 0;

        $.each(data, function (index, pack) {

            /* Extract the values */
            var body = pack['body'];
            var message = pack.message; //decodeURIComponent(decodeURI(decodeURI(pack['message'])));
            var sender = pack['sender'];
            client_configuration['chatFriendsMap'] = spliceAndUnshift(client_configuration['chatFriendsMap'], sender);
            var addPartnerMessageNumber = function (response) {
                if ($('.connection-page').length) {
                    var showLine = function (first) {
                        line.remove();
                        $('.connection-page ul').prepend(line);
                        line.slideDown(150, function () {
                            line.bind('tap', openChat).bind('taphold', ConnectionPage.removePartner);
                            if (!first)
                                Draw.getRuntimekey('connection_scroll').refresh();
                        });
                    };

                    //var line = $('[data-user=' + sender + ']').parent('li');
                    var line = $('.connection-page li[data-usernum="' + sender + '"]');
                    if (!line[0]) {
                        line = ConnectionPage.createPartnerLineNew(response['message']);
                        addingStrangerAsLocalPartner(response['message'], function () {
                            ConnectionPage.updateLastMessage(message, sender);
                        });
                        line.css("display", "none");
                        var emptyConnectionPage = $('.empty-li');
                        if (emptyConnectionPage[0])
                            emptyConnectionPage.velocity('transition.slideDownOut', function () {
                                emptyConnectionPage.remove();
                                showLine(true);
                            });
                        else
                            showLine();
                    }
                    else {
                        var element = line.find('.num-messages span');
                        var number = parseInt(element.html());
                        element.html(number + 1);//.append($('<div>').addClass('relation-icon'));
                        element.parent().css('visibility', 'visible');

                        var user = String(response['message'].user);
                        var relation = $('#relation-' + user);
                        var onlineCssStatus = $('.row-partner-online .' + user);
                        if (response['message'].relation != relation.html().slice(1))
                            relation.html('#' + response['message'].relation);
                        onlineCssStatus.css("opacity", response['message'].is_online);


                        if (line.parent().children('li:first-child')[0] != line[0])
                            line.slideUp(150, showLine);
                        ConnectionPage.updateLastMessage(message, sender);
                    }
                }

                addingStrangerAsLocalPartner(response['message'], function () {
                    ConnectionPage.updateLastMessage(message, sender);
                });

            };

            /* if Chat page is open, performing appending and Check if sender is current open */
            if ($('.chat-page').length && client_configuration['chat']['chat_user']['user'] == sender)
            /* Appending */
            {
                Draw.appendChatMessage('you', decodeURI(message), sender, (iosDate(pack.time))); //.slice(11,16)
                ConnectionPage.updateLastMessage(message, sender);
            }

            else {
                /* Check if it required an openning chat */

                /* Increase indicate (Badge) */
                increaseNotificationCounter(sender);
                var goToChat = function (user) {
                    var userObj = user;
                    client_configuration['chat']['chat_user'] = user;
                    userObj.store = 'chat-friends';
                    userObj.storeIndex = user.user;
                    userObj.fromChat = true;
                    ConnectionPage.initLists();
                    Draw.switchPages(Draw.showChatPage(userObj));

                };

                // Application is running in foreground
                $.ajax({
                    url    : BASE_SERVER + '/user/newStranger',
                    data   : {
                        session: userModel.get('session'),
                        user   : sender
                    },
                    success: function (response) {
                        /* Parsing the response */
                        response = JSON.parse(response);

                        if (pack['foreground'] && parseInt(pack['foreground']) > 0) {

                            navigator.notification.vibrate(600);
                            sounds.notification.play();
                        }
                        else {
                            if (data.length == 1 && !!cameFromNotification && !$('.chat-page').length) {
                                setTimeout(function () {
                                    resetNotificationForUser(sender);
                                }, 1000);
                                if (!response.message.is_partners) {
                                    addingStrangerAsLocalPartner(response['message'], function () {
                                        goToChat(response['message'])
                                    });
                                }
                                else
                                    goToChat(response['message']);
                            }

                            if (counter == data.length && $('.connection-page').length == 0) {
                                resetNotificationForUser(sender);

                                Draw.switchPages(ConnectionPage.getPage('connection'));
                            }
                            counter++;
                        }
                        addPartnerMessageNumber(response);
                    }
                });
            }

        });


    }

    function getInputLineHeight() {
        return _original_input_line_height;
    }

    function isKeyboardOpened() {
        return _is_keyboard_opened;
    }

    function keyboardOpen() {
        _is_keyboard_opened = true;
    }

    function keyboardClosed() {
        _is_keyboard_opened = false;
    }


    function showDeleteMsgButton(event) {
        /* Move it left */
        $(this).addClass('delete-msg');
        $(this).parent().find('.chat-page-delete-button').show();
        $(this).parent().find('.chat-page-delete-button').attr("rel", "isShown");
    }

    function hideDeleteMsgButton(event) {
        if (!!($(this).parent().find('.chat-page-delete-button').attr("rel"))) {
            $(this).removeClass('delete-msg');
            $(this).parent().find('.chat-page-delete-button').hide();
            $(this).parent().find('.chat-page-delete-button').attr("rel", "");
        }
    }

    function deleteMessage(e) {
        e.preventDefault();
        var time_id = $(this).parent().attr('data-message-container-id');
        var user_id = client_configuration.chat.chat_user.user;

        var chat_data = JSON.parse(PStorage.get('chat_user_' + user_id));
        var new_data = [];

        $.each(chat_data, function (index, value) {
            /* Pushing data to new array */
            if (chat_data[index].time != time_id) new_data.push(value);
        });

        PStorage.set('chat_user_' + user_id, JSON.stringify(new_data));

        $(this).parent().slideUp('fast', function () {
            refreshScroll(200);
        });
    }

    function dateToCoolString(current_date) {
        var monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        //return current_date.getDate() + '/' + (current_date.getMonth() + 1) + '/' + current_date.getFullYear();
        return (monthNames[current_date.getMonth()] ) + ' ' + current_date.getDate() + ', ' + current_date.getFullYear();
    }

    function iosDate(time) {
        var t = time.split(/[- :]/);
        // Apply each element to the Date function
        var d = new Date(t[0], t[1] - 1, t[2], t[3], t[4], t[5]);

        return d.getTime();
    }

    function sendHi(e) {
        //var HImessage = 'Hi!';
        e.preventDefault();
        var self = this;
        var userObj = getUser(self);
        userObj.message = HImessage;

        if (!userObj.is_partners) {
            //createPartnersConnection(userObj.user, userObj['relation']);
            addingStrangerAsLocalPartner(userObj);
        }
        else
            ConnectionPage.updateLastMessage(HImessage, userObj.user);


        client_configuration['chatFriendsMap'] =
            spliceAndUnshift(client_configuration['chatFriendsMap'], userObj.user);

        $(self).html('')
            .addClass('icon-check')
            .css('font-family', 'icomoon')
            .unbind('tap');


        var url = (DEV_MODE ? '/chat/dev/sendSpecific' : '/chat/sendMessage');
        $.ajax({
            url    : BASE_SERVER + url,
            type   : 'POST',
            data   : {
                user_id : userObj.user,
                message : encodeURI(HImessage),
                session : userModel.get('session'),
                relation: userObj.relation,
                cb      : (new Date().getTime())
            },
            success: function (response) {
                /* Parsing the Response */

                response = JSON.parse(response);
                pushMessage(userObj.user, HImessage, 'me');

                //self.addClass('icon-check');
                /* Provide alert Message */
                if (response.code != 0) return alertMsg('Something Went Wrong. Please try again...');
            },
            error  : function (response) {
                console.log('Failed');
                console.log(JSON.stringify(response));
            }
        });

        if ($('.chat-page').length && client_configuration['chat']['chat_user']['user'] == userObj.user)
            Draw.appendChatMessage('me', HImessage, userObj.user, (new Date()).getTime());


    }

    return {
        getPage                 : getPage,
        inputFocus              : inputFocus,
        inputBlur               : inputBlur,
        sendMessage             : sendMessage,
        inputKeyPress           : inputKeyPress,
        refreshScroll           : refreshScroll,
        getChatHeights          : getChatHeights,
        onChatContentTap        : onChatContentTap,
        onContentScrolled       : onContentScrolled,
        onMessageReceivedHandler: onMessageReceivedHandler,
        getInputLineHeight      : getInputLineHeight,
        isKeyboardOpened        : isKeyboardOpened,
        keyboardOpen            : keyboardOpen,
        keyboardClosed          : keyboardClosed,
        showDeleteMsgButton     : showDeleteMsgButton,
        hideDeleteMsgButton     : hideDeleteMsgButton,
        deleteMessage           : deleteMessage,
        createMessageComponent  : createMessageComponent,
        keyboardDidHide         : keyboardDidHide,
        setupKeyboardListener   : _setupKeyboardListener,
        q                       : q,
        sendHi                  : sendHi
    };
})();