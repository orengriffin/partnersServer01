/**
 * Created by admin on 1/21/2015.
 */
function initMigrate() {
    $('table button').click(mainAjax);
    bar = new Nanobar({bg: '#000'});


}
function mainAjax() {
    startBar();
    var first = $($(this).parent().parent().children()[0]).html();
    var which = $(this).html();
    var self = this;
//        debugger;
    $.ajax({
        url    : document.URL + 'migrate/' + first + '/' + which + '/',
//            data: user,
        timeout: 600000,
        success: function (res) {
            console.log(res);
            $(self).parent().css('background-color', 'lightgreen');
            stopBar();
            setTimeout(function () {
                $(self).parent().css('background-color', '');

            }, 60000);

        },
        error  : function (res) {
            console.log(res);
            stopBar();
            $(self).parent().css('background-color', 'red');
            setTimeout(function () {
                $(self).parent().css('background-color', '');

            }, 60000);

        }
    })
}
var timeOut = 0;
var bar = null;


function stopBar() {
    if (!!timeOut) {
        clearInterval(timeOut);
    }
    bar.go(100);
}
function startBar() {
    var x = 0;
    timeOut = setInterval(function () {
        if (x == 98) x = 2;
        bar.go(x += 2);
    }, 350);

}
