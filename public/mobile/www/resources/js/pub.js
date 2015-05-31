/**
 * Created by admin on 1/18/2015.
 */
var pub = (function () {
    var pub = null;
    var pChannel = null;
    var pubAlive = null;
    var myId;

    function init(myName) {
        myId = myName;
        console.log('init pub');
        pub = PUBNUB.init({
            publish_key  : 'pub-c-5496f3f8-ffc2-4eb2-8412-23cc45bae2e2',
            subscribe_key: 'sub-c-6b651372-cd5a-11e4-801b-02ee2ddab7fe',
            uuid         : myId,
            ssl          : true
        });
    }

    function unsubscribe(callback) {
        if (pubAlive)
            clearInterval(pubAlive);

        if (pChannel) {
            pub.unsubscribe({
                channel : pChannel,
                callback: function () {
                    console.log('unSubscribing');
                    if (callback)
                        callback();
                }
            });
        }
    }
    function reSubscribe() {
        console.log('reSubscribe');
            $.ajax({
                    url    : BASE_SERVER + '/pub/online',
                    type   : 'POST',
                    data   : {
                        id: userModel.get('session')
                    },
                    success: function (channel) {
                        pChannel = channel;
                        userModel.set('channel', channel);
                        init(channel + '-' + PStorage.get('first_name') + '-' + PStorage.get('last_name'));
                        subscribe(channel);
                    },
                    error  : function (res) {
                        console.log(res)
                    }

                }
            );

    }



    /*
        function reSubscribe() {
            console.log('reSubscribe');
            if (pChannel)
                pub.here_now({
                    channel : pChannel,
                    callback: function (m) {
                        var connect = function () {
                            if (userModel.get('session'))
                                $.ajax({
                                        url    : BASE_SERVER + '/pub/online',
                                        type   : 'POST',
                                        data   : {
                                            id: pChannel
                                        },
                                        success: function (res) {
                                                subscribe(pChannel);
                                        },
                                        error  : function (res) {
                                            console.log(res)
                                        }

                                    }
                                );
                        };


                        if (m.occupancy && ( m.uuids[0] == myId ||
                            m.uuids[1] == myId))
                        {
                            unsubscribe(connect)
                        }
                        else connect();

                    }
                });

        }

    */
    function subscribe(channel) {
        console.log('subscribing');

        pChannel = channel;
        pub.subscribe({
            //restore :true,
            channel: pChannel,
            message: function (m) {
                if (typeof m == 'string') return;
                if (typeof m.online != "undefined") {
                    updateOnlineStatus(m);
                    return;
                }
                if (typeof m.distance != "undefined") {
                    updateDistance(m);
                    return;

                }
                notifications_details = m;
                initChat(0);

            },
            connect: function (m) {
                console.log('connected to ' + m);
                pubAlive = setInterval(function () {
                    pub.publish({
                        channel : pChannel,
                        message : 'im Alive',
                        callback: function () {
                        }
                    })
                }, 300000)
            }
        });

    }

    function getInterval() {
        return pubAlive;
    }

    function wasInit() {
        return !!pub;
    }

    return {
        init       : init,
        subscribe  : subscribe,
        unsubscribe: unsubscribe,
        reSubscribe: reSubscribe,
        getInterval: getInterval,
        wasInit    : wasInit


    };
})();