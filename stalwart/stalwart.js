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

sW.require = function(req){
    //Throws an error if req is not found
    //Will check if req is a loaded module, otherwise it checks on the window namespace
    //Will safely check sub-variables:
    //    sW.require("library.variable") - evaluates to window.library.variable
    if (name.indexOf('sW.') == 0){
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

sW.include = function(module_name, script){
    //Tries to load the given module script with name
    //If module is already present will silently fail (allowing minification)
    if (!sW.__modules[module_name]){
        var js = document.createElement("script");
        js.type = 'text/javascript';
        js.src = script;

        document.head.appendChild(js);
    }
}

sW.rootPath = function(){
    //Returns the path to the stalwart.js file from the script src attribute
    var script = $("script[src$='stalwart.js']");
    var path = script.attr('src').replace('stalwart.js', '');
    return path.charAt(path.length-1)=='/' ? path : path + '/';
}

sW.init = function(){
    //Checks core requirements and loads core modules

    //TODO: wait for modules to all load before allowing sW.run to execute
    //This appears to be working - but needs to be confirmed!

    //ensure requirements are present, and load our modules
    sW.require('jQuery');

    //grab our source directory
    var path = sW.rootPath();

    sW.include('sW.Defaults', path+'defaults.js');
    sW.include('sW.Utils', path+'utils.js');
    sW.include('sW.Class', path+'class.js');
    sW.include('sW.Test', path+'test.js');
}

sW.run = function(callback){
    //Attaches callback to window.onload

    window.onload = callback;
}
