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
        //this handler will bind element.value to sw-value (two-way)
        name: 'sw-value',
        handlerValue: '@',
        definition: function(element, args, parents){
            var update = function(value){
                element.val(value);
            }
            this.listenArg('sw-value', update);
            update(args['sw-value']);

            var cls = this;
            element.on('input', function(){
                cls.setArg('sw-value', element.val());
            });
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
});