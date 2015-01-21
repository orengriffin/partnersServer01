/**
 * Created by admin on 1/21/2015.
 */
function initUsersTab () {
    var pub = PUBNUB.init({
        publish_key  : 'pub-c-78bc252c-b8e5-4093-877e-bf52f7d24963',
        subscribe_key: 'sub-c-540acdd2-96a2-11e4-ae17-02ee2ddab7fe',
        uuid         : 'partnersAdmin'
    });

    //refresh(pub);

    pub.subscribe({
        channel:'MainPartnersChannel',
        message: function () {
            refresh(pub)
        },
        connect: function () {
            refresh(pub)
        }
    });

}

function refresh (pub)
{
    pub.here_now({
        channel:'MainPartnersChannel',
        callback: function (m) {
            for (var i = 0; i < m.uuid.length; i++)
                $('onlineUsers').append(returnRow(m.uuid[i]))
        }
    });
}

function returnRow (name)
{
    var row = $('<div>').addClass('item');
    var content = $('<div>').addClass('content');
    var header = $('<div>').addClass('header').html(name);
    content.append(header);
    row.append(content);
    return row;
}