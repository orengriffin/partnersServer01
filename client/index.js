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
    $("#users").load('tabs/usersTab.html', function () {
        initUsersTab();
    });


    $("#password").keyup(function(event){
        if(event.keyCode == 13){
            login();
        }
    });
    $('#loginBut').click(login);
    $('#logout').click(function () {
         $('#userName').val('');
         $('#password').val('');

        $('#login').fadeIn();
    });

});


function login (){
    var userName = $('#userName').val();
    var password = $('#password').val();
    if (userName != '' &&
        userName != 'User Name' &&
        password != '' &&
        password != 'Password')
        $.ajax({
            url: document.URL + 'login',
            type: 'POST',
            data: {
                username: userName,
                password :password
            },
            success: function (response) {
                if (response == 'success')
                    $('#login').fadeOut();
            }

        })
}
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