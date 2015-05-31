function connectionFiltering(e) {
    e.preventDefault();
    var added_height = ($('.connection-list-wrapper li:first-child').height() * $('[data-partner=0]').length);

    /* Check if current is filter */
    if ($(this).hasClass('partners-filter')) {

        var constant_height = ($('.connection-list-wrapper ul li:last-child').height() - added_height);
        var counter = 1;

        $('[data-partner=0]').slideDown(150, function () {
            /* Check if current is last  */
            if (counter == $('[data-partner=0]').length) {

                var c_height = constant_height;
                setTimeout(function () {
                    $('.connection-list-wrapper ul li:last-child').height(c_height);
                }, 100);
            }

            counter++;
        });

        /* Adding New Partners Filter */
        $(this).removeClass('partners-filter');
        return;
    }
    sounds.partners.play();

    if (typeof(PStorage.get('is_first_connection')) == 'undefined') {
        alertMsg('Only partners will be displayed');
        PStorage.set('is_first_connection', true);
    }


    $('.connection-list-wrapper ul li:last-child').height($('.connection-list-wrapper ul li:last-child').height() + added_height);
    $('[data-partner=0]').slideUp(150, function () {
        Draw.getRuntimekey('connection_scroll').refresh();
    });

    /* Adding New Partners Filter */
    $(this).addClass('partners-filter');
}
/**
 * Apply Remove Partners Animation
 * @param {Object} _steps
 * @param {DOMElement} element
 * @param {function} callback
 */
function applyRemovePartnerAnimation(_steps, element, callback) {
    var _step = (Object.keys(_steps).length - 1);

    var interval = setInterval(function () {
        /* Aborting Interval */
        if (_step == 0) {
            clearInterval(interval);
            /* Calling Callback */
            if (typeof(callback) == 'function') callback(element);
        }

        /* Set Position */
        var x = _steps['step_' + _step]['x'];
        var y = _steps['step_' + _step]['y'];

        element.css('background-position', x + '% ' + y + '%');

        /* Appending Number to Counter */
        _step--;
    }, 50);
}

function showProfile(e, user_id, no_loader, element, append_to_chat) {
    if (e)
        e.preventDefault();

    var li = $(this).parent();

    user_id = (typeof(user_id) != 'undefined' ? user_id : $(this).closest('li').attr('data-user'));
    var self = this;
    showCurtain();
    $('.popup_curtain').css("opacity", "0");


    /* Reset Focus */
    Draw.resetFocus();

    /* Turn on loader */
    if (append_to_chat) chatLoaderOn('#chat-profile-icon');
    if (!no_loader) loaderOn('#result_user_' + user_id);

    /* Calling Server for Details */
    if (!append_to_chat) {
        var user_object = {};
        var age = $(this).parent().parent().find('.row-parenter-name').html().split("(")[1];
        age = (age) ? age.slice(0, -1) : '';
        user_object['image'] = $(this).attr('src').split('?')[0];
        user_object['user'] = $(this).attr('data-user');
        user_object['name'] = $(this).attr('data-username');
        user_object['is_online'] = $(this).parent().parent().find('.row-parenter-on-button').find('div').hasClass('online') ? true : false;
        user_object['last_seen'] = $(this).parent().parent().find('.row-parenter-on-button').find('span').html();
        user_object['is_partners'] = $(this).parent().parent().find('.row-parenter-set-partner').attr('data-partners') == 'yes';
        user_object['location'] = $(this).parent().parent().find('.row-parenter-distance').html();
        user_object['age'] = age;
        user_object['isBlocked'] = $(this).attr('data-isblocked');
        /* Drawn The User Panel */
        Draw.showPartnerProfile(self, user_object, append_to_chat);

        return;
    }
    $.ajax({
        url    : BASE_SERVER + '/user/newStranger',
        data   : {
            session: userModel.get('session'),
            user   : user_id
        },
        success: function (response) {
            /* Parsing the response */
            response = $.parseJSON(response);
            /* Smoothly aborting */
            if (response.code > 0) {
                if (!no_loader) loaderOff('#chat-profile-icon');
                if (append_to_chat) chatLoaderOff('#chat-profile-icon');
                return alertMsg('Connection Failed. Please Try again..!');
            }
            //if(append_to_chat) chatLoaderOff('#chat-profile-icon');

            /* Create User Object */
            var user_object = {};
            /* Set Content */
            user_object['image'] = response.message.image;
            user_object['user'] = user_id;
            user_object['name'] = response.message.first_name + ' ' + response.message.last_name;
            user_object['is_online'] = (response.message.is_online ? true : false);
            user_object['last_seen'] = response.message.last_seen;
            user_object['is_partners'] = (response.message.is_partners ? true : false);
            user_object['location'] = response.message.location;
            user_object['age'] = response.message.age;

            console.log(response);

            /* Drawn The User Panel */
            Draw.showPartnerProfile(self, user_object, append_to_chat);
        },
        error  : function (response) {

            if (!no_loader) loaderOff();
            if (append_to_chat) chatLoaderOff('#chat-profile-icon');
            return alertMsg('Connection Failed. Please Try again..!');
        }
    });


    return;

    /* Create User Object */
    var user_object = {};

    /* Define User */
    var temp_image = (this.nodeName.toLowerCase() == 'img' ? $(this).attr('src') : $(this).attr('data-img')).split('?');
    user_object['image'] = temp_image.shift();
    user_object['user'] = $(this).closest('li').attr('data-user');
    user_object['name'] = ($(this).hasClass('row-parenter-name') ? $(this).html() : $(this).attr('data-username'));
    user_object['is_online'] = ($(this).parent().parent().find('.row-parenter-on-button').find('div').hasClass('online') ? true : false);
    user_object['last_seen'] = $(this).parent().parent().find('.row-parenter-on-button').find('span').html();
    user_object['is_partners'] = $(this).parent().parent().find('.row-parenter-set-partner').attr('data-partners') == 'yes';
    user_object['location'] = $(this).parent().parent().find('.row-parenter-distance').html();

    /* Get The Object from Last Searches */


    //alert(JSON.stringify(user_object));
    /* Drawn The User Panel */
    Draw.showPartnerProfile(this, user_object);
}


