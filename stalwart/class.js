/*
  Copyright 2015, Matthew Roe, under MIT license
*/


/*
    Lots of ideas from:
    http://ejohn.org/blog/simple-javascript-inheritance/
    instead use ring: http://ringjs.neoname.eu/

    The goal is a raw javascript (so hopefully fast) class system.
    This class system also allows "exposing" variables to be bound to.
    The simplest form would be:
        Person = Class(function(){
            this.init = function(name, age){
                this.maxage = 90;
                this.age = age || 0;
                this.heightFeet = 6;
                this.name = name || 'John Doe';
            }
            
            this.addAge = function(amount){
                // this.age += amount;
                // anything that has been exposed should use this.setVar not this.var =
                this.setAge(this.age+amount);
            }

            this.expose('age');
        });

        a = new Person("Bob", 32);
        b = new Person("Steve", 25);
        b.setAge(a.getAge(b.setAge));
        a.addAge(5);
        //Both a and b will now be 37
*/

'use strict';

sW.Module.require('sW.Utils');

sW.Module.define('sW.Class', function(){
    var nS = this; //reference nameSpace for the sub functions

    nS.__inheritingNoInit = "sW.Class.Class.__inheritingDoNotInit";

    //TODO: we don't really want to be holding on to references of objects
    //what was the reasoning behind referencing it before?
    //nS.__classes = {};

    nS.grabNewFuncs = function(oldVars, newVars){
        //return array of key names of new functions not in old
        var newFuncs = [];
        var keys = Object.keys(newVars);
        for (var i=0; i<keys.length; i++){
            var key = keys[i];
            if (typeof newVars[key] == 'function'){
                if (newVars[key] != oldVars[key]){
                    newFuncs.push(key);
                }
            }
        }
        return newFuncs;
    }

    nS.sillyCopyObj = function(obj){
        var newObj = {};
        var keys = Object.keys(obj);
        for (var i=0; i<keys.length; i++){
            newObj[keys[i]] = obj[keys[i]];
        }
        
        return newObj;
    }

    nS.MakeSuper = function(self, className, funcName){
        var func = self[funcName];

        var compName = className+'.'+funcName;

        self.__superStore[compName] = func;
    }

    nS.Inherit = function(classObj, self){
        var oldVars = nS.sillyCopyObj(self);

        //var cls = nS.__classes[className];
        classObj.call(self, nS.__inheritingNoInit);
        
        var newFuncs = nS.grabNewFuncs(oldVars, self);

        for (var i=0; i<newFuncs.length; i++){
            var key = newFuncs[i];
            nS.MakeSuper(self, classObj.__className, key);
        }
    }

    //TODO: optimize Class to increase speed and reduce memory where we can
    //Can we do any sort of prototype usage to prevent redefining internal methods?
    //perhaps this.method = this.prototype.method (if undefined) - might save a bit?
    //currently this takes about 550ms to instantiate 10,000 CatDogs (from unit test)
    //    We should be able to make that much faster, hopefully
    //Comparing basic classes (no inheritance) speed was similar across 10,000 objects vs prototype

    nS.Class = function(){
        //takes two or three arguments:
        //  first is always the Class Name (string);
        //  second is optional, and an array of Class Names to inherit
        //  last is always the function definition for the class
        var __definition = null;
        var __className = null;
        var __inherits = null;
        if (arguments.length == 2){
            __className = arguments[0];
            __definition = arguments[1];
        } else if (arguments.length == 3){
            __className = arguments[0];
            __inherits = arguments[1];
            __definition = arguments[2];
        } else {
            throw new TypeError('Wrong number of arguments!');
        }

        // nS.__classes[__className] = function(){
        var definition = function(){
            //constants, some only created if needed

            // __className - set after applying parents so it is correct
            // __callInit - setup to call the init function (if there is one) if this is not an inherit
            //__superStore - by class store the super functions
            //__super - function to execute a super function
            //__parents - store of parent classes with their aliases
            //__watchers - store of callbacks to fire when things change, bound to variable names

            //Default funcs
            //check if this.__callInit - if it is not defined then none of the builtins are
            //if it is they should all be or we have larger problems
            //this speeds things up considerably, and prevents some bugginess as well
            //such as if you inherit a Class that redefines one of these, the changed definition will be reverted
            if (!this.__callInit){
                this.__callInit = function(){
                    if (this.init && (arguments.length == 0 || nS.__inheritingNoInit != arguments[0])){
                        this.init.apply(this, arguments);
                    }
                }
                this.__callInit.__builtIn = true;

                this.__super = function(clsFuncName, other){
                    return this.__superStore[clsFuncName].apply(this, other);
                }
                this.__super.__builtIn = true;

                this.instanceOf = function(cls){
                    //TODO: check if this inherits from cls, or one of our inherits.instanceOf(cls) (chaining up)

                    var clsName = cls;
                    if (typeof cls.__className != 'undefined'){
                        clsName = cls.__className;
                    }

                    //check if this is instanceOf cls
                    if (this.__className == clsName){
                        return true;
                    }

                    if (typeof this.__parents != 'undefined'){
                        //check if this is a direct parent
                        if (this.__parents.indexOf(clsName) != -1){
                            return true;
                        }

                        //TODO: currently we are throwing all parents onto the same list - but want a real tree
                    }

                    return false;
                }
                this.instanceOf.__builtIn = true;

                this.expose = function(){
                    //create getters (with optional callback on change) and setters
                    //no longer using watchVar

                    //TODO: if you do a.setVar(b.getVar(a.setVar)) a.setVar is being executed oddly, but it works if you wrap it in another function!
                    if (typeof this.__watchers == 'undefined'){
                        this.__watchers = {};
                    }

                    for (var i=0; i<arguments.length; i++){
                        var name = arguments[i];
                        //capitalize first char
                        var capName = name.charAt(0).toUpperCase() + name.slice(1);

                        //check if this is already exposed (from inheriting)
                        if (typeof this['set'+capName] == 'undefined'){
                            //store this variable as a watcheable var
                            if (typeof this.__watchers[name] == 'undefined'){
                                this.__watchers[name] = [];
                            }

                            //create getter
                            this['get'+capName] = function(){
                                return this[name];
                            }

                            //create setter
                            this['set'+capName] = function(value){
                                if (value !== this[name]){
                                    this[name] = value;
                                    if (this.__watchers[name].length){
                                        for (var i=0; i<this.__watchers[name].length; i++){
                                            this.__watchers[name][i](value);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                this.expose.__builtIn = true;

                this.listen = function(varName, callback){
                    //attaches a listener to this.varName (requires it be exposed)
                    if (typeof this.__watchers[varName] == 'undefined'){
                        throw new AttributeError(varName+' is not exposed!');
                    }
                    this.__watchers[varName].push(callback);

                    var thisthis = this;

                    return function(){
                        var ind = thisthis.__watchers[varName].indexOf(callback);
                        if (ind > -1){
                            thisthis.__watchers[varName].splice(ind, 1);
                        }
                    }
                }
                this.listen.__builtIn = true;

                this.watch = function(var1, obj2, var2){
                    //binds this.var1 to obj2.var2
                    var obj1 = this;
                    var setter = function(value){
                        var name = 'set' + var1.charAt(0).toUpperCase() + var1.slice(1);
                        obj1[name](value);
                    }

                    setter(obj2[var2]);

                    return obj2.listen(var2, setter);
                }
                this.watch.__builtIn = true;

                this.bind = function(var1, obj2, var2){
                    var unbind1 = this.watch(var1, obj2, var2);
                    var unbind2 = obj2.watch(var2, this, var1);

                    return function(){
                        unbind1();
                        unbind2();
                    }
                }
                this.bind.__builtIn = true;

                //populate this after all builtIns are finished
                this.__superStore = {}
                var keys = Object.keys(this);
                for (var i=0; i<keys.length; i++){
                    var key = keys[i];
                    if (this[key].__builtIn){
                        this.__superStore[key] = this[key];
                    }
                }
            }


            if (__inherits){
                //TODO: this should be only immediate parents, and build a tree for more :/
                if (typeof this.__parents == 'undefined'){
                    this.__parents = [];
                }
                for (var i=0; i<__inherits.length; i++){
                    var inh = __inherits[i];
                    nS.Inherit(inh, this);
                    this.__parents.push(inh.__className);
                }
            }

            this.__className = __className;

            __definition.call(this);
            
            this.__callInit.apply(this,arguments);
        }

        //store the __className on the definition as well, so it is there for comparisons
        definition.__className = __className;

        return definition;
    }

    nS.Class2 = function(){
        var __definition = null;
        var __className = null;
        var __inherits = null;
        if (arguments.length == 2){
            __className = arguments[0];
            __definition = arguments[1];
        } else if (arguments.length == 3){
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
            if (this.__watchers__ && this.__watchers__[prop]){
                var oldValue = this.__exposed__[prop];
                for (var i=0; i<this.__watchers__[prop]; i++){
                    this.__watchers__[prop][i](value, oldValue);
                }
            }
            this.__exposed__[prop] = value;
        }
        definition.__getExposed__ = function(prop){
            return this.__exposed__[prop];
        }

        definition.watch = function(variable, callback){
            //attaches callback to fire whenever variable is updated
            //variable must be exposed before assigning watches
            //returns function that deregisters watch
            //callback should take args (newValue, oldValue)

            if (!this.__exposed__.hasOwnProperty(variable)){
                throw new AttributeError('Can only watch variables that are exposed');
            }

            if (typeof this.__watchers__ == 'undefined'){
                this.__watchers__ = {};
            }

            if (typeof this.__watchers__[variable] == 'undefined'){
                this.__watchers__[variable] = [];
            }

            this.__watchers__[variable].push(callback);

            //remove only first instance - in case things have attached multiple times for some reason
            var cls = this;
            var removeWatcher = function(){
                var index = cls.__watchers__[variable].indexOf(callback);
                if (index > -1){
                    cls.__watchers__[variable].splice(index, 1);
                }
            }

            return removeWatcher;
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
                    if (inheritp.__public__.indexOf(k) > -1){
                        continue;
                    }
                    if (!definition.hasOwnProperty(k)){
                        definition[k] = inheritp[k];
                    } else if (k == '__public__') {
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
                var getPropCustom = '__getAttr'+sW.Utils.capitalize(prop)+'__';
                var setPropCustom = '__setAttr'+sW.Utils.capitalize(prop)+'__';
                // THIS method works for keeping scope properly and everything works
                // this is also nearly as fast as Classes without any exposing, and is on prototype.
                // The thing is, just defining functions with closures around prop is failing
                // setting one of these props sets all somehow - hence the need to eval them :/

                // If that is the case - do we need to clean the props to make sure they are safe?
                // But then, how safe does it have to be?
                // Currently everything is looking up the prop via this[prop] - so it should be safe with any keys
                // the only funky one is it is looking for this["__getAttrProp__"] - so weird characters would mean
                // defining the variable as a string to make it work
                eval.call(this,"var propGetter = function(){"+
                               "var getter = this['"+getPropCustom+"'];"+
                               "if (getter){return getter.call(this);};"+
                               "return this.__getAttr__ ? this.__getAttr__('"+prop+"') : this.__getExposed__('"+prop+"');}");
                eval.call(this,"var propSetter = function(value){"+
                               "var setter = this."+setPropCustom+";"+
                               "if (setter){return setter.call(this, value);};"+
                               "return this.__setAttr__ ? this.__setAttr__('"+prop+"', value) : this.__setExposed__('"+prop+"', value);}");
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

        return sWClassObject;
    }
});
