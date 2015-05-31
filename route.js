/**
 * Created by admin on 4/26/2015.
 */
module.exports = {
    route: function (app, arr ) {
        arr.forEach(function (routePath) {
            if (Array.isArray( routePath))
                app.use('/' + routePath[0]  + '/', require('./router/' + routePath[1]) );
            else
                app.use('/' + routePath  + '/', require('./router/' + routePath) );
        })
    }
};