function setPartnersPreview(event) {
    event.preventDefault();

    var status = setPartners(event, this);
    var relevant_element = $('#result_user_' + $('.partner-profile').attr('data-user')).find('.row-parenter-set-partner');

    if (status == 'yes') {
        relevant_element.addClass('im-a-partner');
        relevant_element.attr('data-partners', 'yes');
        sounds.partners.play();
    }
    else {
        relevant_element.removeClass('im-a-partner');
        relevant_element.attr('data-partners', 'no');
    }
}


function setPartners(e, self, fromPreview) {
    e.preventDefault();

    if (typeof(self) == 'undefined') self = this;

    if ($(self).attr('data-partners') == 'yes') {
        /* Unpartners */
        applyRemovePartnerAnimation(_add_partner_animation_steps, $(self), function (element) {
            /* Set The Flag */
            element.attr('data-partners', 'no');
            /* Set Partners */
            removeLocalPartner(element.attr('data-user'));
        });

        return 'no';
    }
    else {
        /* Apply Partners */
        applyAddPartnerAnimation(_add_partner_animation_steps, $(self), function (element) {
            /* Set The Flag */
            element.attr('data-partners', 'yes');
            sounds.partners.play();

            if (typeof(PStorage.get('is_first_partner')) == 'undefined') {
                alertMsg('You are now Partners!');
                PStorage.set('is_first_partner', true);
            }

            /* Set Partners */
            if (fromPreview)
                var user_object = userObjFromPreivew(self);
            else
                user_object = {
                    user      : element.attr('data-user'),
                    fb_uid    : element.parent().parent().parent().find('img').attr('src').split('/')[3],
                    image     : element.parent().parent().parent().find('img').attr('src').split('?')[0],
                    relation  : $(self).attr('data-activity'),
                    first_name: element.parent().parent().parent().find('img').attr('data-username').split(' ')[0],
                    last_name : element.parent().parent().parent().find('img').attr('data-username').split(' ')[1],
                    is_online : element.parent().parent().find('.row-parenter-on-button').find('div').hasClass('online') ? true : false,
                    location  : element.parent().parent().parent().find('.row-parenter-distance').html()
                };

            addingStrangerAsLocalPartner(user_object);
            createPartnersConnection(element.attr('data-user'), $(self).attr('data-activity'));
        });

        return 'yes';
    }
}
/**
 * Created by orengriffin on 2/19/15.
 */
