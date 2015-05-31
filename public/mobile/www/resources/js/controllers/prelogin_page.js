/* PreLogin Page */
var PerLogin = (function () {

    var _classes = {
        home  : 'page-landing',
        signin: 'signin-page',
        search: 'main-page',
        chat  : 'chat-page'
    };

    /**
     * Returning Signin Page
     * @param {string} page_name
     */
    function appendFacebookLogin() {
        var margTop = ';';
        if (!isIos())
            margTop = '20px;';
        var page = createView({
            tag       : 'div',
            cls       : 'facebook-wrapper',
            controller: 'PerLogin.PerLoginController',
            atr       : [{style: 'display: none;'}],
            items     : [
                {
                    tag  : 'div',
                    cls  : 'image-collage',
                    items: [
                        {
                            tag: 'img',
                            atr: [{src: webURL + 'resources/images/login1.jpg'}]
                        }
                    ]
                },
                {
                    tag  : 'div',
                    cls  : 'bottom',
                    items: [
                        {
                            tag: 'div',
                            atr:[{style:"-webkit-flex:1"}]
                        },
                        {
                            tag  : 'figure',
                            items: [
                                {
                                    tag: 'img',
                                    atr: [{src: webURL + 'resources/images/signin_logo.png'}]
                                }
                            ]
                        },
                        {
                            tag  : 'button',
                            atr : [{style:'margin-top:'+margTop}],
                            items: [
                                {
                                    tag  : 'div',
                                    cls  : 'facebook-icon',
                                    items: [
                                        {
                                            tag: 'div',
                                            cls: 'icon-facebook2'
                                            //atr: [{src: 'resources/images/facebook-icon.png'}]
                                        }
                                    ]
                                },
                                {
                                    tag : 'span',
                                    html: 'Login Using Facebook'
                                }
                            ]
                        },
                        {
                            tag  : 'div',
                            cls  : 'note',
                            html : 'We Would NEVER Post on Your Behalf!',
                            items: [
                                {
                                    tag  : 'span',
                                    html : 'By logging in you agree to the ',
                                    items: [
                                        {
                                            tag : 'span',
                                            atr : [{style: 'text-decoration: underline;display: inline; font-size: 1em;'}],
                                            html: 'terms and privacy policy'
                                        }
                                    ]
                                }
                            ]
                        }

                    ]
                }

            ]
        });
        page = page.build();
        coolLoad(false);
        $('.root-wrapper').append(page.element);
        window[page.controller.split('.')[0]][page.controller.split('.')[1]]();
    }


    var controller = null;

    function getController() {
        return controller;
    }

    function PerLoginController() {

        controller = createControler({

            refs: {
                button      : '.facebook-wrapper button',
                imageCollage: '.facebook-wrapper .image-collage',
                note        : '.facebook-wrapper .note',
                mainWrapper : '.facebook-wrapper',
                bottom      : '.facebook-wrapper .bottom'

            },

            control: {
                button: {
                    tap: 'onButtonTapped'
                },
                note  : {
                    tap: 'onNoteTapped'
                }
            },

            initialize: function () {

                this.bottom.height(window.innerHeight - window.innerWidth);
                this.mainWrapper.velocity({translateY: ['']})
                    .velocity("transition.slideUpIn");
            },

            onNoteTapped: function (e) {
                e.preventDefault();
                SettingsPage.onTerms(e);
            },

            onButtonTapped: function (e) {

                e.preventDefault();
                /* Facebook Login */
                fbController.login(function (response) {
                    /* Exec Login Success */
                    return angular.element($('.app')).scope().loginSuccess(response);

                }, function (response) {
                    /* Exec Login Failed */
                    return angular.element($('.app')).scope().loginFailed(response);
                });
            }
        });
        return controller.init();

    }

    function showTerms(event) {
        event.preventDefault();

        SettingsPage.onTerms(event);
    }

    return {

        showTerms          : showTerms,
        appendFacebookLogin: appendFacebookLogin,
        PerLoginController : PerLoginController,
        controller         : getController
    };
})();
