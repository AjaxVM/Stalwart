/*
  Copyright 2015, Matthew Roe, under MIT license
*/


'use strict';


//Module "Utils"
sW.Utils = {};
sW.Utils.sleepFor = function( sleepDuration ){
    var now = new Date().getTime();
    while(new Date().getTime() < now + sleepDuration){ /* do nothing */ } 
}

sW.Utils.capitalize = function(value){
    return value.charAt(0).toUpperCase() + value.slice(1);
}

sW.Utils.removeFrom = function(arr, value){
    var i = arr.indexOf(value);
    if (i > -1){
        arr.splice(i, 1);
    }
}

sW.Utils.forEach = function(obj_or_arr, callback){
    //If array will call callback with (element, index) as arguments
    //If object will call callback with (element, key, index) as arguments
    if ($.isArray(obj_or_arr)){
        for (var i=0; i<obj_or_arr.length; i++){
            callback(obj_or_arr[i], i);
        }
    } else {
        //assume an object
        var keys = Object.keys(obj_or_arr);
        for (var i=0; i<keys.length; i++){
            callback(obj_or_arr[keys[i]], keys[i], i);
        }
    }
}


sW.Defaults.setDefault('formatString', 'array_separator', '%%');
sW.Defaults.setDefault('formatString', 'key_separator', '{,}');
sW.Utils.formatString = function(string, args, sep){
    //formats a string with either array of values that replace sep (%% by default) characters
    //or, takes an object of keys that match sep_start+key+sep_end (sep is split on comma and defaults to {,}) and replace with value
    
    if ($.isArray(args)){
        var sep = sep || sW.Defaults.getDefault('formatString', 'array_separator');
        var parts = string.split(sep);
        var result = '';
        
        sW.forEach(parts, function(obj, i){
            result = result + obj + args[i];
        });
        
        return result;
    } else {
        //assume object
        var sep = (sep || sW.Defaults.getDefault('formatString', 'key_separator'));
        var seps = sep.split(',');
        var sep_start = seps[0];
        var sep_end = seps[1];
        sW.forEach(args, function(obj, key, i){
            string = string.replace(sep_start+key+sep_end, obj);
        });
    }
    
    return string;
}
//End "Utils"