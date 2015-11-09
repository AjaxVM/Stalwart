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

sW.Module.define('sW.Class', function(){
    var nS = this; //reference nameSpace for the sub functions

    //TODO: we don't really want to be holding on to references of objects
    //what was the reasoning behind referencing it before?
    //nS.__classes = {};

    nS.grabNewFuncs = function(oldVars, newVars){
        //return array of key names of new functions not in old
        var newFuncs = [];
        var keys = Object.keys(newVars);
        for (var i=0; i<keys.length; i++){
            if (typeof newVars[keys[i]] == 'function'){
                if (newVars[keys[i]] != oldVars[keys[i]]){
                    newFuncs.push(keys[i]);
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

    nS.MakeSuper = function(self, className, funcName, func){
        if (typeof self.__superStore == 'undefined'){
            self.__superStore = {};
        }
        var compName = className+'.'+funcName;
        if (typeof self.__super == 'undefined'){
            self.__super = function(clsFuncName, other){
                self.__superStore[clsFuncName].apply(self, other);
            }
        }
        self.__superStore[compName] = func;
    }

    nS.Inherit = function(className, self){
        var oldVars = nS.sillyCopyObj(self);

        var cls = nS.__classes[className];
        cls.call(self);
        
        var newFuncs = nS.grabNewFuncs(oldVars, self);
        for (var i=0; i<newFuncs.length; i++){
            var oldFunc = oldVars[newFuncs[i]];
            nS.MakeSuper(self, className, newFuncs[i], oldFunc);
        }
    }

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
        } else{
            throw new TypeError('Wrong number of arguments!');
        }

        // nS.__classes[__className] = function(){
        var definition = function(){
            //constants, some only created if needed

            // __className - set after applying parents so it is correct
            //__superStore - by class store the super functions
            //__super - function to execute a super function
            //__parents - store of parent classes with their aliases
            //__watchers - store of callbacks to fire when things change, bound to variable names

            //Default funcs

            this.init = function(){
                //intentionally blank
            };

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

            this.bind = function(var1, obj2, var2){
                var unbind1 = this.watch(var1, obj2, var2);
                var unbind2 = obj2.watch(var2, this, var1);

                return function(){
                    unbind1();
                    unbind2();
                }
            }


            if (__inherits){
                //TODO: this should be only immediate parents, and build a tree for more :/
                if (typeof this.__parents == 'undefined'){
                    this.__parents = [];
                }
                for (var i=0; i<__inherits.length; i++){
                    var inh = __inherits[i];
                    //handle Classes or Class Names
                    if (typeof inh.__className != 'undefined'){
                        inh = inh.__className;
                    }
                    nS.Inherit(inh, this);
                    this.__parents.push(inh);
                }
            }

            this.__className = __className;

            __definition.apply(this);
            
            this.init.apply(this, arguments);
        }

        //store the __className on the definition as well, so it is there for comparisons
        definition.__className = __className;

        // nS.__classes[__className] = definition;

        return definition;
    }
});
