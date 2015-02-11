/**
 * Created by admin on 1/21/2015.
 */
$( document ).ready(function() {
    console.log( "ready!" );
    //$('.menu .item').tab();
    $('.item').click(menuClick);

    // load Tabs
    $("#migrate").load('tabs/migrate.html', function () {
        initMigrate();
    });

    $("#chat").load('tabs/chatTab.html', function () {
        initChatTab();
    });
    $("#users").load('tabs/usersTab.html', function () {
        initUsersTab();
    });
    $("#activities").load('tabs/activitiesTab.html', function () {
        initActivitiesTab();
    });

    //
    setTimeout(function () {

        $('.slick').slick({
            //centerPadding:10px,
            arrow:false,
            adaptiveHeight:true,
            intialSlide:1
        });
    },500);



    $('#logout').click(function (event) {
        debugger;
        $(document).fadeOut (function () {
            window.location.replace(document.URL);
        })
    })

});

function menuClick ()
{
    me = $(this);
    $('.slick').slickGoTo(me.attr("slicktab"));
    $('.active').removeClass('active');
    if (!me.hasClass('active')) {
        me.addClass('active')
    }
}


