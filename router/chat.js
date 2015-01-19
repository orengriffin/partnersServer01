var express = require('express');
var router = express.Router();
var db = require('./../mymongoose');
var pub = require('./../pub');
var async = require('async');
var gcm = require('node-gcm');
//var GCM = require('gcm').GCM;

router.get('/getHistory', function (req, res) {
    var user_id = req.query.session;
    db.messageModel.aggregate([
            {
                $match: {
                    $or: [
                        {isRead: {$ne: true}}
                        ,
                        {recipient_id: user_id}
                    ]
                }
            }
            ,
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
            if (!messages)
                messages = [];
            res.send(JSON.stringify({message: messages}));
        });

});

router.post('/appendCompleted', function (req, res) {
    var messages = req.body.messages.split(',');
    console.log('messages');
    var count = 0;
    messages.forEach(function (id) {
        var length = this.length;
        db.messageModel.findByIdAndUpdate(id,
            {isRead: true}, function (e, c, r) {
                if (!e)
                    count++;
                if (count == length)
                    res.send('success');
            });

    }, messages);
});
function msgObj(msg, sender, relation, isForground) {
    var objToReturn = {
        data      : {
            creation: parseInt(new Date().getTime() / 1000),
            message : msg,
            sender  : sender
        },
        sound     : "1",
        subtitle  : "",
        title     : (relation) ? relation : 'unknown',
        ticketText: "",
        vibrate   : "1",
        message   : msg
    };
    if (isForground)
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
function sendNotifcation(recipient, sender, message, relation) {
    if (recipient.platform.toLowerCase() == 'android') {
        console.log('sending ' + message + ' to ' + recipient.first_name + ' ' + recipient.udid);
        gcm.Sender('AIzaSyAnpn0Y61bm5PuFzHbCojUr5-htTgzZfCE').send(new gcm.Message({
            data: msgObj(message, sender, relation)
        }), [recipient.udid], 3, function (err, result) {
            console.log(err);
        });
    }
    else if (recipient.platform.toLowerCase() == 'ios') {
        console.log('ios');
    }

}
router.post('/sendMessage/', function (req, res) {
    var paramsReceived = req.body;
    async.parallel({
        recipient: function (callback) {
            db.userModel.findOne({user: paramsReceived.user_id})
                .select('platform newVersion isOnline udid _id first_name user relations')
                .exec(function (e, recipient) {
                    callback(e, recipient);
                });
        },
        sender   : function (callback) {
            db.userModel.findById(paramsReceived.session)
                .select('user _id relations')
                .exec(function (e, sender) {
                    callback(e, sender);
                });

        }
    }, function (e, r) {
        var newMessage = db.messageModel({
            sender      : r.sender.user,
            sender_id   : r.sender._id,
            recipient   : r.recipient.user,
            recipient_id: r.recipient._id,
            message     : paramsReceived.message,
            isRead      : false,
            timeStamp   : Date.now(),
            time        : oldTime(new Date())
        });
        ['recipient', 'sender'].forEach(function (user, index) {
            var self = this;
            var test = !(r[user].relations.some(function (partner) {
                if (!!partner.partner_id.equals(r[self[(index) ? 0 : 1]]._id)) {
                    partner.relation = paramsReceived.relation;
                    return true
                }
                return false
            }));
            console.log(test);
            if (test)
                r[user].relations.addToSet({
                    partner_id: r[self[(index) ? 0 : 1]]._id,
                    relation  : paramsReceived.relation
                });
                r[user].save(function (e) {
                    console.log(e);
                });


        }, ['recipient', 'sender']);

        //r.sender.relations.addToSet();
        async.parallel({
            isSaved           : function (callback) {
                newMessage.save(function (e) {
                    console.log('message save: ' + !e);
                    callback(e, !e);
                });
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

            if (secondResults.isSaved && secondResults.isRecipeientOnline) {
                console.log('sendPubNub');
                pub.sendMsg(r.recipient._id, msgObj(paramsReceived.message, r.sender.user, null, true))
            }
            else
                sendNotifcation(r.recipient, r.sender.user, paramsReceived.message, paramsReceived.relation)
        });


    });

});
module.exports = router;


