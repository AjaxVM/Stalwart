'use strict';

QUnit.module('Stalwart Init tests');

sW.onInit(function(){
    QUnit.test('Init callback called', function(){
        QUnit.ok(true, 'Called');
    });
});

sW.afterInit(function(){

    QUnit.test('afterInit called after init', function(){
        QUnit.equal(sW.finishedInit, true);
    });

});
