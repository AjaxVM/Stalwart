/*
  Copyright 2015, Matthew Roe, under MIT license
*/


sW.Module.define('sW.Defaults', function(_){
    _.__defaults = {};


    _.setDefault = function(func, name, value){
        if (!sW.Defaults.__defaults[func]){
            sW.Defaults.__defaults[func] = {}
        }
        sW.Defaults.__defaults[func][name] = value;
    }

    _.getDefaults = function(func){
        return sW.Defaults.__defaults[func];
    }

    _.getDefault = function(func, name){
        return sW.Defaults.__defaults[func][name];
    }
});
