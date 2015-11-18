/*
  Copyright 2015, Matthew Roe, under MIT license
*/


'use strict';


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