function showSearchPageold(page_name) {
    /* Google Anlytics */
    ga('send', 'screenview', {'screenName': 'Search'});

    var root = $('<div>').addClass(_classes[page_name]).bind('tap', SearchPage.bluringTouch); // .height($(document).height());
    /* Setting Icon */
    root.append($('<div>').addClass('settings-icon').bind('touchstart', SearchPage.onSettingsIcon));
    /* Menu Icon */
    var menu = $('<div>').addClass('menu-icon').bind('tap', SearchPage.onMenuIcon);
    var notifications = $('<div>').addClass('notifications').html(client_configuration['notifications_counter']);

    if (!userModel.get('latitude')) {
        var satWrap = $('<div>').addClass('sat icon-location-on');
        root.append(satWrap);
    }

    if (!client_configuration['notifications_counter']) notifications.hide();

    menu.append(notifications);
    root.append(menu);

    /* Adding Main Logo */
    root.append($('<div>').addClass('static-logo'));

    var search_wrapper = $('<section>').addClass('search-wrapper');
    /* Appending the Title */
    search_wrapper.append($('<div>').attr('id', 'main-title').html('FIND A PARTNER FOR:'));

    var search_input = $('<div>').addClass('search-input');
    /* Appending the prefix */
    search_input.append($('<div>').addClass('search-prefix').html('#'));

    //var input = $('<input>').attr('type', 'search').attr('id', 'search_field').bind('focus', SearchPage.onSearchFocus).bind('blur', SearchPage.onSearchBlur).bind('keyup', SearchPage.onKeyUp);
    var input = $('<input>').attr('tabindex', '-1').attr('type', 'search').attr('id', 'search_field').bind('focus', SearchPage.onSearchFocus).bind('blur', SearchPage.onSearchBlur).bind('keyup', SearchPage.onKeyUp).bind("tap", function () {
        setTimeout(function () {
            $('.main-page input').trigger('focus')
        }, 50)
    });
    var form_wrapper = $('<form>').append(input).submit(function (e) {
        e.preventDefault();
        performSearch();
        //e.preventDefault();
    });

    search_input.append(form_wrapper);

    /* Adding Display Button */
    var search_button = $('<button>').append($('<img>').addClass('search-mag').attr('src', 'resources/images/main_search_icon.png')).bind('tap', function () {
        /* Performing Search */
        if ($('#search_field').val().length == 0) return;

        performSearch(event);
    }).append($('<img>').addClass('search-loader').attr('src', 'resources/images/loader.gif'));
    /* Appending */
    search_input.append(search_button);

    /* Appending the input to it's wrapper */
    search_wrapper.append(search_input);
    /* Appending the auto complate */
    search_wrapper.append($('<div>').addClass('autocomplete').addClass("search").append($('<ul>')));

    root.append(search_wrapper);

    /* Create Go Button */
    var button = $('<div>').addClass('go-button').bind('tap', SearchPage.bluringTouch);
    /* Append the button itself */
    button.append($('<button>').html('Go!'));
    /* Arrach event */
    button.bind('tap', SearchPage.goButtonTouch);
    if (userModel.get('latitude'))
        root.append(button);
    else
        whenNoLocation(root, button);

    /* Append Last Searches Section */
    var last_searches = SearchPage.getLastSearches();

    if (last_searches.length > 0) {

        var last_search_container = $('<div>').addClass('last-searches');
        var last_search_list = $('<ul>');


        $.each(last_searches, function (index, value) {
            /* Appending list item */
            last_search_list.append($('<li>').html('#' + value.toUpperCase()).bind('tap', selectPreviousActivity).attr('data-activity', value.toLowerCase()));
        });

        last_search_container.append(last_search_list);


        var scrollLastSeraches = function () {

            setTimeout(function () {
                var length = 0;
                for (var index = 0; index <= $('.last-searches>ul li').length; index++) length = (length + $($('.last-searches>ul li')[index]).outerWidth(true));

                $('.last-searches>ul').width(length);
                Draw.setRuntimeKey('last_searches_scroll', new IScroll('.last-searches', {
                    eventPassthrough: true,
                    scrollX         : true,
                    scrollY         : false,
                    preventDefault  : false
                }));
            }, 800);
        };
        if (userModel.get('latitude')) {
            root.append(last_search_container);
            scrollLastSeraches()
        }
        else {
            whenNoLocation(root, last_search_container);
            whenNoLocation(root, scrollLastSeraches);
        }

    }

    return root;
}
/* Return DIV With Relevant Image */
function _getImageSection(image_src, partner_object) {
    return $('<div>').addClass('picture').append($('<img>').attr('src', image_src + '?type=large')).attr('data-user', partner_object.user);
}

