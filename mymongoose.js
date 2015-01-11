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

            var userSchema = new Schema({
                user              : Number,
                fb_uid            : Number,
                first_name        : String,
                last_name         : String,
                locale            : String,
                image             : String,
                birthday          : Number,
                gender            : String,
                email             : String,
                last_visit        : String,
                created           : String,
                location          : {type: [Number], index: '2dsphere'},
                udid              : String,
                session           : String,
                notify_partner    : Boolean,
                email_notification: Boolean,
                platform          : String,
                last_update       : String,
                activities        : [{type: Schema.Types.ObjectId, ref: 'activitie'}],
                partners          : [
                    {
                        partner_id        : {type: Schema.Types.ObjectId, ref: 'user'},
                        activity_relation: {type: Schema.Types.ObjectId, ref: 'activitie'},
                        created           : Date

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
                relation_id:  {type: Schema.Types.ObjectId, ref: 'activitie'},
                relation   : String,
                created    : String
            });

            this.partnersModel = mongoose.model('partner', partnersSchema);

            //this.UserFacebookFriendsModel = mongoose.model('facebookFriend', this.userFacebookFriendsSchema);
            console.log('sucess!');
        }
    }
    ;

module.exports = func;