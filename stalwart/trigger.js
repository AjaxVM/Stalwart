/*
  Copyright 2015, Matthew Roe, under MIT license
*/


sW.Trigger = {}; //namespace for Trigger module
sW.Module(sW.Trigger, function(){
    "use strict";
    
    var __callbacksToCallOnce = {}; //on trigger call and remove from list
    var __callbacksToCallALot = {}; //on trigger call and leave on list

    this.on = function(trigger, callback){
        //set this up to fire callback every time trigger is called
        if (typeof __callbacksToCallALot[trigger] == "undefined"){
            __callbacksToCallALot[trigger] = [];
        }

        __callbacksToCallALot[trigger].push(callback);
    };

    this.once = function(trigger, callback){
        //set this up to fire callback once on trigger being called
        if (typeof __callbacksToCallOnce[trigger] == "undefined"){
            __callbacksToCallOnce[trigger] = [];
        }

        __callbacksToCallOnce[trigger].push(callback);
    };

    this.off = function(trigger, callback){
        //if callback - remove all instances of callback from listening for trigger
        //if trigger, removes all callbacks from listening to trigger
        //else, clear all watchers
        if (callback){
            if (__callbacksToCallOnce[trigger]){
                __callbacksToCallOnce[trigger] = $.grep(
                    __callbacksToCallOnce[trigger],
                    function(cback){
                        if (cback == callback){
                            return false;
                        }
                        return true;
                    }
                );
            }
            if (__callbacksToCallALot[trigger]){
                __callbacksToCallALot[trigger] = $.grep(
                    __callbacksToCallALot[trigger],
                    function(cback){
                        if (cback == callback){
                            return false;
                        }
                        return true;
                    }
                );
            }
        } else if (trigger){
            __callbacksToCallOnce[trigger] = [];
            __callbacksToCallALot[trigger] = [];
        } else {
            __callbacksToCallOnce = {};
            __callbacksToCallALot = {};
        }
    };

    this.watching = function(){
        //returns array of triggers currently being watched
        var watching = [];

        var alot = __callbacksToCallALot;
        var once = __callbacksToCallOnce;

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
    };

    this.fire = function(trigger, value){
        //fires trigger name with value
        //calls all the once callbacks first then the recurring ones
        //callbacks are executed as callback(value, trigger)

        //first the one-timers - clear out once called
        var once = __callbacksToCallOnce[trigger];
        if (once) {
            $.each(once, function(i, cback){
                cback(value, trigger);
            });
            once.length = 0;
        }

        //now the recurring ones
        var alot = __callbacksToCallALot[trigger];
        if (alot){
            $.each(alot, function(i, cback){
                cback(value, trigger);
            });
        }
    };
});
//End "Trigger"