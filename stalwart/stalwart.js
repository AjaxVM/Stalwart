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

sW.Module.__callbacksWaitingForModules = []; //list of [[module_names], callback] waiting for all module_names to load before calling
sW.Module.__afterDefinedTrigger = 'sW.Module.moduleDefined'; //name of the trigger to call after loading a module
sW.Module.__afterAllDefinedTrigger = 'sW.Module.allModulesDefined'; //name of the trigger to call after current queue is emptied

sW.Module.__waitingForDefinition = [];
sW.Module.__includedScripts = [];

sW.Module.get = function(path){
    //takes a . separated path from root to object
    //ie sW.Trigger gives Trigger Module
    var parts = path.split('.');
    var current = sW.Module._loaded_modules;
    $.each(parts, function(index, part){
        current = current[part];
        if (typeof current === 'undefined'){
            return current;
        }
    });
    return current;
}

sW.Module.declareNamespace = function(name){
    var parts = name.split('.');
    var current = sW.Module._loaded_modules;
    $.each(parts, function(index, part){
        if (typeof current[part] === 'undefined'){
            current[part] = {};
        }
        current = current[part];
    });
    return current;
}

sW.Module.isIncluded = function(name){
    return sW.Module.__includedScripts.indexOf(name) > -1;
}
sW.Module.isDefined = function(name){
    return typeof sW.Module.get(name) !== 'undefined';
}

sW.Module.include = function(script_path){
    if (sW.Module.isIncluded(script_path)){
        return false
    }
    sW.Module.__includedScripts.push(script_path);

    var js = document.createElement("script");
    js.type = 'text/javascript';
    js.src = script_path;

    document.head.appendChild(js);

    return true;
}

sW.Module.__callNextDefinition = function(){
    //TODO: go through sW.Module.__waitingForDefiniton and check if necessities are met

    var definitionsCalled = [];

    sW.Module.__waitingForDefinition = $.grep(sW.Module.__waitingForDefinition, function(value){
        var name = value[0];
        var namespace = sW.Module.declareNamespace(name);
        var requires = value[1];
        var definition = value[2];

        if (sW.Module.modulesDefined(requires)){
            definition.call(namespace);
            definitionsCalled.push(name);
            return false;
        }
        return true;
    });

    $.each(definitionsCalled, function(i, value){
        sW.Trigger.fire(sW.Module.__afterDefinedTrigger, value);
    });

    if (sW.Module.__waitingForDefinition.length == 0){
        sW.Trigger.fire(sW.Module.__afterAllDefinedTrigger);
    }
}

//bind a trigger on module load to load the next module if any
sW.Trigger.on(sW.Module.__afterDefinedTrigger, sW.Module.__callNextDefinition);

sW.Module.exeuteDefinition = function(name, definition){
    var namespace = sW.Module.declareNamespace(name);
    definition.call(namespace);
    sW.Trigger.fire(sW.Module.__afterDefinedTrigger, name);
}

sW.Module.define = function(){
    //use to begin defining a module
    //if module name begins with "sW." it will be added to sW namespace
    //Prevents redefinition of module
    var name, requires=[], definition;

    if (arguments.length == 2){
        name = arguments[0];
        definition = arguments[1];
    } else {
        name = arguments[0];
        requires = arguments[1];
        definition = arguments[2];
    }

    //make sure this doesn't exist already
    if (sW.Module.get(name) != undefined){
        throw new Error('Module "'+name+'" declared or loaded already');
    }

    if (sW.Module.modulesDefined(requires)){
        sW.Module.exeuteDefinition(name, definition);
    } else {
        sW.Module.__waitingForDefinition.push([name, requires, definition]);
    }

}

sW.Module.modulesDefined = function(module_names){
    if (typeof module_names === 'string'){
        module_names = [module_names];
    }

    var good = true;
    $.each(module_names, function(i, name){
        if (typeof sW.Module.get(name) === 'undefined'){
            good = false;
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
// sW.Trigger.on(sW.Module.__afterLoadTrigger, function(trigger, module_name){
sW.Trigger.on(sW.Module.__afterDefinedTrigger, function(){
    sW.Module.__callbacksWaitingForModules = $.grep(
        sW.Module.__callbacksWaitingForModules, function(callback){
            if (sW.Module.modulesLoaded(callback[0])){
                callback[1]();
                return false;
            }
            return true;
        }
    );
});

// sW.Module.require = function(module_names){
//     //throw error if not all module_names(string|Array[string]) are loaded
//     if (!sW.Module.modulesLoaded(module_names)){
//         throw new ReferenceError('Module requirements "'+module_names+'" not loaded!');
//     }
// }

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
sW.Trigger.once(sW.Module.__afterAllDefinedTrigger, function(){
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

    // if (!sW.Module.definedModule('sW.Defaults')) sW.Module.include(path+'defaults.js');
    // if (!sW.Module.definedModule('sW.Utils')) sW.Module.include(path+'utils.js');
    // if (!sW.Module.definedModule('sW.Class')) sW.Module.include(path+'class.js');

    if (!sW.Module.get('sW.Defaults')) sW.Module.include(path+'defaults.js');
    if (!sW.Module.get('sW.Utils')) sW.Module.include(path+'utils.js');
    if (!sW.Module.get('sW.Class')) sW.Module.include(path+'class.js');

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
