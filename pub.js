/**
 * Created by admin on 1/18/2015.
 */
var utils = require('./utils');


var pubFunctions = {

    pub: null,
    db : null,

    init           : function () {
        this.db = require('./mymongoose');
        this.pub = require("pubnub")({
            ssl          : true,
            uuid         : 'partnersServer',
            publish_key  : 'pub-c-78bc252c-b8e5-4093-877e-bf52f7d24963',
            subscribe_key: 'sub-c-540acdd2-96a2-11e4-ae17-02ee2ddab7fe'
            //publish_key  : process.env.PUBNUB_PUBLISH_KEY,
            //subscribe_key: process.env.PUBNUB_SUBSCRIBE_KEY
        });
        utils.init();
        this.subscribeToMain();

    },
    subscribeToMain: function () {
        var db = this.db;
        var pub = this.pub;
        var self = this;
        pub.subscribe({
            channel : 'partners-channel',
            callback: function (m) {
                console.log('callback said: ' + m);
            },
            presence: function (m) {
                console.log('presence said: ' + m.action + ' ' + m.uuid);
                var fbId = m.uuid.split('-')[0];
                if (!isNaN(fbId)) {

                    db.userModel.update({fb_uid: fbId},
                        {isOnline: (m.action == 'join')},
                        function (e, c, raw) {
                            var onlineSTR = (m.action == 'join') ? 'online' : 'offline';
                            console.log('updated ' + m.uuid.split('-')[2] + ' ' + m.uuid.split('-')[3] + ' to ' + onlineSTR);
                            //self.unsubscribe(id);
                        })
                }


            },
            connect : function (m) {
                console.log('Connected to main partners Channel')
            }
        });

        db.userModel.find({isOnline: true})
            .where('newVersion').equals(true)
            .select('id first_name last_name')
            .exec(function (e, users) {
                users.forEach(function (user) {
                    self.pub.here_now({
                        channel : user.id,
                        callback: function (m) {
                            console.log('callback was called');
                            if ((m.occupancy == 1 && m.uuids[0] == 'partnersServer' ) || !m.occupancy) {
                                db.userModel.findByIdAndUpdate(user.id, {isOnline: false},
                                    function (e, c, r) {
                                        console.log(e);
                                    });
                                utils.tellPartnersOnlineStatus(user.id, false);
                            }
                            else
                                self.subscribe(user.id);
                        }
                    });
                });
            })

    },


    sendMsg    : function (channel, msg, mainCallback) {
        this.pub.publish({
            channel : channel,
            message : msg,
            callback: function (e) {
                console.log("SUCCESS! sending pub msg", e);
                if (mainCallback) mainCallback(e);
            },
            error   : function (e) {
                console.log("FAILED! RETRY PUBLISH!", e);
                if (mainCallback) mainCallback(e);
            }
        });

    },
    userOffline: function (id) {
        console.log('userOffline');
        var self = this;
        utils.tellPartnersOnlineStatus(id, 'offline');

        this.db.userModel.update({_id: id}, {isOnline: false}, function (e, c, raw) {
            //console.log(c);
            self.unsubscribe(id);
        })

    },

    userOnline: function (id, callback) {
        console.log('useronline');
        var self = this;
        //this.subscribe(id, callback);

        this.pub.here_now({
            channel : id,
            callback: function (m) {
                if (m.uuids[1] == 'partnersServer' || m.uuids[0] == 'partnersServer') {
                    //self.unsubscribe(id, self.pub, function () {
                    //    self.subscribe(id, callback);
                    //});
                    callback();

                }
                else
                    self.subscribe(id, callback);
            }
        });
    },

    unsubscribe: function (channel, pub, myCallback) {
        console.log('unsubscribed');
        var str = pub.unsubscribe({
            channel : String(channel),
            callback: function (e) {
                console.log(e);
                if (myCallback)
                    myCallback()
            }
        });
        console.log(str);

    },

    hereNow  : function (channel, hereNowCallback) {
        this.pub.here_now({
            channel : String(channel),
            callback: function (m) {
                console.log('here now told me ' + m);
                hereNowCallback(m.occupancy > 1);
            }
        });
    },
    //
    //     Channel with each user
    //
    subscribe: function (channel, userCallback) {
        var self = this;
        var myPub = this.pub;
        var db = this.db;
        myPub.subscribe({
            restore  : false,
            channel  : channel,
            message  : function (m) {
                if (typeof m != 'string') return;
                if (m == 'im Alive') return;
                var msg = JSON.parse(m);
                self[msg.function](msg.id);
                console.log('server received message. channel : ' + channel);
                console.log(m);
            },
            presence : function (m) {
                console.log('presence said: ' + m.action + ' ' + m.uuid);
                var fbId = m.uuid.split('-')[1];
                var id = m.uuid.split('-')[0];
                if (!isNaN(fbId)) {
                    var isOnline = (m.action == 'join');
                    myPub.here_now({
                        channel : 'partners-channel',
                        callback: function (hereNow) {
                            if (!((hereNow.occupancy == 1 && hereNow.uuids[0] == 'partnersServer' ) || !hereNow.occupancy))
                                self.sendMsg('partners-channel', m)
                        }
                    });
                    utils.tellPartnersOnlineStatus(id, isOnline);
                    db.userModel.findByIdAndUpdate(id,
                        {isOnline: isOnline},
                        function (e, c, raw) {
                            var onlineSTR = (isOnline) ? 'online' : 'offline';
                            if (!isOnline)
                                self.unsubscribe(id, self.pub);
                            console.log('updated ' + m.uuid.split('-')[2] + ' ' + m.uuid.split('-')[3] + ' to ' + onlineSTR);
                            //self.unsubscribe(id);
                        })
                }

            },
            reconnect: function (m) {
                console.log('reconnected');
                if (userCallback) userCallback();

            },
            connect  : function (m) {
                console.log('subcribed');
                if (userCallback) userCallback();
            }
        });
    }

};

module.exports = pubFunctions;

