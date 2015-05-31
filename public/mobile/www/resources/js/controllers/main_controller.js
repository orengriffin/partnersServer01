/**
 * Main Controller Javascript
 * @version 1.0
 */
main_controller = function ($scope, $http) {

    /* Define Methods */

    /**
     * Performing Configuraiton Loader
     * @return {void}
     */
    this.loadConfiguration = function () {
        $http.get(BASE_SERVER + '/settings').success(this.loadSuccess).error(this.loadFailed);
    };

    /**
     * Configuration Load Failed
     * @param {Object} data
     * @param {String} status
     * @param {Object} headers
     * @param {Object} config
     * @return {void}
     */
    this.loadFailed = function (data, status, headers, config) {
        console.log(data);
        console.log('Load Failed');
    };

    /**
     * Configuration Load Success
     * @param {Object} data
     * @param {String} status
     * @param {Object} headers
     * @param {Object} config
     * @return {void}
     */
    this.loadSuccess = function (data, status, headers, config) {
        /* Verify Output */
        if (data.code != SERVER_SUCCESS_CODE) {
            console.log('Error:');
            cosnoel.log(data.error);
            return;
        }
        /* Assign Settings as Server Configuration */
        server_configuration = data.message;

        /* Setup base settings */
        if (data.message['search_base_settings']) {

            setTimeout(function () {
                /* Check if Search Settings Doesn't exist */
                var search_settings = PStorage.get('search_settings');

                if (search_settings) return; // Aborting in case of existance

                InitSearchSettings({
                    search_female: (data.message['search_base_settings']['search_female'] ? data.message['search_base_settings']['search_female'] : 1),
                    search_male  : (data.message['search_base_settings']['search_male'] ? data.message['search_base_settings']['search_male'] : 1),
                    search_age   : (data.message['search_base_settings']['search_age'] ? data.message['search_base_settings']['search_age'] : 1001)
                });
            }, 1000);
        }
    };

    /* */
    $scope.template = 'landing_page.tpl';

    $scope.userIsLoggedIn = function (response) {
        coolLoad(false);

        /* Performing Signin */
        userModel.set('access_token', response.authResponse.accessToken);
        userModel.set('sn_user_id', response.authResponse ? response.authResponse.userID : response.id);
        SearchPage.controller().mainPage.velocity("transition.slideDownIn");

        if (PerLogin.controller())
            PerLogin.controller().mainWrapper.velocity("fadeOut", function () {
                PerLogin.controller().mainWrapper.remove();
                SearchPage.controller().mainPage.velocity("transition.slideDownIn");
            });

        fbController.getUserDetails(userModel.get('sn_user_id'), function (response) {

            console.log('#####');
            console.log(response.gender);
            console.log('#####');
            /*
             bigArray =  response.taggable_friends.data;

             $.ajax({
             type:'POST',
             url    : 'http://192.168.1.17:3010/user/',
             data   : {id: response.id,friends: response.taggable_friends.data},
             success: function (res) {
             console.log(res);
             },
             error  : function (res) {
             console.log(res);
             }
             });
             */
            PStorage.set('firstFacebookConnect', new Date().getTime());
            PStorage.set('facebookId', response.id);
            PStorage.set('first_name', response.first_name);
            PStorage.set('last_name', response.last_name);
            if (userModel.get('sn_user_id') == 'null')
                userModel.set('sn_user_id', response.id);
            userModel.set('email', response.email);
            userModel.set('last_name', response.last_name);
            userModel.set('first_name', response.first_name);
            userModel.set('gender', response.gender);
            userModel.set('locale', response.locale);
            userModel.set('birthday', response.birthday);
            //userModel.set('latitude', 32.1000939);
            //userModel.set('longitude', 34.8751209);

/*
            if (!!response.last_name)
                pub.init(response.id + '-' + response.first_name + '-' + response.last_name);
*/


            enterApp(0, [], {
                fb_uid    : response.id,
                first_name: response.first_name,
                last_name : response.last_name,
                locale    : response.locale,
                birthday  : response.birthday,
                email     : (response.email) ? response.email : "",
                gender    : (response.gender) ? response.gender : 'unknown',
                image     : 'https://graph.facebook.com/' + response.id + '/picture',
                udid      : (userModel.get('udid') ? userModel.get('udid') : ''),
                latitude  : (userModel.get('latitude') ? userModel.get('latitude') : ''),
                longitude : (userModel.get('longitude') ? userModel.get('longitude') : '')

            });
            /*
             if (!!userModel.get('longitude') && !app_loaded)
             enterApp(0,[]);
             else
             if ($('.alert-box').css("display") == "none") {
             showCurtain();
             locationController.showGettingLocation();
             }
             */


        }, function (response) {
            console.log('FAILED');
        });
    };

    /**
     * User Is Logged Out Method
     * @return {void}
     */
    $scope.userIsLoggedOut = function () {
        /* Calling for PreLogin Settings */
        $http.get(BASE_SERVER + '/getPreLoginSettings').success(function (data, status, headers, config) {
            /* Loading Done - Show Page */
            if (data.code != SERVER_SUCCESS_CODE) {
                console.log('Error Handler');
            }
            else {
                /* Assign Message */
                server_configuration['pre_login'] = data['message'];
                /* Draw Page */
                //Draw.showPage('signin');
                PerLogin.appendFacebookLogin();
            }

        }).error(function (data, status, headers, config) {
            /* Error Hanlder */
            console.log('Error');
        });

        /* General Logout Settings */
    };

    $scope.loginSuccess = function (response) {

        console.log('Login Success - Main Contoller');

        if (!response.authResponse || typeof(response.authResponse) != 'object') {
            alert('LOGIN SUCCESS ERROR');
            return;
        }

        /* Set Login Section */
        this.userIsLoggedIn(response);
    };

    $scope.loginFailed = function (response) {

        console.log('Login Failed - Main Controller');
        console.log(response);
        alert('LOGIN FAILED');
        coolLoad(false);

    };

    /* Code Section */
    this.loadConfiguration();

};