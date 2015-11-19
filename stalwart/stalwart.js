/*
  Copyright 2015, Matthew Roe, under MIT license
*/


'use strict';

//require jQuery at the top level
if (!window.jQuery){
    throw new ReferenceError('Stalwart requires you to include jQuery (2.1.4 recommended) first');
}

var sW = {};

//declare basic module structure at top level
//this also creates the "Module" module (of sorts)
//Modules are applied onto whichever object is given to them
//in this case, directly onto sW for single values, or onto an inner-object for true modules
sW.Module = function(namespace, definition){
    //this==namespace, just a convenience
    definition.call(namespace, namespace);
}

sW.Module(sW, function(namespace){
    this.version = '0.1';

    var __afterInitTrigger = 'sW.initFinished';
    this.finishedInit = false;

    this.onInit = function(userCallback){
        if (userCallback){
            $(document).ready(function(){
                userCallback();
                namespace.Trigger.fire(__afterInitTrigger);
                namespace.finishedInit = true;
            });
        }
    }

    this.afterInit = function(callback){
        if (namespace.finishedInit){
            callback();
        } else {
            namespace.Trigger.once(__afterInitTrigger, callback);
        }
    }
});
