var express = require('express');
var router = express.Router();
var db = require('./../mymongoose');
var utils = require('./../utils');
var pub = require('./../pub');
var async = require('async');
var gcm = require('node-gcm');
var apn = require('apn');
var ObjectId = require('mongoose').Types.ObjectId;
//var GCM = require('gcm').GCM;


router.get('/getHistory', function (req, res) {

    var user_id = req.query.session;
    async.parallel({
        me         : function (callback) {
            db.userModel.findById(user_id)
                .select('platform newVersion')
                .exec(function (e, me) {
                    callback(e, {
                        platform  : me.platform,
                        newVersion: me.newVersion
                    });
                });
        },
        gotMessages: function (callback) {
            db.messageModel.aggregate([
                    {
                        //$match:{isRead:  false}
                        $match: {
                            $and: [
                                {isRead: false},
                                {recipient_id: ObjectId(user_id)},
                                {isBlocked: false}
                            ]
                        }
                    },

                    {
                        $project: {
                            id     : "$_id",
                            _id    : 0,
                            time   : 1,
                            sender : 1,
                            message: 1
                        }
                    }
                ]
            )
                .exec(function (e, messages) {
                    callback(e, messages);
                });

        }
    }, function (e, resutls) {
        var messages = (resutls.gotMessages) ? resutls.gotMessages : [];
        if (resutls.me.newVersion && resutls.me.platform.toLocaleLowerCase() == 'ios')
            appendCompleted(null, messages, function () {
                res.send(JSON.stringify({message: messages}));
            });
        else
            res.send(JSON.stringify({message: messages}));

    });

});
function appendCompleted(req, res, callback) {
    if (req)
        var messages = req.body.messages.split(',');
    else
        messages = res;

    console.log('appendCompleted');
    var count = 0;

    messages.forEach(function (id) {
        if (id.id)
            id = id.id;
        var length = this.length;
        db.messageModel.findByIdAndUpdate(id,
            {isRead: true}, function (e, c, r) {
                if (!e)
                    count++;
                if (count == length) {
                    if (callback)
                        callback();
                    else
                        res.send('success');

                }
            });

    }, messages);

}


router.post('/appendCompleted', function (req, res) {
    appendCompleted(req, res);
});

function msgObj(msg, sender, relation, senderModel, isForeground) {
    var objToReturn = {
        data      : {
            creation: parseInt(new Date().getTime() / 1000),
            message : msg,
            sender  : sender
        },
        sound     : "1",
        subtitle  : "",
        title     : (relation) ? '#' + relation : 'unknown',
        ticketText: "",
        vibrate   : "1",
        message   : senderModel.first_name + ' ' + senderModel.last_name + ': ' + msg
    };
    if (isForeground)
        objToReturn.foreground = '1';
    return objToReturn
}

function oldTime(date) {
    var oldDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    var hour = date.getHours() + ':';
    hour += (date.getMinutes() > 10) ? date.getMinutes() : ('0' + date.getMinutes());
    hour += ':';
    hour += (date.getSeconds() > 10) ? date.getSeconds() : ('0' + date.getSeconds());
    var strRtn = (oldDate + ' ' + hour);
    console.log(strRtn);
    return strRtn;

}

function sendNotification(recipient, sender, message, relation, callback) {
    if (recipient.platform.toLowerCase() == 'android') {
        console.log('sending ' + message + ' to ' + recipient.first_name + ' ' + recipient.udid);
        gcm.Sender('AIzaSyAnpn0Y61bm5PuFzHbCojUr5-htTgzZfCE').send(new gcm.Message({
            data: msgObj(message, sender.user, relation, sender)
        }), [recipient.udid], 3, function (err, result) {
            callback(err, result);
        });
    }
    else if (recipient.platform.toLowerCase() == 'ios') {

        var options = {};
        var myDevice = new apn.Device(recipient.udid);
        var apnConnection = new apn.Connection(options);
        var note = new apn.Notification();

        note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
        note.badge = 1;
        note.sound = "default";
        note.message = (relation) ? relation : 'unknown';
        note.title = (relation) ? relation : 'unknown';
        /*
         note.sender = sender;
         */
        note.alert = {
            body: sender.first_name + ' ' + sender.last_name + ':' + message
            //'loc-key':'UTF-8'
        };
        note.payload = {
            creation: parseInt(new Date().getTime() / 1000),
            message : message,
            sender  : sender
        };

        apnConnection.pushNotification(note, myDevice);
        callback();

        //apn.Connection({}).pushNotification(new apn.Notification(), new apn.Device(recipient.udid) );
        console.log('ios');
    }

}

