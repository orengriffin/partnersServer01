/**
 * Created by admin on 1/21/2015.
 */
function initUsersTab() {
    var pub = PUBNUB.init({
        uuid         : 'partnersAdmin',
        publish_key  : 'pub-c-78bc252c-b8e5-4093-877e-bf52f7d24963',
        subscribe_key: 'sub-c-540acdd2-96a2-11e4-ae17-02ee2ddab7fe'
    });

    //refresh(pub);

    pub.subscribe({
        channel: 'partners-channel',
        message: function (m, a, b) {
            refresh(pub, m, a, b)
        },

        connect: function () {
            $.ajax({
                    url    : document.URL.split('admin')[0] + 'pub/whoIsOnline',
                    success: function (response) {
                        for (var i = 0; i < response.length; i++) {
                            $('#onlineUsers').append(returnRow(
                                response[i].fb_uid + '-' +
                                response[i].first_name + '-' +
                                response[i].last_name
                            ));
                        }
                        console.log(response)
                    }
                }
            )
        }
    });

}
function refresh(pub, m, a, b) {
    if (m.action == 'join') {

        var uid = m.uuid.split('-');
        uid = uid[1] + '-' + uid [2] + '-' + uid[3];
        $('#onlineUsers').append(returnRow(uid));

    }
    else {
        var id = m.uuid.split('-')[1];
        if (!!$('#' + id)[0])
            $('#' + id).remove();
    }


}
function start(pub) {
    pub.here_now({
        channel : 'partners-channel',
        callback: function (m) {
            for (var i = 0; i < m.uuids.length; i++)
                if (m.uuids[i] != 'partnersAdmin') {
                    $('#onlineUsers').append(returnRow(m.uuids[i]));
                    $('#' + m.uuids[i].split("-")[0] + 'BtnFromto').click(sendFromFunc);
                    $('#' + m.uuids[i].split("-")[0] + 'BtnSendto').click(sendToFunc);
                }
        }
    });
}
function sendToFunc() {
    var fb_uid = $(this).attr('id').split("B")[0];
    getNumberOfUser(fb_uid, function (user) {
        var image = $('<img>')
            .addClass('ui')
            .addClass('avatar')
            .addClass('image')
            .attr('src', 'https://graph.facebook.com/' + fb_uid + '/picture');

        $('#sendRow').append(image);
        $('.BtnSendto').fadeOut();
        $('#btnSend').fadeIn();
        $('#btnSend').click(sendMessage);
        $('#sender').val(user);

    })
}
function sendMessage() {
    $($('[data-tab="chat"]')[0]).trigger('click');
    $('.BtnFromto').fadeIn();
    $('#sendRow').remove()

}
function sendFromFunc() {
    var fb_uid = $(this).attr('id').split("B")[0];
    getNumberOfUser(fb_uid, function (user) {
        $('#onlineUsers').prepend(addSendRor(user, fb_uid));
        $('.BtnSendto').fadeIn();
        $('.BtnFromto').fadeOut();
        $('#recipient').val(user);

    })
}
function getNumberOfUser(fb_uid, callback) {
    $.ajax({
            type   : 'POST',
            url    : document.URL + 'login/getUser',
            data   : {
                fb_uid: fb_uid
            },
            success: function (response) {
                callback(response)
            }
        }
    )

}
function returnRow(name) {
    var nameArray = name.split("-");
    if (!!$('#' + nameArray[0])[0]) return;

    name = nameArray[1] + ' ' + nameArray[2];
    var row = $('<div>').addClass('item').attr('id', nameArray[0]);
    var image = $('<img>')
        .addClass('ui')
        .addClass('avatar')
        .addClass('image')
        .attr('src', 'https://graph.facebook.com/' + nameArray[0] + '/picture');
    var content = $('<div>').addClass('content');
    var sendTo = $('<div>').addClass('right floated compact ui button BtnSendto')
        .html('sendTo')
        .attr('id', nameArray[0] + 'BtnSendto')
        .attr('style', 'display:none');
    var sendFrom = $('<div>').addClass('right floated compact  ui button BtnFromto')
        .html('sendFrom')
        .attr('id', nameArray[0] + 'BtnFromto');
    var header = $('<div>').addClass('header').html(name);
    content.append(header);
    row.append(image);
    row.append(content);
    row.append(sendTo);
    row.append(sendFrom);
    return row;

}

function addSendRor(user, fb_uid) {
    var row = $('<div>').addClass('item').attr('id', 'sendRow');
    var content = $('<div>').addClass('content');
    var send = $('<div>').addClass('right floated compact ui button')
        .html('Send')
        .attr('id', 'btnSend')
        .attr('style', 'display:none');
    var header = $('<div>').addClass('header').html('Sending To   ')
        .attr('id', 'sendContent');
    var image = $('<img>')
        .addClass('ui')
        .addClass('avatar')
        .addClass('image')
        .attr('src', 'https://graph.facebook.com/' + fb_uid + '/picture');

    content.append(header);
    row.append(image);
    row.append(content);
    row.append(send);
    return row;
}