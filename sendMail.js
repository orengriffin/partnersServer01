/**
 * Created by orengriffin on 3/2/15.
 */
//var emailTemplates = require('swig-email-templates');
//var path = require('path');
//var juice = require('juice');
var swig = require("swig");

var sendMailFunctions = {
    sendGridKeys: {
        password: process.env.SENDGRID_PASSWORD,
        username: process.env.SENDGRID_USERNAME
    },

    db      : null,
    sendGrid: null,
    template: null,
    css     : null,

    setTemplate: function (str) {
        this.template = str;
    },
    setCss     : function (str) {
        this.css = str;
    },

    init: function () {
        var q = this;
        q.sendGrid = require("sendgrid")(q.sendGridKeys.username, q.sendGridKeys.password);
        q.db = require('./mymongoose');
        q.template = swig.compileFile('boughtTemplate.html');
    },

    setKeys: function (p, u) {
        this.sendGridKeys.password = p;
        this.sendGridKeys.username = u;
    },

    validEmailAddress: function (email) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    },


    send: function (sender, recipient, message, relation) {
        //var week = 604800000;
        var week = -1;
        var self = this;
        return;
        var lastMailDate = (recipient.lastMailDate) ? recipient.lastMailDate.getTime() : 0;
        if ((recipient.email_notification) &&
            (Date.now() - lastMailDate > week) &&
            (Date.now() - recipient.last_visit.getTime() > week) &&
            (this.validEmailAddress(recipient.email))) {

            var email = new this.sendGrid.Email({
                to      : recipient.email,
                fromname: 'Partners App,',
                from    : 'info@partners-app.com',
                subject : 'You have a message waiting from ' + sender.first_name,
                html    : this.template({
                    name       : sender.first_name,
                    date       : dateStr(),
                    image      : sender.image,
                    message    : message,
                    unsubscribe: 'http://84.109.234.163:3010/user/unsubscribe?type=viaEmail&session=' + recipient._id + '&status=0&fromMail=true',
                    relation   : relation
                })
            });
            this.sendGrid.send(email, function (err, json) {
                console.log(err);
            });
            this.db.userModel.findByIdAndUpdate(recipient._id,
                {lastMailDate: Date.now()},
                function (e, user) {
                    console.log('lastMaildate');
                })

        }

        console.log(recipient.last_visit.getTime());
    }
};

function dateStr() {
    var d = new Date();
    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "June",
        "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
    return d.getDate() + ' ' + monthNames[d.getMonth()] + ', ' + (1900 + d.getYear());
}

module.exports = sendMailFunctions;