router.post('/sendMessage/dev', function (req, res) {
    var paramsReceived = req.body;
    async.parallel({
        recipient: function (callback) {
            db.userModel.findOne({user: paramsReceived.recipient})
                .select('platform newVersion isOnline udid _id first_name user partners blockedUsers newVersion')
                .exec(function (e, recipient) {
                    callback(e, recipient);
                });
        },
        sender   : function (callback) {
            db.userModel.findOne({user: paramsReceived.sender})
                .select('user _id partners first_name last_name')
                .exec(function (e, sender) {
                    callback(e, sender);
                });

        }
    }, function (e, r) {
        var isBLocked = (r.recipient.blockedUsers) ? (r.recipient.blockedUsers.indexOf(r.sender._id) != -1) : false;

        if (paramsReceived.toSave)
            var newMessage = db.messageModel({
                sender      : r.sender.user,
                sender_id   : r.sender._id,
                recipient   : r.recipient.user,
                recipient_id: r.recipient._id,
                message     : paramsReceived.message,
                isRead      : false,
                isBlocked   : isBLocked,
                timeStamp   : Date.now(),
                time        : (r.recipient.newVersion) ? oldTime(new Date(Number(paramsReceived.cb))) : oldTime(new Date(Number(paramsReceived.cb) - 7200000))
            });
        ['recipient', 'sender'].forEach(function (user, index) {
            var self = this;
            var test = !(r[user].partners.some(function (partner) {
                if (!!partner.partner_id.equals(r[self[(index) ? 0 : 1]]._id)) {
                    partner.activity_relation = r.activityId;
                    return true
                }
                return false
            }));
            console.log(test);
            if (test)
                r[user].partners.addToSet({
                    partner_id       : r[self[(index) ? 0 : 1]]._id,
                    activity_relation: r.activityId
                });
            r[user].save(function (e) {
                console.log(e);
            });


        }, ['recipient', 'sender']);

        //r.sender.relations.addToSet();
        async.parallel({
            isSaved           : function (callback) {
                if (paramsReceived.toSave)
                    newMessage.save(function (e) {
                        console.log('message save: ' + !e);
                        callback(e, !e);
                    });
                else
                    callback(e, false);
            },
            isRecipeientOnline: function (parallelCallback) {
                pub.hereNow(r.recipient._id, function (isOnline) {
                    if (r.recipient.isOnline != isOnline) {
                        console.log('good thing i used here now');
                        db.userModel.update({_id: r.recipient._id}, {isOnline: isOnline});
                    }
                    else console.log('here now shouldnt have been used');
                    parallelCallback(null, isOnline);
                });
            }
        }, function (e, secondResults) {
            if (paramsReceived.type == 'Push')
                sendNotification(r.recipient, r.sender, paramsReceived.message, paramsReceived.relation,
                    function (e, result) {
                        res.send('notification error ' + e + '. success : ' + !result.failure);

                    });

            if (paramsReceived.type == 'PubNub')
                pub.sendMsg(r.recipient._id, msgObj(paramsReceived.message, r.sender.user, null, true, true),
                    function (e) {
                        if (!e)
                            res.send('Message sent through PubNub');
                        else
                            res.send('Message wasnt sent. error' + e);
                    });

        });


    });

});
router.post('/sendMessage/', function (req, res) {

    var paramsReceived = req.body;
    paramsReceived.message = decodeURI(paramsReceived.message);

    utils.sendMessage(paramsReceived, res);
});

function respond(res, error, message, isString) {
    var response = {
        error  : error,
        code   : 0,
        message: message
    };
    res.send((isString) ? JSON.stringify(response) : response);
}
module.exports = router;


