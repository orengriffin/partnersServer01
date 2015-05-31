/**
 * Created by admin on 12/3/2014.
 */

//  Only Relevant for Android

var sounds = {
    notification: undefined,
    partners    : undefined,

    init: function () {
        var path = window.location.pathname;
        path = path.substr( 0, path.length - 10 );
        this.notification = new Media(path + "new_message.wav");
        this.partners = new Media(path + "partners_2.wav");
    }
};