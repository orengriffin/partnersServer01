/**
 * Created by admin on 1/16/2015.
 */


var express = require('express');
var router = express.Router();
var db = require('./../mymongoose');
var utils = require('./../utils');
var async = require('async');

function respond(res, error, message, isString) {

    var response = {
        error  : error,
        code   : 0,
        message: message
    };
    res.send((isString) ? JSON.stringify(response) : response);
}


//
//                Auto-Complete
//

router.get('/search/', function (req, res) {
    console.log('auto-complete');

    var paramsReceived = req.query;
    var activitiesToReturn = [];
    db.activityModel.aggregate([
        {$match: {activity: {$regex: new RegExp('^' + paramsReceived.activity, 'i')}}},
        {
            $group: {
                _id: {parent: "$parent_activity"},
                act: {$push: {activity: "$activity", activity_id: '$activity_id'}}
                //parent: '$parent_activity'

            }
        },
        {$project: {act: 1, parent_activity: 1}},
        {$sort:{"_id.parent":1}}
    ])
        //.match({activity:})
        //.where('activity')
        //.regex(new RegExp('^' + paramsReceived.activity, 'i'))
        //.where('parent_activity').equals(0)
        //.select('activity activity_id created parent_activity')
        .limit(10)
        .exec(function (e, activities) {
            var arrOfAcvitivities = [], mainIndex = 0;
            if (mainIndex != 3)
                activities.some(function (activity, index) {
                    if (!index && !activity._id.parent)
                        activities[0].act.some(function (activity) {
                            arrOfAcvitivities.push(activity.activity_id);
                            if (arrOfAcvitivities.length == 3)
                                return true;
                        });
                    else
                    if (arrOfAcvitivities.length < 3) {
                        if (arrOfAcvitivities.indexOf(activity._id.parent) == -1)
                            arrOfAcvitivities.push(activity._id.parent);
                        if (arrOfAcvitivities.length == 3)
                            return true;
                    }

                }, activities);
            if (arrOfAcvitivities[0])
            {
                var arrToQuery = [];
                arrOfAcvitivities.forEach(function (activity) {
                    arrToQuery.push({activity_id:activity})
                });

                db.activityModel.find({$or: arrToQuery})
                    .select('activity activity_id created parent_activity')
                    .exec(function (e, activities) {

                        console.log(e);
                        respond(res, '', activities, true);
                });
            }
            else respond(res, '', [], true)

        });

});


