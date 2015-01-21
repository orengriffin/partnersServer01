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
        message: function (m,a,b) {
            refresh(pub, m, a,b)
        },

        connect: function () {
            start(pub)
        }
    });

}
function refresh(pub,m, a, b) {
    if (m.action == 'offline')
    {
        var id = m.user.split('-')[0];
        if (!!$('#' + id)[0])
            $('#' + id).remove();
    }
    if (m.action == 'online')
        $('#onlineUsers').append(returnRow(m.user));

}
function start(pub) {
    pub.here_now({
        channel : 'partners-channel',
        callback: function (m) {
            for (var i = 0; i < m.uuids.length; i++)
                if (m.uuids[i] != 'partnersAdmin')
                    $('#onlineUsers').append(returnRow(m.uuids[i]))
        }
    });
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
        .attr('src','https://graph.facebook.com/'+nameArray[0] +'/picture');
    var content = $('<div>').addClass('content');
    var header = $('<div>').addClass('header').html(name);
    content.append(header);
    row.append(image);
    row.append(content);
    return row;
}