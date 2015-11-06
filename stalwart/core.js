

sW.require('sW.Defaults');
sW.require('sW.Utils');
sW.require('sW.Class');

sW.module('sW.Core');

sW.Core.watch = function(obj1, var1, obj2, var2){
    //allows you to have obj2.var2 be set to obj1.var1 whenever it changes (basically they are bound)
    //requires obj1 and obj2 to be a sW Class instance, and var1 and var2 to be exposed
    //returns function that will unwatch
    var setter = function(value){
        obj2['set'+sW.Utils.capitalize(var2)](obj1[var1]);
    }
    obj1.__watchers[var1].push(setter);

    setter(obj1[var1]);

    return function(){
        sW.Utils.removeFrom(obj1.__watchers[var1], setter);
    }
}

sW.Core.bind = function(obj1, var1, obj2, var2){
    //allows you to have obj1.var1 watch obj2.var2 and vice-versa (two-way binding)
    //returns function which will undo binding
    var unbind1 = sW.Core.watch(obj1, var1, obj2, var2);
    var unbind2 = sW.Core.watch(obj2, var2, obj1, var1);

    return function(){
        unbind1();
        unbind2();
    }
}