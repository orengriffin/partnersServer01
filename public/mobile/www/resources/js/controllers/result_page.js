/* Result Page */
var ResultPage = (function () {

    var _is_scrolling = false;

    /**
     * Image Loaded Event - Will Perform Some Changes after the image will be loaded
     */
    function imageLoaded() {
        /* Set Image Height as Parent */
        if ($(this).height() < $(this).parent().height()) $(this).height($(this).parent().height());

        /* Load Event */
        $(this).parent().parent().find('.row-parenter-content').css('opacity', 1);
        $(this).parent().css('opacity', 1);
    }

    /**
     * Return Invite More Box
     * @param {string} background_color
     * @return {DOM#Object}
     */
    function getInviteMoreDiv(background_color) {
        var root = $('<li>').addClass('invite-more').css('background-color', background_color);

        $('<div>').addClass('invite-call2action-title').html('WANT MORE PARTNERS?').appendTo(root);
        $('<div>').addClass('invite-call2action-subtitle').html('Invite Friends Now!').appendTo(root);

        var wrapper = $('<div>').addClass('invite-call2action-buttons');

        /* Adding Facebook Invite */
        $('<div>').addClass('facebook-invite').append($('<span>').html('Invite Facebook Friends')).bind('tap', function (e) {
            e.preventDefault();

            fbController.openRequest(server_configuration.custom_messages.facebook_message);
        }).appendTo(wrapper);

        /* Adding Whatsapp Invite */
        if (window.whatsapp_available) {
            $('<div>').addClass('whatsapp-invite').append($('<span>').html('Invite Whatsapp Friends')).bind('tap', function (e) {
                e.preventDefault();
                whatsappShare(server_configuration.custom_messages.whatsapp_message, 'http://partners-app.com/?ref=app_share_whatsapp');
            }).appendTo(wrapper);
        }

        wrapper.appendTo(root);

        setTimeout(function () {
            Draw.getRuntimekey('results-container-scroller').refresh();
            /* appending complete the rest layer */
            var deff = ($('.results-wrapper').parent().height() - $('.results-wrapper').height());
            /* */
            if (deff > 0) {
                $('.invite-more').animate({
                    height: "+=" + deff + "px"
                }, {
                    duration: 200
                });
            }

        }, 300);

        return root;
    }

    function getBounceBox(background_color) {
        return $('<li>').addClass('bounce-box').css('background-color', background_color);
    }

    function scrollingResult() {
        _is_scrolling = true;
    }

    function isScrolled() {
        return _is_scrolling;
    }

    function resetScrolling() {
        _is_scrolling = false;
    }

    return {
        isScrolled      : isScrolled,
        resetScrolling  : resetScrolling,
        scrollingResult : scrollingResult,
        imageLoaded     : imageLoaded,
        getInviteMoreDiv: getInviteMoreDiv,
        getBounceBox    : getBounceBox
    };
})();