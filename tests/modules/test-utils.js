'use strict';

sW.afterInit(function(){

    QUnit.module('Stalwart Utils tests');

    QUnit.test('Utils.sleepFor blocks', function(){
        var now = new Date().getTime();

        sW.Utils.sleepFor(100);

        QUnit.ok(new Date().getTime()-now >= 100);
    });

    QUnit.test('Utils.capitalize', function(){
        QUnit.equal(sW.Utils.capitalize('a jolly man'), 'A jolly man'); 
        QUnit.equal(sW.Utils.capitalize('DOG'), 'DOG');
        QUnit.equal(sW.Utils.capitalize('cAT'), 'CAT');
    });

    QUnit.test('Utils.removeFrom', function(){
        var test = [1,2,3,4,5,6,7,8,9];

        sW.Utils.removeFrom(test, 7);
        QUnit.equal(test.length, 8);

        QUnit.equal(test.indexOf(7), -1);

        sW.Utils.removeFrom(test, 7);
        QUnit.equal(test.length, 8);
    });

    QUnit.test('Utils.forEach', function(){
        var values = [1,1,2,3,5,8,13,21];

        var nextIndex = 0;
        sW.Utils.forEach(values, function(value, index){
            QUnit.equal(index, nextIndex);
            nextIndex++;
            QUnit.equal(value, values[index]);
        });
        QUnit.equal(nextIndex, values.length);

        var person = {
            name: 'John Doe',
            age: 45,
            height: 5.5,
            weight: 150,
            eyes: 'Blue'
        };


        var nextIndex = 0;
        sW.Utils.forEach(person, function(key, value, index){
            QUnit.equal(index, nextIndex);
            nextIndex++;
            QUnit.equal(value, person[key]);
            delete person[key];
        });
        QUnit.equal(Object.keys(person).length, 0);
    });

    QUnit.test('Utils.replaceAll', function(){

        var string = 'Roses are red, Violets are blue, I like red, but not blue';

        //ensure that replacing with itself doesn't cause issues
        QUnit.equal(sW.Utils.replaceAll(string, 'red', 'red'), string);

        //make sure all instances are replaced
        QUnit.equal(sW.Utils.replaceAll(string, 'red', 'purple'),
                    'Roses are purple, Violets are blue, I like purple, but not blue');
    });

    QUnit.test('Utils.formatString', function(){

        //test format with single arg and default sep
        QUnit.equal(sW.Utils.formatString('Dogs have "{}+{}" legs', 2), 'Dogs have "2+2" legs');

        //test format with array args and default sep
        QUnit.equal(sW.Utils.formatString('Roses are {0}, Violets are {1} and {0}ish', ['red', 'blue']),
                    'Roses are red, Violets are blue and redish');

        //test format with hash args and default sep
        QUnit.equal(
            sW.Utils.formatString(
                'My name is {name}, I live at {address}. "{name}" is the best name',
                {name: 'Johhny', address: '1234 Made-up Lane', age: 5}
                ),
            'My name is Johhny, I live at 1234 Made-up Lane. "Johhny" is the best name'
        );

        //repeat above tests but with defined separator
        QUnit.equal(sW.Utils.formatString('Dogs have "<>+<>" legs', 2, '<,>'), 'Dogs have "2+2" legs');
        QUnit.equal(sW.Utils.formatString('Roses are >0<, Violets are >1< and >0<ish', ['red', 'blue'], '>,<'),
                    'Roses are red, Violets are blue and redish');
        QUnit.equal(
            sW.Utils.formatString(
                'My name is [[name]], I live at [[address]]. "[[name]]" is the best name',
                {name: 'Johhny', address: '1234 Made-up Lane', age: 5},
                '[[,]]'),
            'My name is Johhny, I live at 1234 Made-up Lane. "Johhny" is the best name'
        );

        //repeat same tests but change default separator
        sW.Utils.formatString.default_separator = '{{,}}';
        QUnit.equal(sW.Utils.formatString('Dogs have "{{}}+{{}}" legs', 2), 'Dogs have "2+2" legs');
        QUnit.equal(sW.Utils.formatString('Roses are {{0}}, Violets are {{1}} and {{0}}ish', ['red', 'blue']), 'Roses are red, Violets are blue and redish');
        QUnit.equal(
            sW.Utils.formatString(
                'My name is {{name}}, I live at {{address}}. "{{name}}" is the best name',
                {name: 'Johhny', address: '1234 Made-up Lane', age: 5}
                ),
            'My name is Johhny, I live at 1234 Made-up Lane. "Johhny" is the best name'
        );
    });

});
