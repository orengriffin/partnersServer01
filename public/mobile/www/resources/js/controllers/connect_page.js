/* Connection Page */
var ConnectionPage = (function () {


    function getPage() {
        var root = $('<div>').addClass('connection-page').height(window.innerHeight).attr("slideTo", "left");
        // Header
        root.append(_createConnectionHeader());

        var ul = $('<ul>');

        root.append(getData(ul));
        root.append($('<div>').addClass('connection-list-wrapper')/*.height(_getWrapperHeight())*/.append(ul));
        return root;
    }

    function getData(ul) {
        // Decoding
/*

        var partners_object = [];

        /*/
/* Ordering the data *//*
*/
/*
        var list = PStorage.get('chat-friends');
        /*/
/* Verify List - Just in Case *//*
*/
/*
        if (!list) {
            PStorage.set('chat-friends', JSON.stringify({}));
        } else {
            list = JSON.parse(list);
            $.each(list, function (index, saved_user) {
                saved_user.is_partners = 1;
                partners_object[saved_user.user] = saved_user;
            });
        }
        client_configuration['chat-friends'] = {
            members: partners_object
        };
*/

        var partners_object =  initLists();

        var line = [];
        var equal = comparePartners(client_configuration['chat-friends'].members, client_configuration['chatFriendsMap']);
        if (!equal) {
            coolLoad(true);
            reBuildPartnerLists(function () {
                coolLoad(false);
                getData(ul);
            });
            return;
        }

        $.each(client_configuration['chatFriendsMap'], function (index, map) {
            var partner = partners_object[map];

            if (!partner.user) {
                delete partners_object[map];
                return;
            }

            line.push(createPartnerLineNew(partner));

        });
        if (!line[0]) {
            line.push(createEmptyPage(ul));
            return;

        }
        var drawLine = function (i) {
            var upDateScroll = function () {
                setTimeout(function () {
                    // Attach Scrolling
                    $('.connection-list-wrapper').height(window.innerHeight - $('.connection-page header').outerHeight());
                    Draw.setRuntimeKey('connection_scroll', new IScroll('.connection-list-wrapper', {mouseWheel: false}));
                }, 300);
            };

            if (!!line[0]) {
                line[i].css("opacity", "0");
                ul.append(line[i]);
                line[i].animate({opacity: 1}, 1, function () {
                    //$(this).bind('tap', openChat);
                    if (line.length - 1 != i) {
                        i++;
                        drawLine(i);

                    }
                    else {
                        upDateScroll();
                    }
                })
            } else {
                upDateScroll();
            }
        };
        drawLine(0);

        $.ajax({
            url    : BASE_SERVER + '/user/newGetPartnersList',
            data   : {
                session: userModel.get('session'),
                cb     : (new Date()).getTime()
            },
            success: function (response) {
                response = $.parseJSON(response);
                var partners_object = response.message;
                var saveNewRelation = false;
                for (var i = 0; i < partners_object.length; i++) {
                    // if chat open:
                    var user = String(partners_object[i].user);
                    //var fbid = String(partners_object[i].fb_uid);
                    var location = String(partners_object[i].location);

                    client_configuration['chat-friends'].members[user].location = location;
                    client_configuration['chat-friends'].members[user].is_online = partners_object[i].is_online;
                    client_configuration['chat-friends'].members[user].last_seen = partners_object[i].last_seen;
                    updateStoredUsers(user, 'last_seen', partners_object[i].last_seen);
                    //$('.name[data-user="' + user + '"]').attr("location", location);
                    var relation = $('#relation-' + user);
                    var onlineCssStatus = $('.row-partner-online.' + user);
                    if (relation[0])
                        if (partners_object[i].relation != relation.html().slice(1)) {
                            relation.html('#' + partners_object[i].relation);
                            client_configuration['chat-friends'].members[user].relation = partners_object[i].relation;
                            saveNewRelation = true;
                        }
                    onlineCssStatus.css("opacity", partners_object[i].is_online + '');


                    // if in chat with this partner

                    if ($('.chat-page')[0] && $('.chat-page .screen-title').attr('data-user') == user) {
                        if (partners_object[i].is_online)
                            $('#online-status').html('Online, ');
                        else
                            $('#online-status').html('');

                        $('#hash').html('#' + partners_object[i].relation + ', ');

                        if (location < 1) {
                            var distance = ((location * 1000) + 'M');
                        }
                        /* Display Kilometers */
                        else {
                            distance = location + 'Km';
                        }

                        $('#distance').html(distance);
                    }
                }
                if (saveNewRelation)
                    addingManyLocalPartner(client_configuration['chat-friends'].members, null, true);
            }
        });
        return ul;
    }

    function connectBackButton(e) {
        if (e)
            e.preventDefault();
        Draw.switchBack();
    }

    function comparePartners(obj, arr) {
        var objCounter = 0;

        for (var prop in obj)
            if (prop) objCounter++;

        return objCounter == arr.length;

    }

    function _createConnectionHeader() {
        var header = $("<header>");
        if (isIos7Above())
            header.addClass('ios7Bar');

        // Appending the Back Button
        header.append($('<div>').addClass('back-button icon-arrow-back').bind('tap', ConnectionPage.connectBackButton));

        // Appending Screen Title
        var main_div = $('<div>').addClass('screen-title');
        main_div.append($('<div>').html('Conversations')); // Set Name

        header.append(main_div); // Appending to Header

        return header;
    }

    function createEmptyPage(ul, fromDeleted) {
        var list_item = $('<li>').css('height', window.innerHeight - $('header').height())
            .addClass('empty-li')
            .css('display', 'none')
            .append($('<div>').html('START LOOKING FOR PARTNERS!'))
            .append($('<div>').html('SUGGESTED ACTIVITIES:'));

        var buttons = $('<div>').attr('id', 'buttons-wrapper');

        $.each(server_configuration['featured'], function (index, activity) {

            if (index <= 3 && activity['activity'])
                buttons.append(
                    $('<div>').html('#' + activity['activity'])
                        .addClass('suggested-btn')
                        .bind('tap', ConnectionPage.noConnectionSuggested));

            if (index == 4 && activity['activity']) {
                ul.append(list_item.append(buttons));
                if (fromDeleted)
                    list_item.velocity('transition.slideUpIn');
                else
                    list_item.show();
            }

        });
    }

    /**
     * Removing Partner for List
     * @param {Object} e
     */
    function removePartner(e) {
        if (e) {
            e.preventDefault();
        }

        var self = this;

        confirmMsg('You are about to remove a partner. Are you sure?', function () {
            var line = $(self);
            var ul = line.parent();
            var user_id = line.attr('data-usernum');
            line.slideUp(200, function () {
                line.remove();
                Draw.getRuntimekey('connection_scroll').refresh();
                if (!ul.children()[0])
                    createEmptyPage(ul, true);
            });
            resetNotificationForUser(user_id);
            removeLocalPartner(user_id);
        });
    }


    /* Suggested Click */
    function noConnectionSuggested(e) {
        e.preventDefault();
        /* Activity */
        var activity = $(this).html().split('#').pop();
        $('#search_field').val(activity); // Set in search field

        Draw.switchBack();
        performSearch();
    }

    function createPartnerLineNew(partner) {
        var number_of_messages = (client_configuration.notifications_map['user_' + partner.user])
            ? client_configuration.notifications_map['user_' + partner.user] : 0;
        var showMessages = (number_of_messages) ? 'visibility' : 'hidden';

        return createView({
            tag  : 'li',
            atr  : [
                {'data-usernum': partner.user},
                {'store': 'chat-friends'}
            ],
            bind : [
                {tap: openChat},
                {taphold: removePartner}
            ],
            items: [
                {
                    tag  : 'div',
                    cls  : 'picture',
                    items: [
                        {
                            tag: 'img',
                            atr: [{src: partner.image + '?width=120&height=120'}]
                        }
                    ]
                },
                {
                    tag  : 'div',
                    cls  : 'details',
                    items: [
                        {
                            tag  : 'div',
                            cls  : 'name',
                            items: [
                                {
                                    tag : 'div',
                                    cls : 'name',
                                    html: partner.first_name
                                },
                                {
                                    tag: 'span',
                                    cls: 'row-partner-online ' + partner.user,
                                    atr: [{style: 'opacity:' + 0 + ';'}]
                                },
                                {
                                    tag : 'span',
                                    atr : [{id: 'relation-' + partner.user}],
                                    cls : 'connection-relation',
                                    html: '#' + partner.relation
                                },
                                {
                                    tag : 'div',
                                    cls : 'row-partner-message ' + partner.user,
                                    atr : [{style: (partner.message) ? 'display:block;' : 'display:none;'}],
                                    //html: decodeURI(partner.message)
                                    html: partner.message
                                }
                            ]
                        },
                        {
                            tag  : 'div',
                            cls  : 'num-messages',
                            atr  : [
                                {id: 'connection-messages-counter-' + partner.user},
                                {style: 'visibility:' + showMessages}
                            ],
                            items: [
                                {
                                    tag : 'span',
                                    html: number_of_messages + ''
                                }
                            ]
                        }
                    ]
                }
            ]
        }).build().element;
    }

    function reBuildPartnerLists(callback) {
        $.ajax({
            url    : BASE_SERVER + '/user/newGetPartnersList',
            data   : {
                session: userModel.get('session'),
                cb     : (new Date()).getTime()
            },
            success: function (response) {
                response = $.parseJSON(response);
                var partners_object = response.message;
                var partnersArr = [];
                for (var i = 0; i < partners_object.length; i++) {
                    partnersArr.addToSet(partners_object[i].user + '')
                }
                testLocalPartners(partnersArr, userModel.get('session'), callback)

            }
        });
    }

    function updateLastMessage(message, user, callback) {
        if (client_configuration['chat-friends'])
            client_configuration['chat-friends'].members[user].lastMessage = message;

        var list = PStorage.get('chat-friends');

        //if (list)
        list = JSON.parse(list);
        list['chat_user_' + user].message = message;
        PStorage.set('chat-friends', JSON.stringify(list), function () {
            if (callback) callback();
        }); // Saving

        if ($('.connection-page')[0])
            $('.row-partner-message.' + user).html(message).show();
    }

    function initLists () {
        var partners_object = [];
        var list = PStorage.get('chat-friends');
        //* Verify List - Just in Case *//*
        if (!list) {
            PStorage.set('chat-friends', JSON.stringify({}));
        } else {
            list = JSON.parse(list);
            $.each(list, function (index, saved_user) {
                saved_user.is_partners = 1;
                partners_object[saved_user.user] = saved_user;
            });
        }
        client_configuration['chat-friends'] = {
            members: partners_object
        };

        return partners_object;
    }

    return {
        getPage              : getPage,
        connectBackButton    : connectBackButton,
        removePartner        : removePartner,
        noConnectionSuggested: noConnectionSuggested,
        createPartnerLineNew : createPartnerLineNew,
        updateLastMessage    : updateLastMessage,
        initLists : initLists
    };
})();