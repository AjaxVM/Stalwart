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

    this.Handler({
        name: 'sw-repeat',
        handlerValue: '=',
        exposes: ['value', 'key'],
        definition: function(element, args, parents){
            this.value = null;
            this.key = null;
            var all = this.getArg('sw-repeat').split(':');
            this.alias = all[1].replace(' ', '');
            var parts = all[0].split('.');
            this.targetObj = parents;
            this.target = null;
            for (var i=0; i<parts.length; i++){
                if (i === parts.length-1){
                    this.target = parts[i];
                } else {
                    this.targetObj = this.targetObj[parts[i]];
                }
            }

            this.template = element.clone().removeAttr('sw-repeat');
            this.childTemplate = element.children().clone();
            this.anchor = element;
            this.myChildren = [];

            //TODO: is this something we think could be helpful to have available globally?
            //an idea I had was to have functions to convert a regular function into a bindable/watchable one
            //and it would convert all values to exposed - instead of using an sw.Class?
            this.childScopeObj = sW.Class('sWRepeatHandlerChildScope', function(){
                this.__init__ = function(attr, value){
                    this[attr] = value;
                    this.expose(attr);
                    // this.__setExposed__(attr, value);
                    // this[attr] = value;
                    // this.__public__.push(attr);

                }
            });
        },
        runChildren: function(){

            var cls=this;
            var anchor = this.anchor;
            console.log(anchor);
            var child, args;
            $.each(this.targetObj[this.target], function(key, value){
                child = cls.childTemplate.clone();
                child.text('test');
                anchor.append(child);

                namespace.runHandlers(new cls.childScopeObj(cls.alias, value), child);
            });
        }
    });



});
