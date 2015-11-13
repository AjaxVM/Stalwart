/*
  Copyright 2015, Matthew Roe, under MIT license
*/


/*
  Root module for Project Stalwart
  This file contians the basic top-level modules that should never be popped out to other files.
  Top-level modules include:
    Module (itself a module of sW - this contains the code necessary to include and define modules)
    Debug (used for debug state and logging things)
    Trigger (used to attach callbacks to trigger event (not element events))
      //TODO: should Trigger also handle document events and throw them all together?
  Top-level functions:
    init (loads the whole shebang - requires jQuery and then loads all the other files)
    onLoad (waits for window.onload to fire before calling callbacks);

  Naming Conventions:
    __var = private/internal variable which should not be exposed directly
            no guarantee is ever made that this will remain consistent between versions
    _var = semi-private variable - this should be safe to reference but shouldn't if avoidable
    __var__ = private member of a Class - should only be used internally of that Class
*/

'use strict';

//require jQuery at the top level
if (!window.jQuery){
    throw new ReferenceError('Stalwart requires you to include jQuery (2.1.4 recommended) first');
}

var sW = {};
sW.version = '0.1';

//handle top level window.onLoad non-sense
sW._windowLoaded = false;
sW.__windowLoadedTrigger = 'sW.windowLoaded';
//triggers using this created after Trigger module below

//TODO: Debug module
sW.Debug = {}

//Create module "Trigger"

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

//trigger callback on window loaded
window.onload = function(){
    sW._windowLoaded = true;
    sW.Trigger.fire(sW.__windowLoadedTrigger);
}
//allow adding things to onLoad
sW.onLoad = function(callback){
    if (sW._windowLoaded){
        callback();
    } else {
        sW.Trigger.once(sW.__windowLoadedTrigger, callback);
    }
}

//End module "Trigger"

//Create module "Module"
sW.Module = {} //namespace for Module module
sW.Module._loaded_modules = {}; //list of loaded module_name:module_namespace
//define sW as a module of itself for reference
//this also puts Trigger and Debug modules into the list
sW.Module._loaded_modules['sW'] = sW;
//throw in the Trigger and Debug modules since th
sW.Module._loadingModule = null; //null or name of module being loaded presently
sW.Module.__queuedModules = []; //list of [module_name, module_path] waiting to be loaded
sW.Module.__callbacksWaitingForModules = []; //list of [[module_names], callback] waiting for all module_names to load before calling
sW.Module.__afterLoadTrigger = 'sW.Module.moduleLoaded'; //name of the trigger to call after loading a module
sW.Module.__afterAllLoadTrigger = 'sW.Module.allModulesLoaded'; //name of the trigger to call after current queue is emptied

sW.Module.pathToModule = function(path){
    var parts = path.split('.');
    var current = sW.Module._loaded_modules;
    $.each(parts, function(index, part){
        current = current[part];
    });
    return current;
}

sW.Module.loadingModule = function(name){
    //If name is provided, return whether name is currently loading or waiting for load
    //if not name, return if any modules are being loaded or queued for loading
    if (name){
        return sW.Module._loadingModule == name || sW.Module.__queuedModules.indexOf(name) > -1;
    }
    return sW.Module._loadingModule != null || sW.Module.__queuedModules.length > 0;
}

sW.Module.definedModule = function(name){
    //returns whether module "name" is either loaded or being loaded
    // return sW.Module._loaded_modules[name] != undefined || sW.Module.loadingModule(name);
    return typeof sW.Module.pathToModule(name) != 'undefined' || sW.Module.loadingModule(name);
}

sW.Module.get = function(name){
    //return namespace for module "name" or undefined if it is loaded
    //first ensure this isn't loading, and thus partially _loaded_modules[name]
    if (!sW.Module.loadingModule(name)){
        // if (name.indexOf('sW.') == 0){
        //     return sW[name.replace('sW.', '')];
        // } else {
        //     return sW.Module._loaded_modules[name];
        // }
        return sW.Module.pathToModule(name);
    }
}

sW.Module.injectScript = function(script_path){
    //sW._loadingModule = name;
    var js = document.createElement("script");
    js.type = 'text/javascript';
    js.src = script_path;

    document.head.appendChild(js);
}

sW.Module.include = function(script_path){
    //load module "name" from src "script_path"
    //if nothing else is loaded, this is loaded immediately
    //otherwise it will be added to the end of the queue

    if (sW.Module.definedModule(name)){
        throw new ReferenceError('Module "'+name+'" already included');
    }

    if (!sW.Module.loadingModule()){
        //nothing loading or queued, fire this off!
        sW.Module.injectScript(script_path);
    } else {
        sW.Module.__queuedModules.push(script_path);
    }
}

sW.Module.includeNext = function(script_path){
    //works the same as include, except pushes this scrip to the top fo the queue instead of the end
    if (sW.Module.definedModule(name)){
        throw new ReferenceError('Module "'+name+'" already included');
    }

    if (!sW.Module.loadingModule()){
        //nothing loading or queued, fire this off!
        sW.Module.injectScript(script_path);
    } else {
        sW.Module.__queuedModules.unshift(script_path);
    }
}

sW.Module.injectNextModule = function(){
    if (sW.Module.__queuedModules.length){
        var cur = sW.Module.__queuedModules.shift();
        sW.Module.injectScript(cur);
    } else {
        sW.Trigger.fire(sW.Module.__afterAllLoadTrigger);
    }
}

