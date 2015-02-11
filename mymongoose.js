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

    wasInit : false,

    init: function (mongoose) {

        var Schema = mongoose.Schema;


        var oldUserSchema = new Schema({
            user               : Number,
            fb_uid             : String,
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
            isBlocked   : Boolean,
            isRead      : Boolean,
            timeStamp   : Date,
            time        : String
        });

        this.messageModel = mongoose.model('message', messageSchema);

        var userSchema = new Schema({
            user              : Number,
            fb_uid            : String,
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
                partner_id: {type: Schema.Types.ObjectId, ref: 'user'},
                relation  : String
            }],
            blockedUsers      : [{type: Schema.Types.ObjectId, ref: 'user'}],
            isOnline          : {type: Boolean, default: false},
            newVersion        : {type: Boolean, default: false},
            activities        : [{type: Schema.Types.ObjectId, ref: 'activitie'}],
            partners          : [
                {
                    partner_id       : {type: Schema.Types.ObjectId, ref: 'user'},
                    partner_num      : Number,
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
            created           : Date,
            hasChildren       : Boolean
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


        var settingsSchema = new Schema({
            id         : Number,
            param_name : String,
            param_value: String
        });

        this.settingsModel = mongoose.model('setting', settingsSchema);

        this.partnersModel = mongoose.model('partner', partnersSchema);

        this.wasInit = true;
        console.log('sucess!');
        pub.init();
    },


    updateLastSeen: function (id, time) {
        this.userModel.findByIdAndUpdate(id,
            {last_visit: new Date(Number(time))},
            function (e, user) {
                console.log()
            })

    }
};

module.exports = func;