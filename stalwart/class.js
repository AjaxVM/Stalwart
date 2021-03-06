/*
  Copyright 2015, Matthew Roe, under MIT license
*/


//Todo: do we want Class to be a full module with multiple members, or just assign a singleton?

sW.Module(sW, function(){
    "use strict";
    
    this.Class = function(){
        //__definition is a passed-in constructor, don't care about naming convention in jshint
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
            throw new TypeError("Wrong number of arguments!");
        }

        var definition = new __definition();
        definition.__parents = [];
        definition.__className = __className;

        definition.expose = function(prop){
            // THIS method works for keeping scope properly and everything works
            // this is also nearly as fast as Classes without any exposing, and is on prototype.
            // The thing is, just defining functions with closures around prop is failing
            // setting one of these props sets all somehow - hence the need to eval them :/

            // If that is the case - do we need to clean the props to make sure they are safe?
            // But then, how safe does it have to be?
            // Currently everything is looking up the prop via this[prop] - so it should be safe with any keys

            //firt, check if we have a value
            var value = this[prop];
            if (typeof value !== 'undefined'){
                delete this[prop];
            }
            var propGetter, propSetter;
            eval("propGetter = function(){return this.__getAttr__ ? this.__getAttr__(\""+prop+"\") : this.__getExposed__(\""+prop+"\");}");
            eval("propSetter = function(value){return this.__setAttr__ ? this.__setAttr__(\""+prop+"\", value) : this.__setExposed__(\""+prop+"\", value);}");
            definition.__defineGetter__(prop, propGetter);
            definition.__defineSetter__(prop, propSetter);

            if (typeof value !== 'undefined'){
                this[prop] = value;
            }
        }

        definition.mutated = function(prop){
            if (this.__watchers__ && this.__watchers__[prop]){
                for (var i=0; i<this.__watchers__[prop].length; i++){
                    this.__watchers__[prop][i](this.__exposed__[prop]);
                }
            }
        }

        definition.__setExposed__ = function(prop, value){
            this.__exposed__[prop] = value;
            this.mutated(prop);
        };

        definition.__getExposed__ = function(prop){
            return this.__exposed__[prop];
        };

        definition.isExposed = function(variable){
            if (typeof this.__exposed__ === "undefined" || !this.__exposed__.hasOwnProperty(variable)){
                return false;
            }
            return true;
        };

        var checkWatchValues = function(cls, variable){
            // TODO: create a teardown method that will remove all the listeners/bindings we have set
            // track the remove methods and then go through and call all of them on teardown call

            if (typeof cls.__watchers__ === "undefined"){
                cls.__watchers__ = {};
            }

            if (typeof cls.__watchers__[variable] === "undefined"){
                cls.__watchers__[variable] = [];
            }
        };

        definition.clearListeners = function(){
            for (var i=0; i<this.__myListenerUnbinds__.length; i++){
                this.__myListenerUnbinds__[i]();
            }
            this.__myListenerUnbinds__ = [];
        }

        definition.listen = function(variable, callback){
            //attaches callback to fire whenever variable is updated
            //variable must be exposed before assigning watches
            //returns function that deregisters watch
            //callback should take args (newValue, oldValue)

            checkWatchValues(this, variable);
            if (!this.isExposed(variable)){
                throw new Error("Can only watch variables that are exposed, \""+variable+"\" is not");
            }

            this.__watchers__[variable].push(callback);

            //remove only first instance - in case things have attached multiple times for some reason
            var cls = this;
            var removeListener = function(){
                var index = cls.__watchers__[variable].indexOf(callback);
                if (index > -1){
                    cls.__watchers__[variable].splice(index, 1);
                }
            };

            this.__myListenerUnbinds__.push(removeListener);

            return removeListener;
        };

        definition.watch = function(var1, obj2, var2, callback){
            //one-way binding of this.var1 to obj2.var2
            //optionally takes an additional callback to fire on changes
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
                    //fire callback
                    if (callback){
                        callback(value);
                    }
                }
            };

            var x = obj2.listen(var2, listenerFunc);
            this.__myListenerUnbinds__.push(x);
            return x;
        };

        definition.bind = function(var1, obj2, var2, callback){
            //two-way binding of this.var1 to obj2.var2
            //bindings only fire if a value is changed to a non-equal value (prevents infinite loops)
            var unbind1 = this.watch(var1, obj2, var2, callback);
            var unbind2 = obj2.watch(var2, this, var1, callback);

            return function(){unbind1();unbind2();};
        };

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
        };

        //TODO is there a faster (or cleaner if not much slower) way to handle super than Parent.prototype.func.call(this, arg1, arg2...)?????
        //unfortunately I think I am just trying to make something pretty that already is clear and very fast
        //might be able to be a bit faster if we add a definition.$ = {__className: Class} and call: this.$.Class.func.call(self, arg1, arg2) - but we use more memory and aren't any clearer

        var i;
        if (__inherits){
            for (i=__inherits.length-1; i >= 0; i--){
                var inheritp = __inherits[i].prototype;
                definition.__parents.push(inheritp);
                for (var k in inheritp){
                    if (inheritp.__public__ && inheritp.__public__.indexOf(k) > -1){
                        continue;
                    }
                    if (!definition.hasOwnProperty(k)){
                        definition[k] = inheritp[k];
                    } else if (k === "__public__") {
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
            for (i=0; i<definition.__public__.length; i++){
                var prop = definition.__public__[i];
                definition.expose(prop);
                // // THIS method works for keeping scope properly and everything works
                // // this is also nearly as fast as Classes without any exposing, and is on prototype.
                // // The thing is, just defining functions with closures around prop is failing
                // // setting one of these props sets all somehow - hence the need to eval them :/

                // // If that is the case - do we need to clean the props to make sure they are safe?
                // // But then, how safe does it have to be?
                // // Currently everything is looking up the prop via this[prop] - so it should be safe with any keys
                // var propGetter, propSetter;
                // eval("propGetter = function(){return this.__getAttr__ ? this.__getAttr__(\""+prop+"\") : this.__getExposed__(\""+prop+"\");}");
                // eval("propSetter = function(value){return this.__setAttr__ ? this.__setAttr__(\""+prop+"\", value) : this.__setExposed__(\""+prop+"\", value);}");
                // definition.__defineGetter__(prop, propGetter);
                // definition.__defineSetter__(prop, propSetter);
            }
        }

        var sWClassObject = function(){
            this.__exposed__ = {};
            this.__myListenerUnbinds__ = [];
            if (this.__init__){
                this.__init__.apply(this, arguments);
            }
        };

        sWClassObject.prototype = definition;
        sWClassObject.prototype.constructor = sWClassObject;
        sWClassObject.__className = __className;

        return sWClassObject;
    };
});
//End "Class"
