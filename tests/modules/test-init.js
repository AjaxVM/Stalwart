'use strict';

QUnit.module('Stalwart Init tests');

sW.onInit(function(){
    QUnit.test('onInit callback called', function(){
        QUnit.ok(true, 'Called');
    });
});

sW.afterInit(function(){

    QUnit.test('afterInit called after init', function(){
        QUnit.equal(sW.finishedInit, true);
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
    });

});
