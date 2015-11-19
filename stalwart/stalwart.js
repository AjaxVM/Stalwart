/*
  Copyright 2015, Matthew Roe, under MIT license
*/

//require jQuery at the top level

(function(){
    "use strict";
    
    if (!window.jQuery){
        throw new ReferenceError('Stalwart requires you to include jQuery (2.1.4 recommended) first');
    }

    window.sW = {};

    //declare basic module structure at top level
    //this also creates the "Module" module (of sorts)
    //Modules are applied onto whichever object is given to them
    //in this case, they are sharing the core sW namespace, because they are adding values to it directly
    //in the case of a more advanced module (like Trigger), which defines multiple functions/constants/etc.
    //you should create a named object inside sW (or wherever) to represent the namespace for the module
    sW.Module = function(namespace, definition){
        //this==namespace, just a convenience
        definition.call(namespace, namespace);
    };
}());

sW.Module(sW, function(namespace){
    "use strict";

    this.version = "0.1";

    var __afterInitTrigger = "sW.initFinished";
    this.finishedInit = false;

    this.onInit = function(userCallback){
        if (userCallback){
            $(document).ready(function(){
                userCallback();
                namespace.Trigger.fire(__afterInitTrigger);
                namespace.finishedInit = true;
            });
        }
    };

    this.afterInit = function(callback){
        if (namespace.finishedInit){
            callback();
        } else {
            namespace.Trigger.once(__afterInitTrigger, callback);
        }
    };
});
