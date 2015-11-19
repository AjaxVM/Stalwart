'use strict';

sW.afterInit(function(){

    QUnit.module('Stalwart Trigger tests');

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

        QUnit.equal(sW.Trigger.watching().length, 3);

        sW.Trigger.off('testTrigger');
        QUnit.equal(sW.Trigger.watching().length, 2);

        sW.Trigger.off('testTrigger2', testFunc);
        QUnit.equal(sW.Trigger.watching().length, 1);

        sW.Trigger.off();
        QUnit.equal(sW.Trigger.watching().length, 0);
    });
});
