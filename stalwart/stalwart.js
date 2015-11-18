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