/* Return the name section */
function _getNameSection(partner_object) {
    var relation = (partner_object['relation'] ? '#' + partner_object['relation'] : '');
    var location = (partner_object.location) ? partner_object.location : '';
    return $('<div>').addClass('name').append($('<h5>').html(partner_object['first_name']).attr("last_name", partner_object['last_name'])).append($('<span>').html(relation)).attr('data-user', partner_object.user).attr("location", location);
}

/* Appending Online Section */
function _getOnlineSection(is_online, user) {
    return $('<div>').addClass('online-status ' + user).append($('<div>').html('on')).css('visibility', (is_online ? 'visible' : 'hidden'));
}

/* Return the status section */
function _getChatStatusSection(is_trust) {
    return $('<div>').addClass('chat-status').append($('<div>').html('Added You')).css('visibility', (is_trust ? 'visible' : 'hidden'));
}

/* Returing Number of Messages */
function _getNumberOfMessages(partner_object) {
    //var chat_object = PStorage.get('chat_user_' + partner_object.user);
    //var number_of_messages = (chat_object ? $.parseJSON(chat_object).length : 0);
    var number_of_messages = (client_configuration.notifications_map['user_' + partner_object.user] ? client_configuration.notifications_map['user_' + partner_object.user] : 0);
    var element = $('<div>').addClass('num-messages').attr('id', 'connection-messages-counter-' + partner_object.user).append('<span>').html(number_of_messages).append($('<div>').addClass('relation-icon'));
    // Appending Chat Interaction
    element.attr('data-user', partner_object.user);

    if (!number_of_messages) element.css('visibility', 'hidden');
    return element;
}

/* Return Partners Section */
function _getAddParners(partner_object) {
    var relation = partner_object['relation'];

    //var cls = (partner_object.is_partners ? 'partners' : '');
    return $('<div>').addClass('add-partner').addClass('partners').attr('data-activity', relation).bind('tap', ConnectionPage.addPartner).attr('data-user', partner_object.user).attr('id', 'connection_partner_id_' + partner_object.user);
}


function createPartnerLine(partner, color_counter) {
    if (color_counter == undefined) color_counter = 1;
    // Create Line
    var partner_line = $('<li>').css('background-color', _list_colors[color_counter]).attr('data-partner', (partner.is_partners ? '1' : '0'));
    // Appending Profile Image
    partner_line.append(_getImageSection(partner.image, partner));
    // Create Details Container
    var details_container = $('<div>').addClass('details');
    // Appending Name
    details_container.append(_getNameSection(partner));

    // Appending Online Section
    details_container.append(_getOnlineSection(partner.is_online, partner.user));

    // Appending 2 Way Trust Status
    //details_container.append(_getChatStatusSection(partner.two_way_trust));

    // Appending Number of Messages
    details_container.append(_getNumberOfMessages(partner));

    // Appending Partners Icon
    //details_container.append(_getAddParners(partner));

    /* Attaching at the end touchevent */
    //details_container//.bind('touchmove', ConnectionPage.scrollingResult).attr('data-user', partner.user);

    // Appending Details Section
    partner_line.bind('tap', openChat).bind('taphold', ConnectionPage.addPartner).append(details_container);

    return partner_line;
}
var gender_container = createView({
    tag  : 'div',
    cls  : 'form-group',
    atr  : [{id: 'check-awesome'}],
    items: [
        {
            tag: 'input',
            atr: [{type: 'checkbox'},
                {id: 'check-me'}]
        },
        {
            tag  : 'label',
            atr  : [{for: 'check-me'}],
            html : 'Male',
            bind : [{
                tap: function () {
                    var el = $(this).children('span:first-child');

                    // add the bubble class (we do this so it doesnt show on page load)
                    el.addClass('circle');

                    // clone it
                    var newone = el.clone(true);

                    // add the cloned version before our original
                    el.before(newone);

                    // remove the original so that it is ready to run on next click
                    $("." + el.attr("class") + ":last").remove();
                }
            }],
            items: [
                {
                    tag: 'span'
                },
                {
                    tag: 'span',
                    cls: 'check'
                },
                {
                    tag: 'span',
                    cls: 'box'
                }

            ]
        }
    ]
}).build().element;


