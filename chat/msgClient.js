/**
 * Created by admin on 1/21/2015.
 */
$( document ).ready(function() {
    console.log( "ready!" );
    $('.menu .item').tab();
    $('.item').click(menuClick);

    // load Tabs
    $("#migrate").load('tabs/migrate.html', function () {
        initMigrate();
    });

    $("#chat").load('tabs/chatTab.html', function () {
        initChatTab();
    });

});


function menuClick () {
    //debugger;
    //$('.segment.active').fadeIn();

    /*    if(! ($(this)).hasClass('active')) {
            $('.active').removeClass('active');
            $(this).addClass('active');
            debugger;
            $('.segment .active').transition();
        }*/
}