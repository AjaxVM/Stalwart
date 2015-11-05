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

function grabNewFuncs(oldVars, newVars){
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

function sillyCopyObj(obj){
    var newObj = {};
    var keys = Object.keys(obj);
    for (var i=0; i<keys.length; i++){
        newObj[keys[i]] = obj[keys[i]];
    }
    
    return newObj;
}

MakeSuper = function(self, cls, funcname){
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

Inherit = function(cls, alias, self, other){
    var oldVars = sillyCopyObj(self);
        cls.apply(self, other);
    
    var newFuncs = grabNewFuncs(oldVars, self);
    for (var i=0; i<newFuncs.length; i++){
        MakeSuper(self, alias, newFuncs[i]);
    }
}

Class = function(){
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
                        console.log('...',this);
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
                Inherit(inherits[i], this);
            }
        }
        definition.apply(this, arguments);
        
        this.init.apply(this, arguments);
    }
}

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

Indian = Class(function(){
    Inherit(Person, 'Person', this);
    
    this.init = function(name, age){
        this.__super('Person.init', [name, age]);
        
        this.race = 'Indian';
    }
    
    //don't need to re-declare expose from parents
});

a = new Person('Bob', 45);
b = new Indian('Jojo', 33);
c = new Indian('Testy', 23);
console.log(a);
console.log(b);
console.log(c);


//why the hell does using b.setAge as a callback not work for watch, but function(val){b.setAge(val)} does work?
//why is the callback being called with setAge as a watcher???
b.setAge(a.getAge(b.setAge));
a.addAge(5);
a.heightFeet = 5;
console.log(a);
console.log(b);
console.log(c);