function _createHiddenHeader(params) {
    var header = $('<header>').addClass('hidden-header');
    // Appending the Back Button
    header.append($('<div>').addClass('back-button').append($('<img>').attr('src', 'resources/images/back_button.png').bind('tap', chatBackButton)));
    //document.addEventListener("backbutton", chatBackButton, false);

    // Appending Screen Title
    var main_div = $('<div>').addClass('screen-title');
    main_div.append($('<h3>').html(params.first_name + ' ' + params.last_name)); // Set Name
    // Appending the Dtails
    var activity = (client_configuration['last_search'] ? '#' + client_configuration['last_search']['meta']['activity'] : '');
    main_div.append($('<div>').html('<span id="online-status">' + (params.is_online ? 'Online, ' : '') + '</span><span id="hash">' + activity + '</span>, <span id="distance">2km</span>'));

    header.append(main_div); // Appending to Header

    // Appending the Right Content Section
    var right_div = $('<div>').addClass('right-content');
    right_div.append($('<img>').attr('id', 'chat-profile-icon').attr('src', params.image + '?width=83&height=83')); // Appending the Image
    right_div.append($('<div>').addClass('icon').append($('<img>').attr('src', 'resources/images/chat_partners_icon.png')));

    header.append(right_div);

    return header;
}


function openChatFromResults(e, newThis) {
    e.preventDefault();
    /* Reset Focus */
    var self = (newThis) ? newThis : this;
    Draw.resetFocus();


    /* Lazy init if chat friends doesn't exist */
    if (!PStorage.get('chat-friends')) {
        PStorage.set('chat-friends', JSON.stringify({}), function () {
            openChatFromResults(e, self)
        });
        return;
    }

    //var user_id = $(this).attr('data-user');
    //var facebookId = $(this).parent().parent().parent().find('img').attr('src').split('/')[3];

    var user_object = {
        user      : $(self).attr('data-user'),
        fb_uid    : $(self).parent().parent().parent().find('img').attr('src').split('/')[3],
        image     : $(self).parent().parent().parent().find('img').attr('src').split('?')[0],
        relation  : client_configuration['last_search'].meta.activity,
        first_name: $(self).parent().parent().parent().find('img').attr('data-username').split(' ')[0],
        last_name : $(self).parent().parent().parent().find('img').attr('data-username').split(' ')[1],
        is_online : $(self).parent().parent().find('.row-parenter-on-button').find('div').hasClass('online') ? true : false,
        location  : $(self).parent().parent().parent().find('.row-parenter-distance').html()
    };
    /*
     $.each(client_configuration['last_search']['members'], function (index, member) {
     if (member && member.user == user_id) user_object = member;
     });*/

    //user_object['relation'] = client_configuration.last_search.meta.activity;

    client_configuration['chat']['chat_user'] = user_object;

    Draw.switchPages(Draw.showChatPage(user_object));
    resetNotificationForUser(user_object.user);
    if ($(this).parent().find('.row-parenter-set-partner').attr('data-partners') != 'yes') {
        createPartnersConnection(user_object.user, user_object['relation']);
        addingStrangerAsLocalPartner(user_object);
    }

    /* Set Archive Settings */
}

function openChatFromConnection(event, element) {
    var self = (element ? element : this);

    /* Reset Focus */
    Draw.resetFocus();

    var user_id = $($(self).children()[0]).attr('data-user');
    var name = $(self).find('.name');
    var image = $(self).find('img').attr('src').split('?')[0];
    var user_object = {
        user      : user_id,
        first_name: $(name.children()[0]).html(),
        last_name : $(name.children()[0]).attr("last_name"),
        location  : $(name).attr("location"),
        relation  : $(name.children()[1]).html().slice(1),
        image     : image,
        is_online : ($(self).find('.online-status').css("visibility") == "visible" )

    };

    /* Hidding Counter for User */
    $('#connection-messages-counter-' + user_id).css('visibility', 'hidden');

    /*
     $.each(client_configuration['last_connection_list'], function (index, member) {
     if (member && member.user == user_id) user_object = member;
     });
     */

    client_configuration['chat']['chat_user'] = user_object;

    Draw.switchPages(Draw.showChatPage(user_object));

    resetNotificationForUser(user_id);

    event.stopImmediatePropagation();
}

/**
 * Open Chat From Preview Section
 * @param {DOM#Event} event
 */
