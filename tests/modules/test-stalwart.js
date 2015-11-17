'use strict';

sW.init(function(){

    QUnit.module('Stalwart Core (Debug, Trigger, Module, and Init) tests');

    QUnit.test('Window Loaded', function(){
        //init is firing callback - so window must be loaded
        QUnit.equal(sW._windowLoaded, true);
    });

    QUnit.test('Core Modules Loaded', function(){
        //init is firing callback so core modules must all be loaded
        //also, check that modulesLoaded works with singleton or array
        // QUnit.equal(sW.Module.modulesLoaded('sW.Debug'), true);
        // QUnit.equal(sW.Module.modulesLoaded(['sW.Trigger',
        //                                'sW.Module',
        //                                'sW.Defaults',
        //                                'sW.Utils',
        //                                'sW.Class']), true);

        QUnit.equal(sW.Module.modulesDefined('sW.Debug'), true);
        QUnit.equal(sW.Module.modulesDefined(['sW.Trigger',
                                              'sW.Module',
                                              'sW.Defaults',
                                              'sW.Utils',
                                              'sW.Class']), true);
    });

    //this test won't work since the error is thrown outside of the function :/
    // QUnit.test('Should not load non-existant module', function(){
    //     QUnit.raises(function(){sW.Module.include('someBadModule.js')});
    // });

    QUnit.test('Ensure Module is accessible', function(){
        QUnit.equal(sW.Module.get('sW.Class'), sW.Class);
    });

    // QUnit.test('Module.require works', function(){
    //     try {
    //         sW.Module.require('sW.Class');
    //         QUnit.ok(true, 'passed');
    //     } catch(e) {
    //         QUnit.ok(false, 'An exception was thrown: '+e);
    //     }

    //     QUnit.raises(function(){sW.Module.require('nonExistantModule')});
    // });

    QUnit.test('Trigger.once only fires once', function(){
        QUnit.expect(2);
        sW.Trigger.once('testTrigger', function(value, trigger){
            //this should only activate on first fire, will throw nonOk if second is called
            QUnit.equal(value, 'testValue');
            QUnit.equal(trigger, 'testTrigger');
        });

        sW.Trigger.fire('testTrigger', 'testValue');
        sW.Trigger.fire('testTrigger', 'anotherTestValue');
    });

    QUnit.test('Trigger.on fires twice', function(){
        QUnit.expect(4);
        sW.Trigger.on('testTrigger', function(value, trigger){
            //this should activate on both fire events, and grab both values
            QUnit.ok(value == 'testValue' || value == 'anotherTestValue');
            QUnit.equal(trigger, 'testTrigger');
        });

        sW.Trigger.fire('testTrigger', 'testValue');
        sW.Trigger.fire('testTrigger', 'anotherTestValue');
    });

    QUnit.test('Trigger.off cleanup', function(){
        //create a few more on/once bindings to clean up
        //initially clear all events
        sW.Trigger.off();
        QUnit.equal(sW.Trigger.watching().length, 0);

        var testFunc = function(){
            return null;
        }
        sW.Trigger.on('testTrigger', function(){});
        sW.Trigger.once('testTrigger2', testFunc);
        sW.Trigger.on('testTrigger3', function(){});

        //shoud be 3 - one from last test and two from this

        QUnit.equal(sW.Trigger.watching().length, 3);

        sW.Trigger.off('testTrigger');
        QUnit.equal(sW.Trigger.watching().length, 2);

        sW.Trigger.off('testTrigger2', testFunc);
        QUnit.equal(sW.Trigger.watching().length, 1);

        sW.Trigger.off();
        QUnit.equal(sW.Trigger.watching().length, 0);
    });

    sW.Module.define('testModule', function(){
        this.testVar = 45;
    });

    QUnit.test('Module Definition', function(){
        QUnit.equal(sW.testModule, undefined);
        var testModule = sW.Module.get('testModule');
        QUnit.equal(testModule.testVar, 45);
    });

});
