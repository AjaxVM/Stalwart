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

sW.module('sW.Class');

sW.Class.grabNewFuncs = function(oldVars, newVars){
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

sW.Class.sillyCopyObj = function(obj){
    var newObj = {};
    var keys = Object.keys(obj);
    for (var i=0; i<keys.length; i++){
        newObj[keys[i]] = obj[keys[i]];
    }
    
    return newObj;
}

sW.Class.MakeSuper = function(self, cls, funcname){
    if (typeof self.__superStore == 'undefined'){
        self.__superStore = {};
    }
    var name = cls+'.'+funcname;
    if (typeof self.__super == 'undefined'){
        self.__super = function(func, other){
            self.__superStore[func].apply(self, other);
        }
    }
    self.__superStore[name] = self[funcname];
}

sW.Class.Inherit = function(cls, alias, self, other){
    var oldVars = sW.Class.sillyCopyObj(self);
        cls.apply(self, other);
    
    var newFuncs = grabNewFuncs(oldVars, self);
    for (var i=0; i<newFuncs.length; i++){
        sW.Class.MakeSuper(self, alias, newFuncs[i]);
    }
}

sW.Class.Class = function(){
    //takes one or two arguments, last is definition of object, first (if any) is array of classes to inherit
    var definition = null;
    var inherits = null;
    if (arguments.length>=2){
        inherits = arguments[0];
        definition = arguments[1];
    } else {
        definition = arguments[0];
    }
    return function(){
        //constants that might be needed

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
                    this['get'+capName] = function(callback){
                        if (callback){
                            this.__watchers[name].push(callback);
                        }
                        return this[name];
                    }

                    //create setter
                    this['set'+capName] = function(value){
                        if (value !== this[name]){
                            this[name] = value;
                            for (var i=0; i<this.__watchers[name].length; i++){
                                this.__watchers[name][i](value);
                            }
                        }
                    }
                }
            }
        }

        if (inherits){
            for (var i=0; i<inherits.length; i++){
                sW.Class.Inherit(inherits[i], this);
            }
        }
        definition.apply(this, arguments);
        
        this.init.apply(this, arguments);
    }
}