function userObjFromPreivew(self) {
    return {
        user      : $(self).attr('data-user'),
        fb_uid    : $(self).parent().parent().parent().find('.profile-picture img').attr('src').split('/')[3],
        image     : $(self).parent().parent().parent().find('.profile-picture img').attr('src').split('?')[0],
        relation  : client_configuration['last_search'].meta.activity,
        first_name: $(self).parent().parent().find('.row-parenter-name').html().split(' ')[0],
        last_name : $(self).parent().parent().find('.row-parenter-name').html().split(' ')[1],
        is_online : $(self).parent().parent().find('.online')[0] ? true : false,
        location  : $(self).parent().parent().find('.row-parenter-distance').html().split('<')[0]
    };

}
function openChatFromPreview(e) {
    e.preventDefault();

    /* Reset Focus */
    Draw.resetFocus();

    /* Lazy init if chat friends doesn't exist */
    if (!PStorage.get('chat-friends')) PStorage.set('chat-friends', JSON.stringify({}));

    var user_object = userObjFromPreivew(this);

    client_configuration['chat']['chat_user'] = user_object;

    Draw.switchPages(Draw.showChatPage(user_object));
    resetNotificationForUser(user_object.user);
    if ($(this).parent().find('.row-parenter-set-partner').attr("data-partners") != 'yes') {

        addingStrangerAsLocalPartner(user_object);
        createPartnersConnection(user_object.user, user_object['relation']);
    }

    /* Set Archive Settings */
}

function _createFillLayer(color, number_of_elements) {
    $('behind-scroll').css('background-color', color);
    var list_item = $('<li>').css('background-color', color);

    var lastLi = _getWrapperHeight() - $('.connection-list-wrapper ul').height();
    if (lastLi < 0) lastLi = 0;
    /* Appending Content if number_of_elements is 0 */
    if (!number_of_elements) {
        list_item.append($('<h3>').html('START LOOKING FOR PARTNERS!'));
        /* Add Suggested Words */
        list_item.append($('<h5>').html('SUGGESTED ACTIVITIES:'));

        var suggeted_counter = 0;

        $.each(server_configuration['featured'], function (index, activity) {

            if (suggeted_counter <= 4 && activity['activity']) list_item.append($('<button>').html('#' + activity['activity']).addClass('suggested-btn').bind('tap', ConnectionPage.noConnectionSuggested));
            suggeted_counter++;
        });
    }

    list_item.height(lastLi);

    return list_item;
}

function getPage(page_name) {
    //var root = $('<div>').addClass(_classes[page_name]).height(screen.height);
    var root = $('<div>').addClass(_classes[page_name]).height(window.innerHeight);
    /* Create Images Collage */
    var image_collage = $('<div>').addClass('images-collage');
    var counter = 0;

    for (counter = 0; counter < 11; counter++) {
        var element = server_configuration['pre_login']['login_images'][counter];
        /* Create Image and Append it */
        image_collage.append($('<div>').addClass('signin-collage-image').addClass('signin-collage-image-' + counter).append($('<img>').attr('src', element.image + '?type=large').load(function () {
            $(this).css('opacity', 1);
        })));
    }
    root.append(image_collage);

    /* Location Description */
    $('<div>').addClass('images-description').append($('<span>').html('You Have Many Partners Around You!')).appendTo(root);
    /* Logo */
    $('<figure>').append($('<img>').attr('src', 'resources/images/signin_logo.png')).appendTo(root);
    /* Button */
    var button = $('<button>').append($('<div>').addClass('facebook-icon').append($('<img>').attr('src', 'resources/images/facebook-icon.png'))).append($('<span>').html('Login Using Facebook')).appendTo(root);
    /* Binding Event Function */
    button.bind('tap', facebookButtonLogin);

    /* Note */
    $('<div>').addClass('note').html('We Would NEVER Post on Your Behalf!<span>By logging in you agree to the <span style="text-decoration: underline;display: inline; font-size: 1em;">terms and privacy policy</span></span>').appendTo(root).bind('tap', PerLogin.showTerms);

    return root;
}
function oldEnterApp ( ) {
else if (response.code == 10) {
        if (app_loaded) return;
        inputMsg('We need to make sure you are a real person. Please provide us with your email:', function (response) {
            /* Verify First Time */
            if (!isValidEmail(response)) {

                inputMsg('Email should be valid. Please provide us correct email address:', function (response) {
                    /* Vetify Second Time */
                    if (app_loaded) return;
                    if (!isValidEmail(response)) {
                        alertMsg('Email address isn\'t correct.', function () {
                            if (app_loaded) return;
                            location.reload();
                        });
                        return;
                    }

                    PStorage.set('local_email', response);
                    userModel.set('email', response);
                    enterApp(0);
                    return;

                }, 'email');
                $('#input-dox-field').focus();
                return;
            }

            PStorage.set('local_email', response);
            userModel.set('email', response);
            if (app_loaded) return;
            enterApp(0);

        }, 'email');

    }

}

