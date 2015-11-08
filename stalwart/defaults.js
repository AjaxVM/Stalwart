/*
  Copyright 2015, Matthew Roe, under MIT license
*/


sW.Module.define('sW.Defaults');

sW.Defaults.__defaults = {};


sW.Defaults.setDefault = function(func, name, value){
    if (!sW.Defaults.__defaults[func]){
        sW.Defaults.__defaults[func] = {}
    }
    sW.Defaults.__defaults[func][name] = value;
}

sW.Defaults.getDefaults = function(func){
    return sW.Defaults.__defaults[func];
}

sW.Defaults.getDefault = function(func, name){
    return sW.Defaults.__defaults[func][name];
}

sW.Module.defined('sW.Defaults');
