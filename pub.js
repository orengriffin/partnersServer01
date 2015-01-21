/**
 * Created by admin on 1/18/2015.
 */

var pubFunctions = {

    pub: null,
    db : null,

    init: function () {
        this.db = require('./mymongoose');
        this.pub = require("pubnub")({
            ssl          : true,
            uuid         : 'partnersServer',
            publish_key  : 'pub-c-7d87a3c4-b1b8-4d33-be38-43b78065bc90',
            subscribe_key: 'sub-c-9d63a2c0-9665-11e4-9a03-02ee2ddab7fe'
        });

    },

    sendMsg    : function (channel, msg, mainCallback) {
        this.pub.publish({
            channel : channel,
            message : msg,
            callback: function (e) {
                console.log("SUCCESS! sending pub msg", e);
                mainCallback(e);
            },
            error   : function (e) {
                console.log("FAILED! RETRY PUBLISH!", e);
                mainCallback(e);
            }
        });

    },
    userOffline: function (id) {
        console.log('userOffline');
        var self = this;
        this.db.userModel.update({_id: id}, {isOnline: false}, function (e, c, raw) {
            //console.log(c);
            self.unsubscribe(id);
        })

    },

    userOnline: function (id, callback) {
        console.log('useronline');

        var self = this;
        this.db.userModel.update({_id: id}, {isOnline: true}, function (e, c, raw) {
            //console.log(c);
            callback(true);
            self.subscribe(id);
        })

    },

    unsubscribe: function (channel) {
        console.log('unsubscribed');
        this.pub.unsubscribe({
            channel: channel
        });

    },
    hereNow    : function (channel, hereNowCallback) {
        this.pub.here_now({
            channel : channel,
            callback: function (m) {
                console.log('here now told me ' + m);
                //console.log('user is:' + !!r.recipient.isOnline);
                hereNowCallback(m.occupancy > 1);
            }
        });
    },
    subscribe  : function (channel) {
        var self = this;
        var myPub = this.pub;
        myPub.subscribe({
            channel: channel,
            message: function (m) {
                if (typeof m != 'string') return;
                var msg = JSON.parse(m);
                self[msg.function](msg.id);
                console.log('server received message. channel : ' + channel);
                console.log(m);
            },
            connect: function () {
                console.log('subcribed');
                //callback(true);
                /*
                 myPub.publish({
                 channel: channel,
                 message: {"msg": 'Server Entered Chat !'}
                 });
                 */
            },
            restore: false
        });
    }

};

module.exports = pubFunctions;

