'use strict';

sW.afterInit(function(){

    QUnit.module('Stalwart.Class tests');

    QUnit.test('Class definition and instantation', function(){
        QUnit.expect(4);
        var testClass = sW.Class.Class('testClass', function(){
            this.init = function(name, age){
                this.something = 45;
                this.name = name;
                this.age = age;

                QUnit.ok(true, 'testClass instantiated');
            }
        });

        var a = new testClass('Bob', 23);
        QUnit.equal(a.name, 'Bob');
        QUnit.equal(a.age, 23);
        QUnit.equal(a.something, 45);
    });

});
