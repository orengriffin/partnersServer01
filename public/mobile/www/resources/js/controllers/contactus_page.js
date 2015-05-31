/**
 * Created by admin on 11/27/2014.
 */
var ContactUs = (function () {

    function getPage() {
        var root = $('<div>').addClass('contact-us').attr("slideTo","right").css("display","none");
        var header = $('<header>');
        if (isIos7Above())
            header.addClass('ios7Bar');

        var background = $('<div>').addClass('contact-usbackground');
        var content = $('<div>').addClass('content').append($('<textarea>').attr('id', 'contactus-input').bind('keyup', ContactUs.keyUp)).bind('tap', function (e) {
            e.preventDefault();
            q.text.trigger('focus')
        });
        header.append($('<div>').addClass('icon-arrow-back back-button').bind('tap', ContactUs.contactBackbutton));
        header.append($('<div>').addClass('screen-title ').append($('<div>').html('Contact Us')));
        header.append($('<div>').addClass('right-content').append($('<img>').attr('src', 'resources/images/sendMessage.png').addClass("flip").bind('tap', ContactUs.contactSend)));
        root.append(header);
        root.append(background.append(content));

        return root;
    }

    var q = {
        header                  : undefined,
        background              : undefined,
        content                 : undefined,
        text                    : undefined,
        scroll                  : undefined,
        originalBackgroundHeight: undefined,
        mainPage : undefined,
        oldPage : undefined

    };

    function init() {
        q.header = $('.contact-us header');
        //NProgress.configure({showSpinner: false});
        q.background = $('.contact-usbackground');
        q.text = $('textarea');
        q.content = $('.content');
        var lockHeaderHeight = q.header.height();
        var lockContentHeight = window.innerHeight - q.header.outerHeight() - q.text.outerHeight;  //q.content.height();
        q.content.height(lockContentHeight);
        q.header.height(lockHeaderHeight);
        q.background.css("top", lockHeaderHeight);
        q.originalBackgroundHeight = q.background.height();
        Draw.setRuntimeKey('scroll', new IScroll(q.background[0], {mouseWheel: false}));
        q.scroll = Draw.getRuntimekey('scroll');
        q.oldPage = Draw.currentPage();
        q.mainPage = $('.contact-us');
        Draw.setCurrentPage('contact');
    }

    function contactBackbutton(e) {
        if (e)
            e.preventDefault();
        Draw.setCurrentPage(q.oldPage);
        console.log('going back');
        setTimeout(function () {
            $('#settings-header').velocity("fadeIn");
        },0);
        q.mainPage.velocity("transition.slideDownOut", function () {
            q.mainPage.remove();
        });
    }

    function contactSend(e) {
        e.preventDefault();
        if (q.text.val() == '') {
            popupMsg("Can't send Blank");
            return;
        }
        var placeForLoader = $('.right-content img');
        placeForLoader.css("opacity", "0.5");
        chatLoaderOn(placeForLoader[0], "1");
        /*
         NProgress.configure({ showSpinner: false });
         NProgress.start()
         */
        console.log('sending message');
        console.log( userModel.get('email'));
        var emailFrom = userModel.get('email');

        $.ajax(
            {
                url    : 'https://api.sendgrid.com/api/mail.send.json',
                type   : 'POST',
                data   : {
                    api_user: 'Partnersapp',
                    api_key : 'partners3434',
                    to      : 'partnersapp1@gmail.com',
                    toname  : 'Partners Developers',
                    subject : PStorage.get('first_name') + ' ' + PStorage.get('last_name') + ' sent you mail through app',
                    text    : q.text.val(),
                    from    : (emailFrom) ? emailFrom : 'Unknown@partners.com'

                },
                error  : function (response) {
                    /* Google Analytics? */
                    placeForLoader.css("opacity", "");
                    chatLoaderOff(placeForLoader[0]);

                    $.each(response.responseJSON.errors, function (index, value) {
                        console.log('Message was not sent. response: ' + value);
                        alertMsg(value);
                    })
                },
                success: function (response) {
                    placeForLoader.css("opacity", "");
                    chatLoaderOff(placeForLoader[0]);
                    //NProgress.done()
                    console.log('email sent. response message: ' + response.message);
                    popupMsg('Email Sent');
                    q.text.val('');
                    contactBackbutton();
                }
            })
    }

    function setupKeyboardListeners() {
        addKeyboardListener(false, 'contact', ContactUs.contactKeyboardDown);
        addKeyboardListener(true, 'contact', ContactUs.contactKeyboardUp);
    }

    function contactKeyboardDown() {
        q.background.height(q.originalBackgroundHeight);
        q.scroll.refresh();
    }

    function contactKeyboardUp() {
        console.log(window.innerHeight);
        if (q.originalBackgroundHeight < window.innerHeight) {
            setTimeout(function () {
                contactKeyboardUp();
            }, 50);
            return;
        }
        q.background.height(window.innerHeight - q.header.height());
        q.scroll.refresh();
    }

    function keyUp() {
        if (isHebrew(q.text.val()))
            if (!q.text.hasClass('utf8-direction'))
                q.text.addClass('utf8-direction');
        this.style.overflow = 'hidden';
        this.style.height = 0;
        this.style.height = this.scrollHeight + 'px';
        q.scroll.scrollTo(0, scrollY(), 200);
    }

    function scrollY() {
        var headerTop = q.header.height();
        var contentTop = parseFloat(q.content.css("top"));
        var contentPadding = parseFloat(q.content.css("padding"));
        var startPosY = headerTop + contentTop + contentPadding;
        var scrollAmount = q.text[0].scrollHeight;
        var result = window.innerHeight - (startPosY + scrollAmount);

        return (result < 0) ? result : 0;
    }

    return {
        getPage               : getPage,
        contactBackbutton     : contactBackbutton,
        contactSend           : contactSend,
        init                  : init,
        keyUp                 : keyUp,
        setupKeyboardListeners: setupKeyboardListeners,
        q                     : q,
        contactKeyboardDown   : contactKeyboardDown,
        contactKeyboardUp     : contactKeyboardUp

    };

})();