//bind a trigger on module load to load the next module if any
sW.Trigger.on(sW.Module.__afterLoadTrigger, sW.Module.injectNextModule);

sW.Module.define = function(name, definition){
    //use to begin defining a module
    //if module name begins with "sW." it will be added to sW namespace
    //Prevents redefinition of module

    //make sure this doesn't exist already
    if (sW.Module.get(name) != undefined){
        throw new Error('Module "'+name+'" declared or loaded already');
    }

    var namespace = {};
    //check if this is declaring itself a sW module
    if (name.indexOf('sW.') == 0){
        sW[name.replace('sW.', '')] = namespace;
    } else {
        sW.Module._loaded_modules[name] = namespace;
    }

    sW.Module._loadingModule = name;

    definition.call(namespace);

    sW.Module.defined(name);
}

sW.Module.defined = function(name){
    //declare that module is finished loading
    //should run checks if another module is queued
    //and should execute any callbacks waiting for loaded modules if all met

    if (name != sW.Module._loadingModule){
        throw new ReferenceError('Module "'+sW.module._loadingModule+'" was loading, but Module "'+name+'" is finishing!');
    }

    sW.Module._loadingModule = null;
    sW.Trigger.fire(sW.Module.__afterLoadTrigger, name);
}

sW.Module.modulesLoaded = function(module_names){
    if (typeof module_names == 'string'){
        module_names = [module_names];
    }

    var good = true;
    $.each(module_names, function(i, name){
        // if (sW.Module._loaded_modules[name]
        // if (!sW.Module.loadingModule(name)){
        //     return sW.Module._loaded_modules[name]
        // }
        if (sW.Module.loadingModule(name)){
            good = false;
        }

        if (name.indexOf('sW.') > -1){
            if (typeof sW[name.slice(3,name.length)] == 'undefined'){
                good = false;
            }
        } else {
            if (typeof sW.Module._loaded_modules[name] == 'undefined'){
                good = false;
            }
        }
    });

    return good;
}

sW.Module.afterInclude = function(module_names, callback){
    //fire callback if module_names already loaded, otherwise wait for them all
    if (sW.Module.modulesLoaded(module_names)){
        callback();
    } else {
        sW.Module.__callbacksWaitingForModules.push([module_names, callback]);
    }
}

//setup trigger to call when modules are loaded to check if anything needs to be executed that was waiting on them
sW.Trigger.on(sW.Module.__afterLoadTrigger, function(trigger, module_name){
    sW.Module.__callbacksWaitingForModules = $.grep(
        sW.Module.__callbacksWaitingForModules, function(callback, i){
            if (sW.Module.modulesLoaded(callback[0])){
                callback[1]();
                return false;
            }
            return true;
        }
    );
});

sW.Module.require = function(module_names){
    //throw error if not all module_names(string|Array[string]) are loaded
    if (!sW.Module.modulesLoaded(module_names)){
        throw new ReferenceError('Module requirements "'+module_names+'" not loaded!');
    }
}

//TODO: sW.Module.requireOrInclude - if not already included loads it - this requires us waiting for it to load which is wonky

//End module "Module"

sW.rootPath = function(){
    //Returns the path to the stalwart.js file from the script src attribute
    //this will try to match to the stalwart.js name
    //if the script is named something else, the stalwart attribute *must* be added - and cannot by used anywhere else
    var path = $("script[src$='/stalwart.js'],script[src='stalwart.js'],script[stalwart]").first().attr('src');
    if (!path){
        throw new Error('Cannot find Stalwart script path!');
    }
    var pathparts = path.split('/');
    pathparts.pop(); //remove last bit
    path = pathparts.join('/');
    return path ? path + '/' : '';
}

sW.__afterFullLoadTrigger = 'sW.loadedAndIncluded';
sW.__afterInitTrigger = 'sW.initFinished';
sW.finishedInit = false;

//set up triggers to figure out when window loaded and all modules are loaded
sW.Trigger.once(sW.Module.__afterAllLoadTrigger, function(){
    //first check if window loaded already - if it is we know both finished
    if (sW._windowLoaded){
        sW.Trigger.fire(sW.__afterFullLoadTrigger);
    } else {
        //window not loaded so let's assign a callback to that event since modules are done
        sW.Trigger.once(sW.__windowLoadedTrigger, function(){
            sW.Trigger.fire(sW.__afterFullLoadTrigger);
        });
    }
});

sW.init = function(){
    //if we have two arguments, they are prereqs([[module_name,script_path]..]),callback
    //if we have only one, figure out if string/array or assume callback

    var userPrereqs = [];
    var userCallback = [];

    if (arguments.length == 1){
        var arg = arguments[0];
        if ($.isArray(arg)){
            userPrereqs = arg;
        } else {
            userCallback = arg;
        }
    } else if (arguments.length == 2){
        userPrereqs = arguments[0];
        userCallback = arguments[1];
    }

    var path = sW.rootPath();

    if (!sW.Module.definedModule('sW.Defaults')) sW.Module.include(path+'defaults.js');
    if (!sW.Module.definedModule('sW.Utils')) sW.Module.include(path+'utils.js');
    if (!sW.Module.definedModule('sW.Class')) sW.Module.include(path+'class.js');

    $.each(userPrereqs, function(i, req){
        sW.Module.include(req);
    });

    if (userCallback){
        sW.Trigger.once(sW.__afterFullLoadTrigger, function(){
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
