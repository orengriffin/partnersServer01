var pub = require('./pub');


var func = {
    UserFacebookFriendsModel: undefined,

    oldUserModel: undefined,
    userModel   : undefined,

    oldActivityModel: undefined,
    ActivityModel   : undefined,

    oldUserActivityModel: undefined,
    userActivityModel   : undefined,

    oldPartnersModel: undefined,
    partnersModel   : undefined,

    settingsModel: undefined,
    relationModel: undefined,
    messageModel : null,
    pub          : null,

    init: function (mongoose) {

        var Schema = mongoose.Schema;

        /*
         this.userFacebookFriendsSchema = new Schema({
         id     : String,
         friends: [{
         id  : String,
         name: String
         }]
         });
         */

        var oldUserSchema = new Schema({
            user               : Number,
            fb_uid             : Number,
            first_name         : String,
            last_name          : String,
            locale             : String,
            image              : String,
            birthday           : Number,
            gender             : String,
            email              : String,
            last_visit         : String,
            created            : String,
            location_longtitude: Number,
            location_latitude  : Number,
            udid               : String,
            session            : String,
            notify_partner     : Boolean,
            email_notification : Boolean,
            platform           : String,
            last_update        : String
        });

        this.oldUserModel = mongoose.model('olduser', oldUserSchema);

        var messageSchema = new Schema({
            sender      : Number,
            sender_id   : {type: Schema.Types.ObjectId, ref: 'user'},
            recipient   : Number,
            recipient_id: {type: Schema.Types.ObjectId, ref: 'user'},
            message     : String,
            isRead      : Boolean,
            timeStamp   : Date,
            time        : String
        });

        this.messageModel = mongoose.model('message', messageSchema);

        var userSchema = new Schema({
            user              : Number,
            fb_uid            : Number,
            first_name        : String,
            last_name         : String,
            locale            : String,
            image             : String,
            birthday          : Date,
            gender            : String,
            email             : String,
            last_visit        : Date,
            created           : Date,
            location          : {type: [Number], index: '2dsphere'},
            udid              : String,
            session           : String,
            notify_partner    : Boolean,
            email_notification: Boolean,
            platform          : String,
            last_update       : String,
            age               : Number,
            relations         : [{
                partner_id       : {type: Schema.Types.ObjectId, ref: 'user'},
                relation: String
            }],
            isOnline          : {type: Boolean, default: false},
            newVersion        : {type: Boolean, default: false},
            activities        : [{type: Schema.Types.ObjectId, ref: 'activitie'}],
            partners          : [
                {
                    partner_id       : {type: Schema.Types.ObjectId, ref: 'user'},
                    activity_relation: {type: Schema.Types.ObjectId, ref: 'activitie'},
                    created          : Date

                }]
        });
        //userSchema.index({location:'2dsphere'});
        this.userModel = mongoose.model('user', userSchema);


        var oldActivitySchema = new Schema({
            activity_id    : Number,
            parent_activity: Number,
            icon           : String,
            created        : String,
            activity       : String
        });
        this.oldActivityModel = mongoose.model('oldActivitie', oldActivitySchema);

        var activitySchema = new Schema({
            activity_id       : Number,
            parent_activity   : Number,
            parent_activity_id: {type: Schema.Types.ObjectId, ref: 'activitie'},
            activity          : String,
            icon              : String,
            created           : Date
        });
        this.activityModel = mongoose.model('activitie', activitySchema);

        var oldUserActivitySchema = new Schema({
            user       : Number,
            activity_id: Number
        });
        this.oldUserActivityModel = mongoose.model('oldUsersActivitie', oldUserActivitySchema);

        var userActivitySchema = new Schema({
            user_id     : {type: Schema.Types.ObjectId, ref: 'user'},
            user        : Number,
            activity_id_: {type: Schema.Types.ObjectId, ref: 'activitie'},
            activity_id : Number
        });
        this.userActivityModel = mongoose.model('userActivitie', userActivitySchema);

        var oldPartnersSchema = new Schema({
            id        : Number,
            user      : Number,
            partner_id: Number,
            relation  : String,
            created   : String
        });

        this.oldPartnersModel = mongoose.model('oldpartner', oldPartnersSchema);

        var partnersSchema = new Schema({
            user       : Number,
            partner_id : Number,
            partner_id_: {type: Schema.Types.ObjectId, ref: 'user'},
            relation_id: {type: Schema.Types.ObjectId, ref: 'activitie'},
            relation   : String,
            created    : String
        });

        /*
         var oldSettingsSchema = new Schema({
         featured_activities : String,
         pre_login_details   : String,
         search_base_settings: String,
         new_partners_message: String,
         whatsapp_message    : String,
         facebook_message    : String,
         first_search        : String,
         appstore_link       : String,
         play_link           : String
         });
         */

        var settingsSchema = new Schema({
            id         : Number,
            param_name : String,
            param_value: String
        });

        this.settingsModel = mongoose.model('setting', settingsSchema);

        /*       var relationsSchema = new Schema({
         id      : Number,
         userIdA : {type: Schema.Types.ObjectId, ref: 'user'},
         userIdB : {type: Schema.Types.ObjectId, ref: 'user'},
         activity: String
         });

         this.relationModel = mongoose.model('relation', relationsSchema);
         */
        this.partnersModel = mongoose.model('partner', partnersSchema);

        //this.UserFacebookFriendsModel = mongoose.model('facebookFriend', this.userFacebookFriendsSchema);

        console.log('sucess!');
        pub.init();
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
    updateLastSeend : function (id, time) {
        this.userModel.findByIdAndUpdate(id,
            {last_visit:new Date(time)},
            function (e, user) {
                console.log()
            })

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
    ageCalc     : function (birthday) {
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
            if (then / timeObj[i + 1].n < 1)
                return parseInt(then) + ' ' + timeObj[i].s + ' ago';
        }

    }
};

module.exports = func;