.signin-collage-image {
    display: block
}
.signin-collage-image img {
    display: block;
    width: 100%;
    opacity: 0;
    -webkit-transition: opacity 2s; /* For Safari 3.1 to 6.0 */
    transition: opacity 2s;
}
.signin-collage-image-0 {
    width: 40%;
    height: 39%;
    position: absolute;
    overflow: hidden;
    z-index: 1;
}
.signin-collage-image-1 {
    position: absolute;
    z-index: 1;
    right: 0;
    width: 60%;
    overflow: hidden;
    height: 60%;
}
.signin-collage-image-2 {
    position: absolute;
    z-index: 1;
    width: 20%;
    height: 20%;
    overflow: hidden;
    top: 39%;
}
.signin-collage-image-3 {
    position: absolute;
    z-index: 1;
    width: 20%;
    height: 20%;
    overflow: hidden;
    top: 39%;
    left: 20%;
}
.signin-collage-image-4 {
    position: absolute;
    z-index: 1;
    width: 20%;
    height: 20%;
    overflow: hidden;
    top: 58%;
}
.signin-collage-image-5 {
    position: absolute;
    z-index: 1;
    width: 40%;
    height: 40%;
    overflow: hidden;
    top: 58%;
    left: 20%;
}
.signin-collage-image-6 {
    position: absolute;
    z-index: 1;
    width: 20%;
    height: 20%;
    overflow: hidden;
    top: 58%;
    left: 60%;
}
.signin-collage-image-7 {
    position: absolute;
    z-index: 1;
    width: 20%;
    height: 20%;
    overflow: hidden;
    top: 58%;
    left: 80%;
}
.signin-collage-image-8 {
    position: absolute;
    z-index: 1;
    width: 20%;
    height: 20%;
    overflow: hidden;
    top: 77.5%;
}
.signin-collage-image-9 {
    position: absolute;
    z-index: 1;
    width: 20%;
    height: 20%;
    overflow: hidden;
    top: 77.5%;
    left: 60%;
}
.signin-collage-image-10 {
    position: absolute;
    z-index: 1;
    width: 20%;
    height: 20%;
    overflow: hidden;
    top: 77.5%;
    left: 80%;
}




.page-landing {
    height: 100%;
    width: 100%;
    position: absolute;
    overflow: hidden;
}
.landing-bottom span{
    top:50%;
    left:50%;
    position: absolute;
    transform: translate(-50%,-50%);
    -webkit-transform: translate(-50%,-50%);
}

.page-landing * {

}
    .landing-loader {
    /*text-align: center;*/
    /*top: 87.5%;*/
    display: none;
    position: absolute;
    width: 100%;
    text-align: right;
    right: 12%;
    z-index: 2;
    transform: translateY(-35%);
    -webkit-transform: translateY(-35%);
    top:50%
}
.landing-loader img {
    width: 8%;

    -webkit-animation:spin 1.5s linear infinite;
    -moz-animation:spin 1.5s linear infinite;
    animation:spin 1.5s linear infinite;
}
.page-landing figure {
    position: absolute;
    top: 22%;
    width: 85%;
    margin: 0 7.5%;
    padding: 0;
}
.page-landing figure img {
    width: 100%;
}
.landing-logo {
    position: absolute;
    top: 47%;
    left: 56%;
    width: 50%;
    height: 50%;
    background-image: url("../images/main_logo_static.png");
    background-repeat: no-repeat;
    background-position: center;

    background-size: 80%;
    transform: translate(-50%,-50%);
}
.landing-bottom {
    position: fixed;
    bottom: 0;
    /* background-color: #008133; */
    /*padding: 15% 0;*/
    height: 19%;
    width: 100%;
    text-align: center;
    color: #fff;
    font-weight: 800;
    letter-spacing: 1px;
    font-size: 1.5em;
}
/* Signin Page */
.signin-page {
    position: absolute;
    width: 100%;
}
.signin-page>* {
    display: none;
}

