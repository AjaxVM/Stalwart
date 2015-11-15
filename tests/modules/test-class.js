'use strict';

sW.afterInit(function(){

    QUnit.module('Stalwart.Class tests');

    QUnit.test('Class definition and instantation', function(){
        QUnit.expect(5);
        var testClass = sW.Class.Class('testClass', function(){
            this.__init__ = function(name, age){
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
        QUnit.ok(a.instanceOf(testClass), 'This is an instanceOf testClass');
    });

    QUnit.test('Diamond Inheritance', function(){
        QUnit.expect(4);

        var Level1 = sW.Class.Class('Level1', function(){});
        var Level2a = sW.Class.Class('Level2a', [Level1], function(){});
        var Level2b = sW.Class.Class('Level2b', [Level1], function(){});
        var Level3 = sW.Class.Class('Level3', [Level2a, Level2b], function(){});

        var test = new Level3();

        QUnit.equal(test.instanceOf(Level1), true);
        QUnit.equal(test.instanceOf(Level2a), true);
        QUnit.equal(test.instanceOf(Level2b), true);
        QUnit.equal(test.instanceOf(Level3), true);
    });

    QUnit.test('Class attribute exposing/setting', function(){
        QUnit.expect(3);

        var testClass = sW.Class.Class('testClass', function(){
            this.__public__ = ['age'];

            this.__setAttr__ = function(attr, value){
                //this only fires for age, so we should equal expected 3 tests
                QUnit.ok(true, 'setAttr');
                this.__setExposed__(attr, value+' psych!');
            }
        });

        var a = new testClass();

        a.age = 23;
        a.name = 'John Doe';

        QUnit.equal(a.age, '23 psych!');
        QUnit.equal(a.name, 'John Doe');
    });

    QUnit.test('Class Inheritance', function(){
        var Animal = sW.Class.Class('Animal', function(){
            this.__init__ = function(animalType, lifespan, sex){
                this.animalType = animalType;
                this.lifespan = lifespan;
                this.sex = sex;

                this.age = 1;
                this.alive = true;
                this.happiness = 50;
                this.hunger = 0;

                this.deathReason = null;
            }

            this.die = function(reason){
                this.alive = false;
                if (reason){
                    this.deathReason = animalType+' died because of: '+reason;
                }
            }

            this.haveABirthday = function(){
                this.age += 1;
                if (this.age > this.lifespan){
                    this.die('Old Age');
                }
            }

            this.makeHungry = function(amount){
                this.hunger += amount;
                if (this.hunger >= 10){
                    this.hunger = 10;
                    this.die('Hungry');
                }
            }

            this.makeHappy = function(amount){
                this.happiness += amount;
                if (this.happiness > 100){
                    this.happiness = 100;
                }
                if (this.happiness < 0){
                    this.happiness = 0;
                    this.die('Sadness');
                }
            }
        });

        var Dog = sW.Class.Class('Dog', [Animal], function(){
            this.__init__ = function(name, sex){
                //this.__super('Animal.init', ['Canine', 15, sex]);
                Animal.prototype.__init__.call(this, 'Canine', 15, sex);
                this.name = name;
            }

            this.die = function(reason){
                //this.__super('Animal.die');
                Animal.prototype.die.call(this);
                if (reason){
                    this.deathReason = this.name+' (Dog) died because of: '+reason;
                }
            }

            this.playFetch = function(hours){
                this.makeHappy(5*hours);
                this.makeHungry(Math.floor(hours*0.5));
            }
        });

        var Cat = sW.Class.Class('Cat', [Animal], function(){
            this.__init__ = function(name, sex){
                //this.__super('Animal.init', ['Feline', 20, sex]);
                Animal.prototype.__init__.call(this, Feline, 20, sex);
                this.name = name;
                this.bored = 0;
            }

            this.die = function(reason){
                //this.__super('Animal.die');
                Animal.prototype.die.call(this);
                if (reason){
                    this.deathReason = this.name+' (Cat) died because of: '+reason;
                }
            }

            this.chaseAMouse = function(hours){
                this.makeHappy(20*hours);
                this.makeHungry(hours);
                this.bored += hours * 2;
                if (this.bored >= 10){
                    this.die('Boredom');
                }
            }
        });

        var CatDog = sW.Class.Class('CatDog', [Cat, Dog], function(){
            this.__init__ = function(name, sex){
                //only calling super on Animal to test it, and so we don't call it 3 times (if we super all inits)
                //this.__super('Animal.init', ['CatDog', 15, sex]);
                Animal.prototype.__init__.call(this, 'CatDog', 15, sex);
                this.name = name;
                this.bored = 0;
            }
        });

        var myPuppy = new Dog('Jake', 'male');
        myPuppy.age = 15; //old puppy

        //1,2)
        QUnit.equal(myPuppy.animalType, 'Canine');
        myPuppy.haveABirthday();
        QUnit.equal(myPuppy.alive, false);

        //3,4,5)
        QUnit.ok(myPuppy.instanceOf(Dog));
        QUnit.ok(myPuppy.instanceOf(Animal));
        QUnit.equal(myPuppy.instanceOf(Cat), false);

        //6,7)
        var myCatDog = new CatDog('Weirdo', 1);
        QUnit.ok(myCatDog.instanceOf(Dog));
        QUnit.ok(myCatDog.instanceOf(Cat));

        //8,9,10)
        myCatDog.playFetch(10000);
        QUnit.equal(myCatDog.happiness, 100);
        QUnit.equal(myCatDog.alive, false);
        QUnit.equal(myCatDog.deathReason, 'Weirdo (Dog) died because of: Hungry');

        myCatDog.alive = true;
        myCatDog.deathReason = null;
        myCatDog.hunger = 0;
        myCatDog.happiness = 50;

        //11,12,13,14,15)
        myCatDog.chaseAMouse(2);
        QUnit.equal(myCatDog.happiness, 90);
        QUnit.equal(myCatDog.hunger, 2);
        QUnit.equal(myCatDog.bored, 4);
        myCatDog.chaseAMouse(5);
        QUnit.equal(myCatDog.alive, false);
        //this is slightly unexpected, but works, basically Dog is inherited after Cat
        //this leads to chaseAMouse (from Cat) referencing die (from Dog)
        //this could be changed to redefine die as function(reason){this.__super('Cat.die', [reason]);}
        QUnit.equal(myCatDog.deathReason, 'Weirdo (Dog) died because of: Boredom');
    });

    QUnit.test('Class instantation time compare', function(){
        var Dog = sW.Class.Class('Dog', function(){
            this.init = function(age){
                this.age = age;
                this.name = 'Jake';
                this.happy = false;
            }

            this.playFetch = function(){
                this.happy = true;
            }
        });

        QUnit.ok(true, 'Dog defined');

        var ProtoDog = function(age){
            this.age = age;
            this.name = 'ProtoJake';
        }
        ProtoDog.prototype.playFetch = function(){
            this.happy = true;
        }

        QUnit.ok(true, 'ProtoDog defined');

        //TODO: this is like 20-30x slower than prototype, how to fix that?

        for (var i=0; i<10000; i++){
            var a = new Dog(34);
            a.playFetch();
        }

        QUnit.ok(true, '10,000 dogs made');

        for (var i=0; i<10000; i++){
            var a = new ProtoDog(34);
            a.playFetch();
        }

        QUnit.ok(true, '10,000 protodogs made');
    });

});
