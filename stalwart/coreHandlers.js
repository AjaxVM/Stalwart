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

    // this.Handler({
    //     name: 'sw-repeat-inner',
    //     handlerValue: '=',
    //     definition: function(element, args, parents){
    //         //our children become the template, which is iterated over
    //         //from sw-repeat-inner grab string "obj

    //         //find obj name and key name
    //         var parts = args['sw-repeat-inner'].split('->');
    //         var myObjParts = namespace.getParentHandlerVar(parts[0], parents);

    //         this.root = myObjParts[0];
    //         this.rootVar = myObjParts[1];
    //         this.targetVar = parts[1];

    //         this.values = {};

    //         var firstTime = true;

    //         this.template = element.html();
    //         console.log(this.template);

    //         //TODO: do string replacement of targetVar to work, ie:
    //         //<div sw-repeat-inner="myname" sw-repeat-as="mylist->item">
    //         //<div sw-bind="myname.item"> BECOMES <div sw-bind="myname.values.0-n">
    //         //Also convert myname.key (as helper)
            
    //         var cls = this;

    //         this.updateValues = function(){
    //             element.empty();
    //             $.each(cls.root[cls.rootVar], function(key, value){
    //                 key = ''+key; //convert to string if necessary
    //                 cls.values[key] = value;
    //                 var data = {}
    //                 data[cls.targetVar] = value;
    //                 data['key'] = key;
    //                 var clone = cls.template.clone();
    //                 namespace.runHandlers(data, clone[0]);
    //             });
    //         }

    //         this.updateValues();
    //         console.log(this.values);

    //         firstTime = false;
    //     }
    // });

    this.Handler({
        name: 'sw-repeat-element',
        definition: function(element, args, parents){
            console.log('huehue', element, args, parents);
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
            //this.childTemplate = $('<div sw-repeat-element="'+this.alias+'">');
            //TODO how to create an anchor point for recalculation?
            //Need to remove the element, but for now it tells us where we are
            this.anchor = element;
            this.myChildren = [];
        },
        runChildren: function(){
            console.log('blah...');
            console.log(this.anchor);
            console.log(this.targetObj, this.target);

            var cls=this;
            var anchor = this.anchor;
            var child, args;
            $.each(this.targetObj[this.target], function(key, value){
                console.log(value, key);
                // child = cls.childTemplate.clone().append(cls.template.clone());
                child = cls.childTemplate.clone();
                anchor.after(child);
                var data = {
                    
                };
                data[cls.alias] = value;

                console.log(data, child);
                namespace.runHandlers(data, child);
            });
        }
    });



});
