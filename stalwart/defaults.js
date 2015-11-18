/*
  Copyright 2015, Matthew Roe, under MIT license
*/

'use strict';

sW.Module.declare('Defaults');

sW.Module.define('Defaults', function(){
    var __defaults = {};


    this.setDefault = function(func, name, value){
        if (!__defaults[func]){
            __defaults[func] = {}
        }
        __defaults[func][name] = value;
    }

    this.getDefault = function(func, name){
        return __defaults[func][name];
    }
});
