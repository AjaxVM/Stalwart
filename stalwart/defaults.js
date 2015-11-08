/*
  Copyright 2015, Matthew Roe, under MIT license
*/


sW.Module.define('sW.Defaults', function(){
    this.__defaults = {};


    this.setDefault = function(func, name, value){
        if (!sW.Defaults.__defaults[func]){
            sW.Defaults.__defaults[func] = {}
        }
        sW.Defaults.__defaults[func][name] = value;
    }

    this.getDefaults = function(func){
        return sW.Defaults.__defaults[func];
    }

    this.getDefault = function(func, name){
        return sW.Defaults.__defaults[func][name];
    }
});
