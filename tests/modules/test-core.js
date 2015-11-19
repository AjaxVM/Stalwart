'use strict';

QUnit.module('Stalwart Core');

QUnit.test('Version is correct', function(){
    QUnit.equal(sW.version, '0.1');
    tested('sW.version');
});

sW.onInit(function(){
    QUnit.test('onInit callback called', function(){
        QUnit.ok(true, 'Called');
        tested('sW.onInit');
    });
});

sW.afterInit(function(){

    QUnit.test('afterInit called after init', function(){
        QUnit.equal(sW.finishedInit, true);
        tested('sW.afterInit', 'sW.finishedInit');
    });

    QUnit.test('Module definition works', function(){
        QUnit.expect(5);
        var myModule = {};

        sW.Module(myModule, function(namespace){
            QUnit.equal(this, namespace);

            var private_var = 1234;
            this.public_var = 5678;
            namespace.something = 'abcd';
        });

        QUnit.equal(myModule.private_var, undefined);
        QUnit.equal(myModule.public_var, 5678);
        QUnit.equal(myModule.something, 'abcd');
        QUnit.equal(Object.keys(myModule).length, 2);
        tested('sW.Module');
    });

});