router.get('/getPartners/', function (req, res) {
    console.log('search was called');

    var paramsReceived = req.query;

    async.parallel({
        maxActivityId: function (callback) {
            db.activityModel.findOne({})
                .select('activity_id')
                .sort('-activity_id')
                .exec(function (e, activity) {
                    callback(e, activity.activity_id + 1);
                });
        },

        me      : function (callback) {
            db.userModel.findById(paramsReceived.session)
                .select('location partners user activities blockedUsers')
                .exec(function (e, me) {
                    callback(e, me)
                });
        },
        activity: function (callback) {
            db.activityModel.where('activity')
                .regex(new RegExp('^' + paramsReceived.activity + '$', 'i'))
                .select('parent_activity_id')
                .populate('parent_activity_id', '_id created activity activity_id')
                .exec(function (e, activity) {
                    callback(e, activity[0])
                });
        }
    }, function (e, r) {
        if (r.activity) {

            r.me.activities.addToSet(r.activity.parent_activity_id._id);
            r.me.save(function (e) {
                console.log('added activity after search' + e);
            });

            var membersToReturn = [];

            var genderQuery = [
                {gender: 'female'},
                //{gender: 'unknown'},
                {gender: 'male'}
            ];
            if ((typeof paramsReceived['search_female']) != 'undefined' && !Number(paramsReceived['search_female']))
                genderQuery.shift();

            if ((typeof paramsReceived['search_male']) != 'undefined' && !Number(paramsReceived['search_male']))
                genderQuery.pop();

            var ageQuery = [
                {age: {$gt: (!!Number(paramsReceived['min_age'])) ? Number(paramsReceived['min_age']) : 17}},
                {age: {$lt: (!!Number(paramsReceived['max_age'])) ? Number(paramsReceived['max_age']) : 89}}
            ];

            var andQuery = [{$or: genderQuery},
                {$and: ageQuery}
            ];
            if (ageQuery[0].age['$gt'] == 17 && ageQuery[1].age['$lt'] == 89) {
                genderQuery.push({age: null});
                andQuery.pop();

            }

            console.log(genderQuery);
            console.log(ageQuery);
            console.log(andQuery);

            db.userModel.where('activities').elemMatch({$in: [r.activity.parent_activity_id._id]})
                .where('_id').ne(paramsReceived.session)
                .and(andQuery)
                //.find({location:{ $near :r.me.location, $maxDistance:3/111.12}})
                .where('location').near({center: r.me.location})//, maxDistance: 1/111.12})
                .limit(40)
                .exec(function (e, users) {
                    if (!!users[0])
                        users.forEach(function (user) {
                            var idToDell = null;
                            var isMembers = this.me.partners.some(function (partner) {
                                if (!!partner.partner_id.equals(user._id)) {
                                    idToDell = partner._id;
                                    return true;
                                }
                                else return false
                            });
                            if (idToDell)
                                this.me.partners.id(idToDell).remove();
                            membersToReturn.push({
                                user       : user.user,
                                image      : user.image,
                                first_name : user.first_name,
                                last_name  : user.last_name,
                                last_seen  : (user.isOnline) ? " " : utils.timeCalc(user.last_visit, 0),
                                location   : utils.distanceCalc(
                                    {lon: this.me.location[0], lat: this.me.location[1]},
                                    {longitude: user.location[0], latitude: user.location[1]}),// / 1000,
                                is_online  : (user.isOnline) ? 1 : 0,
                                is_partners: isMembers ? 1 : 0,
                                age        : (!!user.birthday) ? utils.ageCalc(user.birthday) : '',
                                isBlocked  : this.me.blockedUsers.indexOf(user.id) != -1

                            });

                            var str = user.last_name + ' ' + user.first_name + ' ' +
                                user.location[0] + ', ' + user.location[1] + ' age: ' + user.age + ' gender: ' + user.gender;
                            console.log(str);

                            if (membersToReturn.length == this.len) {
                                console.log('finish');
                                respond(res, e, {
                                    status : 0,
                                    data   : this.activity,
                                    members: membersToReturn
                                }, true);
                            }

                        }, {
                            len     : users.length,
                            activity: r.activity.parent_activity_id,
                            me      : r.me
                        });
                    else
                        respond(res, e, {
                            status : 0,
                            members: [],
                            data   : this.activity
                        }, true);
                })
        }
        else {
            var newActivity = db.activityModel({
                activity_id       : r.maxActivityId,
                activity          : paramsReceived.activity,
                parent_activity   : 0,
                created           : new Date(),
                icon              : null,
                parent_activity_id: null,
                hasChildren : false
            });
            newActivity.save(function (e, activity) {
                        var newUserActivity = db.userActivityModel({
                            user        : r.me.user,
                            user_id     : paramsReceived.session,
                            activity_id : r.maxActivityId,
                            activity_id_: activity._id

                        });
                        newUserActivity.save();
                        r.me.activities.addToSet(activity._id);
                        activity.parent_activity_id = activity._id;
                        activity.save();
                        r.me.save();
                        res.send(JSON.stringify({
                            code   : 0,
                            error  : "",
                            message: {
                                status: 2,
                                data  : {
                                    activity   : paramsReceived.activity,
                                    activity_id: activity._id
                                },
                                member: []
                            }
                        }));
            });

        }
    });

});

router.get('/searchActivities/', function (req, res) {
    var paramsReceived = req.query;
    var orQuery = [];

    if (paramsReceived.parentOnly != 'False')
        orQuery.push({parent_activity : 0});

    if (paramsReceived.hasChildren != 'False')
        orQuery.push({hasChildren : true});
    else
        orQuery.push({hasChildren : false});

    if (paramsReceived.searchStr)
        orQuery.push({$regex:new RegExp(paramsReceived.searchStr, 'i')});
    var skip = paramsReceived.searchNumber * 10;
    db.activityModel.find()
        .and(orQuery)
        .sort('-created')
        .skip(skip)
        .limit (skip + 10)
        .exec(function (e, activities) {
            res.json(activities);
        })
} );


module.exports = router;