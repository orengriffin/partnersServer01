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
    console.log('3' + date);
    var oldDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    var hour = date.getHours() + ':';
    hour += (date.getMinutes() > 10) ? date.getMinutes() : ('0' + date.getMinutes());
    hour += ':';
    hour += (date.getSeconds() > 10) ? date.getSeconds() : ('0' + date.getSeconds());
    var strRtn = (oldDate + ' ' + hour);
    console.log('4' + strRtn);
    return strRtn;

}

function sendNotification(recipient, sender, message, relation, callback, badge) {
    if (!recipient.udid)
    {
        console.log ('Notification not sent (no uuid). user :' + recipient.user);
        if (callback) callback()
        return;
    }

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
        note.badge = badge;
        note.sound = "default";
        //note.message = (relation) ? relation : 'unknown';
        //note.title = (relation) ? relation : 'unknown';
        /*
         note.sender = sender;
         */
        note.alert = {
            'title': (relation) ? '#' + relation : 'unknown',
            'body' : sender.first_name + ' ' + sender.last_name + ': ' + message
            //'loc-key':'UTF-8'
        };
        note.payload = {
            creation: parseInt(new Date().getTime() / 1000),
            'title' : (relation) ? '#' + relation : 'unknown',
            message : message,
            sender  : sender.user
        };

        apnConnection.pushNotification(note, myDevice);
        if (callback) callback();

        //apn.Connection({}).pushNotification(new apn.Notification(), new apn.Device(recipient.udid) );
        console.log('ios');
    }

}
var func = {
    db  : null,
    pub : null,
    sendMail : null,

    init: function () {
        this.db = require('./mymongoose');
        this.pub = require('./pub');
        this.sendMail = require('./sendMail');
    },

    tellPartnersNewDistance: function (id, lat, lon) {
        var localPub = this.pub;
        var self = this;
        async.parallel({
            me      : function (callback) {
                self.db.userModel.findById(id)
                    .select('user fbuid location')
                    .exec(function (e, user) {
                        callback(e, user);
                    })
            },
            partners: function (callback) {
                self.db.userModel.find()
                    .select('partners newVersion isOnline fb_uid first_name channel')
                    .where('isOnline').equals(true)
                    .where('partners').ne([])
                    .where('partners.partner_id').equals(id)
                    .where('newVersion').equals(true)
                    .exec(function (e, partners) {
                    });
            }
        }, function (e, r) {
            r.partners.forEach(function (partner) {
                localPub.sendMsg(partner.channel, {
                    distance: self.distanceCalc({
                            lat: Number(lat),
                            lon: Number(lon)
                        },
                        {
                            latitude : this.location[0],
                            longitude: this.location[1]
                        }),
                    user    : this.user,
                    fbid    : this.fb_uid
                })
            }, r.me)

        });

    },

    tellPartnersOnlineStatus: function (id, isOnline) {
        var localPub = this.pub;
        var self = this;
        async.parallel({
            me      : function (callback) {
                self.db.userModel.findById(id)
                    .select('user id fb_uid')
                    .exec(function (e, user) {
                        callback(e, user);
                    })
            },
            partners: function (callback) {
                self.db.userModel.find()
                    .where('isOnline').equals(true)
                    .where('partners').ne([])
                    .select('partners newVersion fb_uid first_name isOnline channel')
                    .where('partners.partner_id').equals(id)
                    .where('newVersion').equals(true)
                    .exec(function (e, users) {
                        callback(e, users);
                    });
            }
        }, function (e, r) {
            r.partners.forEach(function (partner) {
                //if (partner.isOnline && partner.newVersion)
                localPub.sendMsg(partner.channel, {
                    online: isOnline,
                    fbid  : this.fb_uid,
                    user  : this.user
                })
            }, r.me)

        });
    },

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
        if (typeof lat2 == 'undefined')
            console.log('error');
        var φ1 = lat1.toRad();
        var φ2 = lat2.toRad();
        var Δφ = (lat2 - lat1).toRad();
        var Δλ = (lon2 - lon1).toRad();

        var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        var d = R * c * 1000;

        return parseInt(d) / 1000
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
            {n: 60, s: 'minutes'},
            {n: 60, s: 'hours'},
            {n: 24, s: 'days'},
            {n: 31, s: 'months'},
            {n: 12, s: 'years'},
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
            return  this.theToken;
        },
        set      : function (tokenParam) {
            this.theToken = tokenParam;
        }

    },

    returnAgeGenderQuery: function (params) {
        var genderQuery = [
            {gender: 'female'},
            //{gender: 'unknown'},
            {gender: 'male'}
        ];
        if ((typeof params['search_female']) != 'undefined' && !Number(params['search_female']))
            genderQuery.shift();

        if ((typeof params['search_male']) != 'undefined' && !Number(params['search_male']))
            genderQuery.pop();

        var ageQuery = [
            {age: {$gt: (!!Number(params['min_age'])) ? Number(params['min_age']) : 17}},
            {age: {$lt: (!!Number(params['max_age'])) ? Number(params['max_age']) : 89}}
        ];

        var andQuery = [{$or: genderQuery},
            {$and: ageQuery}
        ];

        if (ageQuery[0].age['$gt'] == 17 && ageQuery[1].age['$lt'] == 89)
            andQuery.pop();

        return andQuery;
    },

    returnSearchedMember: function (me, user, searchedActivity) {

        var isMembers = me.partners.some(function (partner) {
            if (!!partner.partner_id.equals(user._id)) {
                //idToDell = partner._id;
                return true;
            }
            else return false
        });
        return {
            user            : user.user,
            image           : user.image,
            first_name      : user.first_name,
            last_name       : user.last_name,
            last_seen  : (user.isOnline) ? " " : this.timeCalc(user.last_visit, 0),
            location        : this.distanceCalc(
                {lon: me.location[0], lat: me.location[1]},
                {longitude: user.location[0], latitude: user.location[1]}),// / 1000,
            is_online       : (user.isOnline) ? 1 : 0,
            is_partners: isMembers ? 1 : 0,
            age             : (!!user.birthday) ? this.ageCalc(user.birthday) : '',
            isBlocked       : me.blockedUsers.indexOf(user.id) != -1,
            sharedActivities: this.getSharedActivities(me, user, searchedActivity)
        }
    },

    getSharedActivities: function (me, user, searchedActivity) {
        var activitiesToReturn = [];
        var userActivities = user.activities;
        me.activities.forEach(function (activityId, index) {
            userActivities.some(function (userActivity) {
                if (activityId.equals(userActivity.id)) {
                    if (searchedActivity != userActivity.activity )
                        activitiesToReturn.push(userActivity.activity);
                    return true;
                }
            });
        }, me.activities);
        return (activitiesToReturn[0]) ? activitiesToReturn : ''
    },

    sendMessage: function (paramsReceived, res, notToSave) {
        {
            var self = this;
            async.parallel({
                activityId: function (callback) {
                    if (paramsReceived.relation)
                        self.db.activityModel.findOne({activity: paramsReceived.relation})
                            .select('parent_activity_id')
                            .exec(function (e, activity) {
                                callback(e, activity.parent_activity_id)
                            });
                    else
                        callback(null, false);
                },
                recipient : function (callback) {
                    self.db.userModel.findOne({user: paramsReceived.user_id})
                        //.select('platform newVersion isOnline udid _id first_name user partners blockedUsers newVersion last_visit email email_notification')
                        .exec(function (e, recipient) {
                            callback(e, recipient);
                        });
                },
                sender    : function (callback) {
                    self.db.userModel.findById(paramsReceived.session)
                        .select('user _id relations first_name last_name partners image')
                        .exec(function (e, sender) {
                            callback(e, sender);
                        });

                }

            }, function (e, r) {

                var isBLocked = (r.recipient.blockedUsers) ? (r.recipient.blockedUsers.indexOf(r.sender._id) != -1) : false;
                console.log('newVersion-1 ' + r.recipient.newVersion);
                console.log('param01 ' + paramsReceived.cb);
                console.log('param02 ' + new Date(Number(paramsReceived.cb)));
                var rightDate = new Date(Number(paramsReceived.cb));
                console.log('033 ' + rightDate.getTimezoneOffset());
                rightDate = rightDate.getTime() + rightDate.getTimezoneOffset() * 60000;
                var newMessage = self.db.messageModel({
                    sender      : r.sender.user,
                    sender_id   : r.sender._id,
                    recipient   : r.recipient.user,
                    recipient_id: r.recipient._id,
                    message     : paramsReceived.message,
                    isRead      : false,
                    isBlocked   : isBLocked,
                    timeStamp   : Date.now(),
                    time        : (r.recipient.newVersion) ? oldTime(new Date(Number(rightDate))) : oldTime(new Date(Number(rightDate - 7200000)))
                });
                // adding each other to thiere partners array
                ['recipient', 'sender'].forEach(function (user, index) {
                    var self = this;
                    var test = !(r[user].partners.some(function (partner) {
                        if (!!partner.partner_id.equals(r[self[(index) ? 0 : 1]]._id)) {
                            if (r.activityId)
                                partner.activity_relation = r.activityId;
                            return true
                        }
                        return false
                    }));
                    console.log(test);
                    if (test)
                        r[user].partners.addToSet({
                            partner_id       : r[self[(index) ? 0 : 1]]._id,
                            activity_relation: r.activityId,
                            partner_num      : r[self[(index) ? 0 : 1]].user
                        });
                    r[user].save(function (e) {
                        console.log(e);
                    });

                }, ['recipient', 'sender']);

                async.parallel({
                    isSaved           : function (callback) {
                        if (notToSave)
                            callback(null, true);
                        else
                            newMessage.save(function (e, message) {
                                console.log('message save: ' + !e);
                                callback(e, {
                                    isSaved: !e,
                                    message: message
                                });
                            });
                    },
                    isRecipeientOnline: function (parallelCallback) {
                        if (r.recipient.newVersion)

                        self.pub.hereNow(r.recipient.channel, function (isOnline) {
                            if (r.recipient.isOnline != isOnline) {
                                console.log('good thing i used here now');
                                self.db.userModel.update({_id: r.recipient._id}, {isOnline: isOnline});
                            }
                            else console.log('here now shouldnt have been used');
                            parallelCallback(null, isOnline);
                        });
                        else
                            parallelCallback(null, r.recipient.isOnline)

                    }
                }, function (e, secondResults) {
                    if (secondResults.isSaved.isSaved) {
                        self.sendMail.send(r.sender._doc, r.recipient._doc, paramsReceived.message, paramsReceived.relation);
                        if (r.recipient.newVersion) {

                            if (r.recipient.platform.toLocaleLowerCase() == 'android') {
                                if (secondResults.isRecipeientOnline) {
                                    console.log('sendPubNub');
                                    self.pub.sendMsg(r.recipient.channel, msgObj(paramsReceived.message, r.sender.user, paramsReceived.relation, r.sender, true), function (e) {
                                        respond(res, e, "success", true);

                                    });
                                    setTimeout(function () {
                                        sendNotification(r.recipient, r.sender, paramsReceived.message, paramsReceived.relation, function (err, result) {
                                            //respond(res, err, "success", true);
                                        })

                                    }, 0);
                                }
                                else
                                    sendNotification(r.recipient, r.sender, paramsReceived.message, paramsReceived.relation, function (err, result) {
                                        respond(res, err, "success", true);
                                    })
                            }
                            else // if IOS
                            {
                                console.log('trying sendPubNub');
                                self.pub.sendMsg(r.recipient.channel, msgObj(paramsReceived.message, r.sender.user, paramsReceived.relation, r.sender, true), function (e) {
                                    setTimeout(function () {
                                        async.parallel({
                                                badge  : function (callback) {
                                                    self.db.messageModel.where('recipient_id').equals(r.recipient.id)
                                                        .where('isRead').equals(false)
                                                        .where('isBlocked').equals(false)
                                                        .count(function (err, count) {
                                                            callback(err, count);
                                                        });
                                                },
                                                message: function (callback) {
                                                    self.db.messageModel.findById(secondResults.isSaved.message.id)
                                                        .exec(function (e, mesasgeFound) {
                                                            callback(e, !mesasgeFound.isRead);
                                                        })

                                                }
                                            }, function (e, iosResults) {
                                                if (iosResults.message)
                                                    sendNotification(r.recipient, r.sender, paramsReceived.message, paramsReceived.relation, null, iosResults.badge)
                                            }
                                        )
                                    }, 0);
                                    respond(res, e, "success", true);

                                });

                            }
                        }
                        else
                            sendNotification(r.recipient, r.sender, paramsReceived.message, paramsReceived.relation, function (err, result) {
                                respond(res, err, "success", true);
                            })

                    }
                    else
                        respond(res, err, "error", true);

                });
            });

        }
    }
};

module.exports = func;