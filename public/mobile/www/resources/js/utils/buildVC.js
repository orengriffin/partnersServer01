/**
 * Created by oren on 1/4/2015.
 */



function addToVport(rootElement, childElement) {
    var childBuilt = childElement.build();
    rootElement.append(childBuilt.element);
    window[childBuilt.controller].init();
    window[childBuilt.controller].initialize();
}

function createView(props) {
    var obj = Object.create(viewBuilder);
    for (var prop in props)
        obj[prop] = props[prop];

    return obj;
}
function createControler(props) {
    var obj = Object.create(controllerBuilder);
    for (var prop in props)
        obj[prop] = props[prop];

    return obj;
}
var controllerBuilder = {
    init: function () {
        // init the refs
        for (var props in this.refs)
            this[props] = $(this.refs[props])

        // init control
        for (var props in this.control) {
            var element = this[props];
            for (var event in this.control[props]) {
                if (this.control[props][event].split(',')[1] == 'proxy')
                    element.bind(event, $.proxy(this[this.control[props][event].split(',')[0]], this));
                else
                    element.bind(event, this[this.control[props][event]]);
            }
        }
        if (this.initialize) this.initialize();
    },
    get : function () {
        return this
    }

};


var viewBuilder =
{

    build  : function (self, params, father) {
        if (!self) self = this;
        if (!!self.tag)
            var element = this._tag(self.tag);
        else element = father;
//            else return;
        if (!!this.controller) {
            var controller = this.controller;
        }
        for (var prop in self)
            if (prop != 'tag' &&
                prop != 'controller' &&
                prop != 'build' &&
                prop.slice(0, 1) != '_') {
                var str = (typeof self[prop] == 'string') ? self[prop].slice(0, 1) : '';
                if (str == '$') {
                    var param = self[prop].slice(1);
                    var x = params[param];
                }
                else    x = self[prop];
                element = this['_' + prop](x, element, params);
            }

        return {element: element, controller: controller};
    },
    _tag   : function (tagg) {
        return $('<' + tagg + '>');
    },
    _cls   : function (classs, element) {
        return element.addClass(classs);
    },
    _atr   : function (atr, element, params) {
        var newElement = undefined;
        var arguments = [];
        for (var i = 0; i < atr.length; i++) {
            for (var prop in atr[i]) {
                arguments.push(prop);
                var str = (typeof atr[i][prop] == 'string') ? atr[i][prop].slice(0, 1) : '';
                if (str == '$') {
                    var param = atr[i][prop].slice(1);
                    if (!!params[param])
                        var x = params[param];
                    else continue;
                }
                else    x = atr[i][prop];

                arguments.push(x);

            }
            newElement = element.attr(arguments[i * 2], arguments[i * 2 + 1]);
        }
        return newElement;
    },
    _items : function (child, father, params) {
        var self = this;
        child.forEach(function (value) {
            var children = self.build(value, params, father).element;
            father.append(children);
        });
        return father;
    },
    _bind : function (bindArr, element, params) {
        var newElement = undefined;
        var arguments = [];
        for (var i = 0; i < bindArr.length; i++) {
            for (var prop in bindArr[i]) {
                arguments.push(prop);
                var str = (typeof bindArr[i][prop] == 'string') ? bindArr[i][prop].slice(0, 1) : '';
                if (str == '$') {
                    var param = bindArr[i][prop].slice(1);
                    if (!!params[param])
                        var x = params[param];
                    else continue;
                }
                else    x = bindArr[i][prop];

                arguments.push(x);

            }
            newElement = element.bind(arguments[i * 2], arguments[i * 2 + 1]);
        }
        return newElement;
    },
    _html  : function (text, element) {
        return element.html(text);
    },
    _widget: function (widget, element) {
        return element.append(this.build(widgets[widget.widgetName], widget.params, element).element);
    },
    _load : function (func, element) {
        return element.load(func)
    }
};


function asyncParallel(funcArray, resultsFunc)
{
    var funcsDone = 0;
    var done = function (){
        funcsDone++;
        if (funcsDone == funcArray.length)
            resultsFunc();
    };

    for (var i = 0; i < funcArray.length; i++)
        setTimeout(function (index) {
            funcArray[index](done);
        },0,i);
}
