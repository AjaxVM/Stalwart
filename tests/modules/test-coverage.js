

// track all of the public members of sW and children
var sWNeedingTests = [];

//declare a member of sW/Children to be covered in a test
function tested(){
    for (var i=0; i<arguments.length; i++){
        var ind = sWNeedingTests.indexOf(arguments[i]);
        if (ind > -1){
          sWNeedingTests.splice(ind, 1);
        }
    }
}

//Collect all members of sW (or children)
function collectChildren(name, obj, parent){
    var myName = parent? parent+'.'+name : name;
    var objKeys = Object.keys(obj);
    for (var i=0;i<objKeys.length;i++){
        var key = objKeys[i];
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])){
            collectChildren(key, obj[key], myName);
        } else {
            sWNeedingTests.push(myName+'.'+key);
        }
    }
}
collectChildren('sW', sW);

var sWFinishedModules = [];

//run this test after all others finish
QUnit.moduleDone(function(obj){
    if (sWFinishedModules.indexOf(obj.name) > -1){
        return; //break so we don't infinitely loop
    }
    sWFinishedModules.push(obj.name);

    var good = true;
    $.each(sWAllModules, function(j, n){
        if (sWFinishedModules.indexOf(n) == -1){
            good = false;
        }
    });

    if (good){
        QUnit.module('Overall Test Coverage');
        QUnit.test('Coverage of all members of sW objects/functions', function(){
            QUnit.ok(sWNeedingTests.length === 0, 'sW Members Requiring Tests ('+sWNeedingTests.length+'): "'+sWNeedingTests+'"');
            sWFinishedModules.push('Overall Test Coverage'); //prevent refiring
        });
    }
});
