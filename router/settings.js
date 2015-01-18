/**
 * Created by admin on 1/18/2015.
 */
var express = require('express');
var router = express.Router();
var db = require('./../mymongoose');
var async = require('async');


function respond(res, error, message, isString) {
    var response = {
        error  : error,
        code   : 0,
        message: message
    };
    res.send((isString) ? JSON.stringify(response) : response);
}


router.get('/', function (req, res) {
    console.log ('settings was called.');
    async.parallel({
            featured       : function (callback) {
                db.settingsModel.findOne({param_name: 'featured_activities'})
                    .exec(function (e, featuredActivities) {
                        var arrToReturn = [];
                        featuredActivities = JSON.parse(featuredActivities.param_value);
                        featuredActivities.forEach(function (activity) {
                            var leng = this.length;
                            db.activityModel.findOne({activity_id: activity})
                                .select('activity_id parent_activity activity created')
                                .exec(function (e, foundActivity) {
                                    arrToReturn.push(foundActivity._doc);
                                    delete arrToReturn[arrToReturn.length - 1]._id;
                                    if (arrToReturn.length == leng)
                                        callback(null, arrToReturn);
                                });
                        }, featuredActivities);
                    })
            },
            custom_messages: function (callback) {
                db.settingsModel.find({})
                    .or([
                        {param_name: 'whatsapp_message'},
                        {param_name: 'facebook_message'},
                        {param_name: 'first_search'}
                    ])
                    .exec(function (e, customMessages) {
                        var objToReturn = {};

                        customMessages.forEach(function (customMessage, index) {
                            objToReturn[customMessage.param_name] = customMessage.param_value;
                            if (index == 2)
                                callback(null, objToReturn)
                        }, customMessages);
                    })
            },
            link           : function (callback) {
                db.settingsModel.where('param_name')
                    .regex(new RegExp('link', 'i'))
                    .exec(function (e, links) {
                        var objToReturn = {};
                        links.forEach(function (link, index) {
                            objToReturn[link.param_name] = link.param_value;
                            if (index == 1)
                                callback(null, objToReturn)
                        }, links);
                    })

            },
        search_base_settings: function (callback) {
            db.settingsModel.findOne({param_name:'search_base_settings'})
                .exec(function (e, searchBaseSettings) {
                   callback(null,JSON.parse(searchBaseSettings.param_value))
                });
        }


        },function (e, r) {
            respond(res,e,{
                links: r.link,
                custom_messages: r.custom_messages,
                search_base_settings: r.search_base_settings,
                featured: r.featured,
                chat_port:8080,
                chat_server:"192.168.20.10",
                location_service_array: "Please Open Settings > Privacy > Location Services",
                server_time: new Date().getTime() / 1000,
                timezone: 'utc'

            },false)
        });
});
/*
    db.settingsModel.find({})
        .exec(function (e, settings) {
            console.log(settings[0]);
        });
*/


module.exports = router;
