/**
 * Created by admin on 1/21/2015.
 */
$( document ).ready(function() {
    console.log( "ready!" );


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
                if (response.code == 'success')
                    $('#login').fadeOut(function ()
                    {
                        console.log('succes for     ');
                        window.location.replace(document.URL + "admin?token="+response.token);
                        //window.location.href = document.URL + "admin?token="+response.token;
                    });
            }

        })
}
