/**
 * Created by admin on 1/18/2015.
 */
var utils = require('./utils');


var pubFunctions = {

    pub         : null,
    db          : null,
    publishKey  : process.env.PUBNUB_PUBLISH_KEY,
    subscribeKey: process.env.PUBNUB_SUBSCRIBE_KEY,

    init: function () {
        this.db = require('./mymongoose');
        this.pub = require("pubnub")({
            ssl          : true,
            uuid         : 'partnersServer',
            publish_key  : this.publishKey,
            subscribe_key: this.subscribeKey
        });

        utils.init();
        this.subscribeToMain();
    },

    setKeys        : function (p, s) {
        this.publishKey = p;
        this.subscribeKey = s;
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
            .select('id first_name last_name channel newVersion')
            .where('newVersion').equals(true)
            //.where('channel').ne('')
            .exec(function (e, users) {
                users.forEach(function (user) {
                    self.pub.here_now({
                        channel : user.channel,
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
                                self.subscribe(user.channel);
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
        //var self = this;
        this.subscribe(id, callback);

        /*
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
         */
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
        channel += '-' + Date.now();
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
            presence : function (m, a, b, c) {
                console.log('presence said: ' + m.action + ' ' + m.uuid);
                var fbId = m.uuid.split('-')[1];
                var id = m.uuid.split('-')[0];
                if (!isNaN(fbId)) {
                    var isOnline = (m.action == 'join');
                    var onlineSTR = (isOnline) ? 'online' : 'offline';

                    myPub.here_now({
                        channel : 'partners-channel',
                        callback: function (hereNow) {
                            if (!((hereNow.occupancy == 1 && hereNow.uuids[0] == 'partnersServer' ) || !hereNow.occupancy))
                                self.sendMsg('partners-channel', m)
                        }
                    });
                    if (!isOnline)
                        self.unsubscribe(id + '-' + fbId, self.pub);
                    db.userModel.findById(id)
                        .select('channel isOnline')
                        .exec(function (e, user) {
                            if (user.channel == (id + '-' + fbId)) {
                                utils.tellPartnersOnlineStatus(id, isOnline);
                                user.isOnline = isOnline;
                                user.save(function () {
                                    console.log('updated ' + m.uuid.split('-')[2] + ' ' + m.uuid.split('-')[3] + ' to ' + onlineSTR);

                                })
                            }
                        });
                }

            },
            reconnect: function (m) {
                console.log('reconnected');
                if (userCallback) userCallback(channel);

            },
            connect  : function (m) {
                console.log('subcribed');
                if (userCallback) userCallback(channel);
            }
        });
    }

};

module.exports = pubFunctions;

