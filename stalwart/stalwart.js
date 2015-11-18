/*
  Copyright 2015, Matthew Roe, under MIT license
*/


'use strict';

//require jQuery at the top level
if (!window.jQuery){
    throw new ReferenceError('Stalwart requires you to include jQuery (2.1.4 recommended) first');
}

var sW = {};
sW.version = '0.1';

sW.__afterInitTrigger = 'sW.initFinished';
sW.finishedInit = false;

sW.onInit = function(userCallback){
    if (userCallback){
        $(document).ready(function(){
            userCallback();
            sW.Trigger.fire(sW.__afterInitTrigger);
            sW.finishedInit = true;
        });
    }
}

sW.afterInit = function(callback){
    if (sW.finishedInit){
        callback();
    } else {
        sW.Trigger.once(sW.__afterInitTrigger, callback);
    }
}


//Module "Trigger"
sW.Trigger = {}; //namespace for Trigger module
sW.Trigger.__callbacksToCallOnce = {}; //on trigger call and remove from list
sW.Trigger.__callbacksToCallALot = {}; //on trigger call and leave on list

sW.Trigger.on = function(trigger, callback){
    //set this up to fire callback every time trigger is called
    if (typeof sW.Trigger.__callbacksToCallALot[trigger] == 'undefined'){
        sW.Trigger.__callbacksToCallALot[trigger] = [];
    }

    sW.Trigger.__callbacksToCallALot[trigger].push(callback);
}

sW.Trigger.once = function(trigger, callback){
    //set this up to fire callback once on trigger being called
    if (typeof sW.Trigger.__callbacksToCallOnce[trigger] == 'undefined'){
        sW.Trigger.__callbacksToCallOnce[trigger] = [];
    }

    sW.Trigger.__callbacksToCallOnce[trigger].push(callback);
}

sW.Trigger.off = function(trigger, callback){
    //if callback - remove all instances of callback from listening for trigger
    //if trigger, removes all callbacks from listening to trigger
    //else, clear all watchers
    if (callback){
        if (sW.Trigger.__callbacksToCallOnce[trigger]){
            sW.Trigger.__callbacksToCallOnce[trigger] = $.grep(
                sW.Trigger.__callbacksToCallOnce[trigger],
                function(cback){
                    if (cback == callback){
                        return false;
                    }
                    return true;
                }
            );
        }
        if (sW.Trigger.__callbacksToCallALot[trigger]){
            sW.Trigger.__callbacksToCallALot[trigger] = $.grep(
                sW.Trigger.__callbacksToCallALot[trigger],
                function(cback){
                    if (cback == callback){
                        return false;
                    }
                    return true;
                }
            );
        }
    } else if (trigger){
        sW.Trigger.__callbacksToCallOnce[trigger] = [];
        sW.Trigger.__callbacksToCallALot[trigger] = [];
    } else {
        sW.Trigger.__callbacksToCallOnce = {};
        sW.Trigger.__callbacksToCallALot = {};
    }
}

sW.Trigger.watching = function(){
    //returns array of triggers currently being watched
    var watching = [];

    var alot = sW.Trigger.__callbacksToCallALot;
    var once = sW.Trigger.__callbacksToCallOnce;

    var keys = Object.keys(alot).concat(Object.keys(once));
    $.each(keys, function(index, key){
        if (watching.indexOf(key) > -1){
            return;
        }
        if ((alot[key] && alot[key].length) || (once[key] && once[key].length)){
            watching.push(key);
        }
    });

    return watching;
}

sW.Trigger.fire = function(trigger, value){
    //fires trigger name with value
    //calls all the once callbacks first then the recurring ones
    //callbacks are executed as callback(value, trigger)

    //first the one-timers - clear out once called
    var once = sW.Trigger.__callbacksToCallOnce[trigger];
    if (once) {
        $.each(once, function(i, cback){
            cback(value, trigger);
        });
        once.length = 0;
    }

    //now the recurring ones
    var alot = sW.Trigger.__callbacksToCallALot[trigger];
    if (alot){
        $.each(alot, function(i, cback){
            cback(value, trigger);
        });
    }
}
//End "Trigger"


//Module "Defaults"
sW.Defaults = {};
sW.Defaults.__defaults = {};

sW.Defaults.setDefault = function(func, name, value){
    if (!sW.Defaults.__defaults[func]){
        sW.Defaults.__defaults[func] = {}
    }
    sW.Defaults.__defaults[func][name] = value;
}

sW.Defaults.getDefault = function(func, name){
    return sW.Defaults.__defaults[func][name];
}
//End "Defaults"

//Module "Utils"
sW.Utils = {};
sW.Utils.sleepFor = function( sleepDuration ){
    var now = new Date().getTime();
    while(new Date().getTime() < now + sleepDuration){ /* do nothing */ } 
}

sW.Utils.capitalize = function(value){
    return value.charAt(0).toUpperCase() + value.slice(1);
}

sW.Utils.removeFrom = function(arr, value){
    var i = arr.indexOf(value);
    if (i > -1){
        arr.splice(i, 1);
    }
}

sW.Utils.forEach = function(obj_or_arr, callback){
    //If array will call callback with (element, index) as arguments
    //If object will call callback with (element, key, index) as arguments
    if ($.isArray(obj_or_arr)){
        for (var i=0; i<obj_or_arr.length; i++){
            callback(obj_or_arr[i], i);
        }
    } else {
        //assume an object
        var keys = Object.keys(obj_or_arr);
        for (var i=0; i<keys.length; i++){
            callback(obj_or_arr[keys[i]], keys[i], i);
        }
    }
}


sW.Defaults.setDefault('formatString', 'array_separator', '%%');
sW.Defaults.setDefault('formatString', 'key_separator', '{,}');
sW.Utils.formatString = function(string, args, sep){
    //formats a string with either array of values that replace sep (%% by default) characters
    //or, takes an object of keys that match sep_start+key+sep_end (sep is split on comma and defaults to {,}) and replace with value
    
    if ($.isArray(args)){
        var sep = sep || sW.Defaults.getDefault('formatString', 'array_separator');
        var parts = string.split(sep);
        var result = '';
        
        sW.forEach(parts, function(obj, i){
            result = result + obj + args[i];
        });
        
        return result;
    } else {
        //assume object
        var sep = (sep || sW.Defaults.getDefault('formatString', 'key_separator'));
        var seps = sep.split(',');
        var sep_start = seps[0];
        var sep_end = seps[1];
        sW.forEach(args, function(obj, key, i){
            string = string.replace(sep_start+key+sep_end, obj);
        });
    }
    
    return string;
}
//End "Utils"


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
