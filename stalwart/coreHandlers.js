/*
  Copyright 2015, Matthew Roe, under MIT license
*/


sW.Module(sW.Handler, function(namespace){

    this.Handler({
        //this handler will set the element.html to the value passed in to sw-bind
        name: 'sw-bind',
        handlerValue: '@',
        definition: function(element, args, parents){
            var update = function(value){
                element.html(value);
            }
            this.listenArg('sw-bind', update);
            update(args['sw-bind']);
        }
    });

    this.Handler({
        //this handler will bind element.value to sw-value (two-way) (also works for select/option values)
        name: 'sw-value',
        handlerValue: '@',
        definition: function(element, args, parents){
            var update = function(value){
                element.val(value);
            }
            this.listenArg('sw-value', update);
            update(args['sw-value']);

            var cls = this;
            var change = function(){
                var val = element.val();
                if (val !== cls.getArg('sw-value')){
                    cls.setArg('sw-value', val);
                }
            }
            element.on('input', change);
            element.on('change', change);
        }
    });

    this.Handler({
        //this handler will fire a callback that is bound to sw-click on click
        name: 'sw-click',
        handlerValue: '@',
        definition: function(element, args, parents){
            element.on('click', this.getArg('sw-click'));
        }
    });

    //TODO: add sw-repeat handler
    //there are a few concerns with this, mainly on watching if an object/array changes, to update
    //also, need to be able to bind new elements in with handlers, and make sure that this element is used as a template only
    //the other handlers on it don't fire

    //actually, now that we have Class.mutated(prop), we can simply rely on any changes to an exposed value
    //having mutated(prop) called after the changes - ie obj.people[12] = 'Bob';obj.mutated('people');
    //this now only sends you the current value, not the "old" value - once must keep track of the old value
    //and compare vs this new value if that is desired
});