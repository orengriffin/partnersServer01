/**
 * Created by admin on 1/26/2015.
 */
var apn = require('apn');
var gcm = require('node-gcm');
var async = require('async');
var db = require('./mymongoose');
var pub = require('./pub');

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


function respond(res, error, message, isString) {
    var response = {
        error  : error,
        code   : 0,
        message: message
    };
    res.send((isString) ? JSON.stringify(response) : response);
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
var func = {

    myForEach: function (obj, callback, finish) {
        var counter = 0,
            keys = Object.keys(obj),
            length = keys.length;
        var next = function () {
            if (counter < length)
                callback(keys[counter], obj[keys[counter++]], next);
            else
                finish();
        };
        next();
    },


    distanceCalc: function (newLocation, oldLocation) {
        if (typeof(Number.prototype.toRad) === "undefined") {
            Number.prototype.toRad = function () {
                return this * Math.PI / 180;
            }
        }
        var lat1 = newLocation.lat;
        var lon1 = newLocation.lon;
        var lon2 = oldLocation.longitude;
        var lat2 = oldLocation.latitude;


        var R = 6371; // km
        var φ1 = lat1.toRad();
        var φ2 = lat2.toRad();
        var Δφ = (lat2 - lat1).toRad();
        var Δλ = (lon2 - lon1).toRad();

        var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        var d = R * c * 1000;

        return parseInt(d / 10) / 100;
    },

    ageCalc: function (birthday) {
        var age = (new Date().getTime()) - birthday.getTime();
        age /= 31558464000;
        return parseInt(age);
        //console.log('You age is ' + age);
    },

    timeCalc: function (then) {
        if (!then)
            return '';
        then = (new Date()).getTime() - then.getTime();

        then /= 1000;
        var timeObj = [
            {n: 60, s: 'Minutes'},
            {n: 60, s: 'Hours'},
            {n: 24, s: 'Days'},
            {n: 31, s: 'Months'},
            {n: 12, s: 'Years'},
            {n: 100, s: 'Milenums'}
        ];
        for (var i = 0; true; i++) {
            then /= timeObj[i].n;
            if (then / timeObj[i + 1].n < 1) {
                if (parseInt(then) == 1)
                    return parseInt(then) + ' ' + timeObj[i].s.slice(0, -1) + ' ago';
                return parseInt(then) + ' ' + timeObj[i].s + ' ago';
            }
        }

    },

    token: {
        theToken : null,
        isLoading: false,
        get      : function (callback) {
            var tokenToReturn = this.theToken;
            //this.isLoading = true;
            //callback(tokenToReturn);
            return tokenToReturn;
        },
        set      : function (tokenParam) {
            this.theToken = tokenParam;
        }

    },

    sendMessage: function (paramsReceived, res, notToSave) {
        {
            async.parallel({
                recipient: function (callback) {
                    db.userModel.findOne({user: paramsReceived.user_id})
                        .select('platform newVersion isOnline udid _id first_name user relations blockedUsers newVersion')
                        .exec(function (e, recipient) {
                            callback(e, recipient);
                        });
                },
                sender   : function (callback) {
                    db.userModel.findById(paramsReceived.session)
                        .select('user _id relations first_name last_name')
                        .exec(function (e, sender) {
                            callback(e, sender);
                        });

                }
            }, function (e, r) {

                var isBLocked =  (r.recipient.blockedUsers) ? (r.recipient.blockedUsers.indexOf(r.sender._id) != -1) : false;

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
                        if (notToSave)
                            callback(null, true);
                        else
                            newMessage.save(function (e) {
                                console.log('message save: ' + !e);
                                callback(e, !e);
                            });
                    },
                    isRecipeientOnline: function (parallelCallback) {
                        //parallelCallback(null, r.recipient.isOnline);
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
                        pub.sendMsg(r.recipient._id, msgObj(paramsReceived.message, r.sender.user, null, true, true), function (e) {
                            respond(res, e, "success", true);

                        })
                    }
                    else
                        sendNotification(r.recipient, r.sender, paramsReceived.message, paramsReceived.relation, function (err, result) {
                            respond(res, err, "success", true);
                        })
                });
            });

        }
    }
};

module.exports = func;