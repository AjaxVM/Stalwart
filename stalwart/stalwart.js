/*
  Copyright 2015, Matthew Roe

  License is given to freely modify and redistribute this code,
  so long as credit is given to this project.
*/

/*
  Root "Init" module for Stalwart.
  This file contains any "top-level" code necessary to get everything else running.
  This file should only ever contain raw Javascript.
  This file is responsible for the all important "init" and "run" functions,
  which should first enforce any toplevel requirements are met (such as jquery).
  It should then load all child scripts, which should be free to use jQuery or other required libraries.

  This works to include files
*/

var sW = {};
sW.version = '0.1';
sW.__modules = {};
sW.__loadingModule = false;
sW.__loadingModuleCurrent = null;
sW.__queuedModules = [];
// sW.__needRun = false;
// sW.__runCallback = null;
sW.__callbacksWaitingForFullLoad = [];
sW.__windowLoaded = false;
sW.debugLog = false;
sW.__debugLogMaps = {
    'log': 'Debug',
    'warn': 'Warning',
    'error': 'Error'}

sW.__debug = function(value, type){
    type = type || 'log';
    var start = sW.__debugLogMaps[type];
    if (type != 'log' || sW.debugLog){
        console[type](start+': '+value);
    }
}

sW.module = function(name){
    //Define a Stalwart "Module"
    //If name starts with "sW." it will be added to the global sW namespace
    //Otherwise, it is always available from sW.getModule
    //Prevents redefinition of module
    if (typeof sW.__modules[name] == 'undefined'){
        sW.__modules[name] = {};
    } else {
        throw new ReferenceError('Stalwart module "' + name + '" already loaded!');
    }

    if (name.indexOf('sW.') == 0){
        //this is being add as a namespace to sW!
        var newname = name.replace('sW.', '');
        sW[newname] = {}
        sW.__modules[name] = sW[newname];
    }
}

sW.getModule = function(name){
    //Return the namespace for a module
    return sW.__modules[name];
}

sW.__injectModule = function(module_name, script){
    sW.__debug('Stalwart Module "'+module_name+'" loading');
    sW.__loadingModuleCurrent = module_name;
    var js = document.createElement("script");
    js.type = 'text/javascript';
    js.src = script;
    //TODO: is it safe to check this even in IE?
    //js.async = false;

    document.head.appendChild(js);
}

sW.loadingModule = function(module_name){
    if (!module_name){
        return (sW.__queuedModules.length > 0 || sW.__loadingModule);
    } else {
        return (sW.__queuedModules.indexOf(module_name) > -1 || sW.__loadingModuleCurrent == module_name);
    }
}

sW.__executeWaitingCallbacks = function(){
    for (var i=0; i<sW.__callbacksWaitingForFullLoad.length; i++){
        sW.__callbacksWaitingForFullLoad[i]();
    }

    sW.__callbacksWaitingForFullLoad = [];
}

sW.onFullLoad = function(callback){
    if (sW.__windowLoaded && !sW.loadingModule()){
        callback();
    } else {
        sW.__callbacksWaitingForFullLoad.push(callback);
    }
}

sW.include = function(module_name, script){
    //Tries to load the given module script with name
    //If module is already present will silently fail (allowing minification)
    if (!(sW.__modules[module_name] || sW.loadingModule(module_name))){
        //if we have something being loaded, wait
        if (sW.__loadingModule){
            sW.__queuedModules.push([module_name, script]);
        } else {
            sW.__loadingModule = true;
            sW.__injectModule(module_name, script);
        }
    } else {
        sW.__debug('Stalwart Module "'+module_name+'" already loaded', 'warn');
    }
}

sW.endModule = function(name){
    //module name is finished, check if we have any waiting modules or runs that are needed
    sW.__debug('Stalwart Module "'+name+'" loaded!');
    sW.__loadingModule = false;

    if (sW.__queuedModules.length){
        //sW.__loadingModule is now false so include will allow execution
        var mod = sW.__queuedModules.shift();
        sW.include(mod[0], mod[1]);
    } else if (sW.__windowLoaded) {
        sW.__executeWaitingCallbacks();
        // sW.__needRun = false;
        // sW.__runCallback();
    }
}


sW.require = function(req){
    //Throws an error if req is not found
    //Will check if req is a loaded module, otherwise it checks on the window namespace
    //Will safely check sub-variables:
    //    sW.require("library.variable") - evaluates to window.library.variable

    if (name.indexOf('sW.') == 0){
        // //wait if this is loading
        // while (sW.__loadingModules.indexOf(req) > -1){
        //     console.log('.');
        // }
        if (typeof sW.__modules[req] != undefined){
            return true; //loaded as module
        }
    }

    var keys = req.split('.');
    var cur = window;
    for (var i=0; i<keys.length; i++){
        cur = cur[keys[i]];
        if (typeof cur == 'undefined'){
            throw new ReferenceError('Stalwart requirement "' + req + '" not found!');
        }
    }
    return true;
}

sW.rootPath = function(){
    //Returns the path to the stalwart.js file from the script src attribute
    var script = $("script[src$='stalwart.js']");
    var path = script.attr('src').replace('stalwart.js', '');
    return path.charAt(path.length-1)=='/' ? path : path + '/';
}

sW.init = function(){
    //Checks core requirements and loads core modules
    //also will execute callback (optional second or only arg) after page has loaded and all dependencies are loaded
    //prereqs (optional first arg - Array) is an Array of [module_name, path] values to include before running

    //TODO: wait for modules to all load before allowing sW.run to execute
    //This appears to be working - but needs to be confirmed!

    if (arguments.length==1){
        var callback = arguments[0];
    } else if (arguments.length == 2){
        var prereqs = arguments[0];
        var callback = arguments[1];
    }

    //ensure requirements are present, and load our modules
    sW.require('jQuery');

    //grab our source directory
    var path = sW.rootPath();

    //TODO: make include check if anything else is being included
    //if nothing, inject and set as currently loading
    //if something is there, push to loadingModules
    //on completion of load check if anything is added to loading, remove top and load it

    sW.include('sW.Defaults', path+'defaults.js');
    sW.include('sW.Utils', path+'utils.js');
    sW.include('sW.Class', path+'class.js');

    if (prereqs){
        for (var i=0; i<prereqs.length; i++){
            sW.include(prereqs[i][0], prereqs[i][1]);
        }
    }

    // sW.__runCallback = callback;
    // sW.__needRun = false;

    //window.onload = callback;

    window.onload = function(){
        sW.__windowLoaded = true;
        if (!sW.loadingModule()){
            sW.__executeWaitingCallbacks();
            callback();
        } else if (callback){
            sW.onFullLoad(callback);
        }
        // if (sW.__loadingModule){
        //     //sW.__needRun = true;
        //     sW.__callbacksWaitingForFullLoad.push(callback);
        // } else {
        //     sW.__runCallback();
        // }
    }
}
