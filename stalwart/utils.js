/*
  Copyright 2015, Matthew Roe, under MIT license
*/


'use strict';


//Module "Utils"

sW.Utils = {};
(function(){
    this.sleepFor = function( sleepDuration ){
        //blocks everything for sleepDuration (ms)
        var now = new Date().getTime();
        while(new Date().getTime() < now + sleepDuration){ /* do nothing */ } 
    }

    this.capitalize = function(value){
        return value.charAt(0).toUpperCase() + value.slice(1);
    }

    this.removeFrom = function(arr, value){
        var i = arr.indexOf(value);
        if (i > -1){
            arr.splice(i, 1);
        }
    }

    this.forEach = function(obj_or_arr, callback){
        //If array will call callback with (value, index) as arguments
        //If object will call callback with (key, value, index) as arguments
        if (Array.isArray(obj_or_arr)){
            for (var i=0; i<obj_or_arr.length; i++){
                callback(obj_or_arr[i], i);
            }
        } else {
            //assume an object
            var keys = Object.keys(obj_or_arr);
            for (var i=0; i<keys.length; i++){
                callback(keys[i], obj_or_arr[keys[i]], i);
            }
        }
    }

    this.replaceAll = function(original, replace, value){
        //inspired by http://stackoverflow.com/a/23209168
        var new_string = '';
        var copy = original;
        var current_place = 0;
        var index = -1;

        var replace_length = replace.length;
        var original_length = original.length;

        while((index=copy.indexOf(replace)) > -1)
        {
            new_string += original.substring(current_place, current_place+index) + value;
            copy = copy.substring(index+replace_length);
            current_place += index+replace_length;
        }

        // Add Leftover
        if(copy.length > 0){
            new_string += original.substring(original_length-copy.length);
        }

        // Return New String
        return new_string;
    };

    this.formatString = function(string, args, sep){

        var sep = sep || sW.Utils.formatString.default_separator;
        var seps = sep.split(',');
        var sep_start = seps[0];
        var sep_end = seps[1];
        
        if (Array.isArray(args)){
            sW.Utils.forEach(args, function(obj, i){
                // var mysep = sep_start+i+sep_end;
                // string = string.replace(new RegExp(sep_start+i+sep_end, 'g'), obj);
                string = sW.Utils.replaceAll(string, sep_start+i+sep_end, obj);
            });
        } else if (args !== null && typeof args === 'object'){
            sW.Utils.forEach(args, function(key, obj, i){
                // string = string.replace(new RegExp(sep_start+key+sep_end, 'g'), obj);
                string = sW.Utils.replaceAll(string, sep_start+key+sep_end, obj);
            });
        } else {
            //assume singleton
            // string = string.replace(new RegExp(sep_start+sep_end, 'g'), args);
            string = sW.Utils.replaceAll(string, sep_start+sep_end, args);
        }
        
        return string;
    }
    this.formatString.default_separator = '{,}';
}).call(sW.Utils);
//End "Utils"