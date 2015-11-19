/*
  Copyright 2015, Matthew Roe, under MIT license
*/


'use strict';


//Todo: do we want a Class module, or just the object/function suffices?

//Core function "Class"
sW.Class = function(){
    var __definition = null;
    var __className = null;
    var __inherits = null;
    if (arguments.length === 2){
        __className = arguments[0];
        __definition = arguments[1];
    } else if (arguments.length === 3){
        __className = arguments[0];
        __inherits = arguments[1];
        __definition = arguments[2];
    } else {
        throw new TypeError('Wrong number of arguments!');
    }

    var definition = new __definition();
    definition.__parents = [];
    definition.__className = __className;

    definition.__setExposed__ = function(prop, value){
        //set ours first, but track old value, then call watchers
        //this prevents recursion when binding
        var oldValue = this.__exposed__[prop];
        this.__exposed__[prop] = value;
        if (this.__watchers__ && this.__watchers__[prop]){
            for (var i=0; i<this.__watchers__[prop].length; i++){
                this.__watchers__[prop][i](value, oldValue);
            }
        }
    }
    definition.__getExposed__ = function(prop){
        return this.__exposed__[prop];
    }

    var isExposed = function(cls, variable){
        if (typeof cls.__exposed__ === 'undefined' || !cls.__exposed__.hasOwnProperty(variable)){
            throw new AttributeError('Can only watch variables that are exposed, "'+variable+'" is not');
        }
        return true;
    }

    var checkWatchValues = function(cls, variable){
        // TODO: create a teardown method that will remove all the listeners/bindings we have set
        // track the remove methods and then go through and call all of them on teardown call

        if (typeof cls.__watchers__ === 'undefined'){
            cls.__watchers__ = {};
        }

        if (typeof cls.__watchers__[variable] === 'undefined'){
            cls.__watchers__[variable] = [];
        }
    }

    definition.listen = function(variable, callback){
        //attaches callback to fire whenever variable is updated
        //variable must be exposed before assigning watches
        //returns function that deregisters watch
        //callback should take args (newValue, oldValue)

        checkWatchValues(this, variable);
        if (!isExposed(this, variable)){
            return;
        }

        this.__watchers__[variable].push(callback);

        //remove only first instance - in case things have attached multiple times for some reason
        var cls = this;
        var removeListener = function(){
            var index = cls.__watchers__[variable].indexOf(callback);
            if (index > -1){
                cls.__watchers__[variable].splice(index, 1);
            }
        }

        return removeListener;
    }

    definition.watch = function(var1, obj2, var2){
        //one-way binding of this.var1 to obj2.var2
        //requires only that this exposes var1 and obj2 exposes var2
        //returns function to call to unbind
        var obj1 = this;

        obj1[var1] = obj2[var2];

        //create listenerFunc
        var listenerFunc = function(value){
            //we are only checking the raw value here, to make sure we don't get recursions
            //this does rely on obj1.set var1 using __exposed__[var1]
            if (value !== obj1.__exposed__[var1]){
                //we set using the setter though, so it will fire it's watchers and not break the chain
                obj1[var1] = value;
            }
        }

        return obj2.listen(var2, listenerFunc);
    }

    definition.bind = function(var1, obj2, var2){
        //two-way binding of this.var1 to obj2.var2
        //bindings only fire if a value is changed to a non-equal value (prevents infinite loops)
        var unbind1 = this.watch(var1, obj2, var2);
        var unbind2 = obj2.watch(var2, this, var1);

        return function(){unbind1();unbind2();};
    }

    definition.instanceOf = function(other){
        //returns true if this is an instance class other, or it inherits from class other
        if (this.__className == other.__className){
            return true;
        }
        for (var i=0; i<this.__parents.length; i++){
            if (this.__parents[i].instanceOf(other)){
                return true;
            }
        }
        return false;
    }

    //TODO is there a faster (or cleaner if not much slower) way to handle super than Parent.prototype.func.call(this, arg1, arg2...)?????
    //unfortunately I think I am just trying to make something pretty that already is clear and very fast
    //might be able to be a bit faster if we add a definition.$ = {__className: Class} and call: this.$.Class.func.call(self, arg1, arg2) - but we use more memory and aren't any clearer

    var sWClassObject = Object.create(__definition);
    if (__inherits){
        for (var i=__inherits.length-1; i >= 0; i--){
            var inheritp = __inherits[i].prototype;
            definition.__parents.push(inheritp);
            for (var k in inheritp){
                if (inheritp.__public__ && inheritp.__public__.indexOf(k) > -1){
                    continue;
                }
                if (!definition.hasOwnProperty(k)){
                    definition[k] = inheritp[k];
                } else if (k === '__public__') {
                    //expand public values so this inherits properly
                    for (var j=0; j<inheritp[k].length; j++){
                        definition.__public__.push(inheritp[k][j]);
                    }
                }
            }
        }
    }

    if (definition.__public__){
        //ensure definition.__public__ has only unique values
        definition.__public__ = definition.__public__.filter(function(value, index, cls){
            return cls.indexOf(value) === index;
        });

        //now create the getters and setters for the public properties
        for (var i=0; i<definition.__public__.length; i++){
            var prop = definition.__public__[i];
            // THIS method works for keeping scope properly and everything works
            // this is also nearly as fast as Classes without any exposing, and is on prototype.
            // The thing is, just defining functions with closures around prop is failing
            // setting one of these props sets all somehow - hence the need to eval them :/

            // If that is the case - do we need to clean the props to make sure they are safe?
            // But then, how safe does it have to be?
            // Currently everything is looking up the prop via this[prop] - so it should be safe with any keys
            eval.call(this,"var propGetter = function(){return this.__getAttr__ ? this.__getAttr__('"+prop+"') : this.__getExposed__('"+prop+"');}");
            eval.call(this,"var propSetter = function(value){return this.__setAttr__ ? this.__setAttr__('"+prop+"', value) : this.__setExposed__('"+prop+"', value);}");
            definition.__defineGetter__(prop, propGetter);
            definition.__defineSetter__(prop, propSetter);
        }
    }

    var sWClassObject = function(){
        this.__exposed__ = {};
        if (this.__init__){
            this.__init__.apply(this, arguments);
        }
    }
    sWClassObject.prototype = definition;
    sWClassObject.prototype.constructor = sWClassObject;
    sWClassObject.__className = __className;

    return sWClassObject;
}
//End "Class"