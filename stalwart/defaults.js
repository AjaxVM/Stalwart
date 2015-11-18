/*
  Copyright 2015, Matthew Roe, under MIT license
*/


'use strict';


//Module "Defaults"
sW.Defaults = {};
sW.Defaults.__defaults = {};

sW.Defaults.setDefault = function(func, name, value){
    if (!sW.Defaults.__defaults[func]){
        sW.Defaults.__defaults[func] = {}
    }
    sW.Defaults.__defaults[func][name] = value;
}

sW.Defaults.getDefault = function(func, name){
    return sW.Defaults.__defaults[func][name];
}
//End "Defaults"