/*
  Copyright 2015, Matthew Roe, under MIT license
*/


//update jQuery to fire a removed event
//thanks to: http://stackoverflow.com/a/13923700
//TODO: is there a better way to handle this, really?
//other libs (specifically jQuery UI in this case) use the same/similar method
//perhaps it is better to create methods to handle these actions that should be used instead of raw jquery...
$.cleanData = (function(orig){
    return function(elems){
        for (var i=0; i<elems.length; i++){
            var elem = $(elems[i]);
            elem.triggerHandler('sWCleaned');
        }
        orig(elems);
    }
})($.cleanData);

sW.Handler = {};
sW.Module(sW.Handler, function(namespace){

    this.allHandlers = {};

    // this.Handler = function(name, expects, definition){
    this.Handler = function(structure){
        //definition can take the following args:
        //element
        //args (obj with keys with attrs you want resolved in the fashion specified)
        //parents (obj with key:value pairs of parentNames:parents)

        var name, expects, definition, handlerValue;
        name = structure.name;
        if (typeof name !== 'string'){
            throw new Error('sW.Handler.Handler requires a name of type string');
        }
        expects = structure.expects || {};
        definition = structure.definition;
        handlerValue = structure.handlerValue || 'alias';
        __public__ = structure.exposes || [];
        //options are alias (name handler is bound to element with),
        //            value (binds the value onto the args as handlerValue)

        //first create the "handler" class
        namespace.allHandlers[name] = sW.Class('sW.Handler.'+name, function(){
            this.__public__ = __public__;
            //automatically runs definition inside of this.__init__ and exposes anything set inside itself
            this.__init__ = function(element, parents, attrs, handlerValue){
                var args = this.__resolveExpects__(element, parents, attrs, handlerValue);
                definition.call(this, $(element), args, parents);

                //make sure we teardown after things go away
                var cls = this;
                $(element).on('sWCleaned', function(){
                    console.log('clearing:', this);
                    cls.clearListeners();
                });
            }

            //TODO: do we need two-way binding on this? or just ways to update/listen to values?

            this.bindable = function(arg){
                return typeof this.__expectBindables__[arg] !== 'undefined';
            }

            this.getArg = function(arg){
                return this.__expectBindables__[arg][0][this.__expectBindables__[arg][1]];
            }
            this.setArg = function(arg, value){
                this.__expectBindables__[arg][0][this.__expectBindables__[arg][1]] = value;
            }

            this.listenArg = function(arg, callback){
                var foundObj = this.__expectBindables__[arg][0];
                var foundKey = this.__expectBindables__[arg][1];

                foundObj.listen(foundKey, callback);
            }

            this.watchArg = function(myVar, arg, callback){
                var foundObj = this.__expectBindables__[arg][0];
                var foundKey = this.__expectBindables__[arg][1];

                this.watch(myVar, foundObj, foundKey, callback);
            }

            this.bindArg = function(myVar, arg, callback){
                if (!this.bindable(arg)){
                    throw new Error('Expected Argument "'+arg+'" is not bindable, be sure to use the @ (or @=) expect symbol');
                }
                var foundObj = this.__expectBindables__[arg][0];
                var foundKey = this.__expectBindables__[arg][1];

                this.bind(myVar, foundObj, foundKey, callback);
            }

            this.__resolveExpects__ = function(element, parents, attrs, handlerValue){
                var attr,
                    foundValue,
                    foundObj,
                    foundKey,
                    cls = this,
                    found = {};
                this.__expectBindables__ = {};
                if (typeof handlerValue !== 'undefined' && handlerValue !== 'alias'){
                    //found['handlerValue'] = handlerValue;
                    expects[name] = handlerValue;
                }
                $.each(expects, function(key, value){
                    attr = attrs[key];
                    var allow_questionable = false;
                    if (value.indexOf('?') !== -1){
                        allow_questionable = true;
                        value = value.replace('?', '');
                    }

                    //simples, check if attr is there at all
                    if (value === '' && allow_questionable){
                        found[key] = namespace.convertAttrExists(attr);
                    //check if we are assigning to a literal (simple only for now)
                    } else if (value === '='){
                        found[key] = namespace.convertAttrLiteral(parents, attr, allow_questionable);
                    //return obj.key (one-time binding) and exposes obj and key for binding
                    } else if (value === '@'){
                        //I think I have to return the parent object and the varname here, not just the varname
                        foundValue = namespace.convertAttrWatch(parents, attr, allow_questionable);
                        foundObj = foundValue[0];
                        foundKey = foundValue[1];
                        found[key] = foundObj[foundKey];
                        cls.__expectBindables__[key] = [foundObj, foundKey];
                    //check if a composite (=@/@=) which checks if bindable or value
                    } else if (value === '@=' || value === '=@'){
                        var foundValue = namespace.convertAttrWatch(parents, attr, allow_questionable);
                        if (typeof foundValue === 'undefined'){
                            foundValue = namespace.convertAttrLiteral(parents, attr, allow_questionable);
                        } else {
                            foundObj = foundValue[0];
                            foundKey = foundValue[1];
                            foundValue = foundObj[foundKey];
                            cls.__expectBindables__[key] = [foundObj, foundKey];
                        }
                        found[key] = foundValue;
                    }
                });

                return found;
            }
        });
        //attach the method for handling value here:
        namespace.allHandlers[name].handlerValue = handlerValue;
    }

    //conversion functions
    this.convertAttrExists = function(attr){
        //handles whether the attr is present or not
        if (typeof attr === 'undefined'){
            return false;
        }
        return true;
    }
    this.convertAttrLiteral = function(parents, attr, allow_questionable){
        //handles simple Javascript literals (string, boolean, number)

        //if undefined and allow_questionable, return null, not false
        var attr_cmp1, attr_cmp2;
        if (typeof attr === 'undefined'){
            if (allow_questionable){
                return null;
            } else {
                throw new Error('Missing required attribute: '+value);
            }
        }

        //first check through literals, we assume binding is slowest operation so do fastest first
        if (attr === 'false'){
            return false;
        } else if (attr === 'true'){
            return true;
        } else if (!isNaN(attr)){
            attr_cmp1 = parseFloat(attr);
            attr_cmp2 = parseInt(attr);
            if (attr_cmp1 === attr_cmp2){
                return attr_cmp2;
            } else {
                return attr_cmp1;
            }
        }
        return attr;
    }
    this.convertAttrWatch = function(parents, attr, allow_questionable){
        if (typeof attr === 'undefined'){
            if (allow_questionable){
                return null;
            } else {
                throw new Error('Missing required attribute: '+value);
            }
        }

        //find the true parent, ie, second-last element (splitting on .)
        var nodes = attr.split('.');
        var parent, value;

        // if (nodes.length === 1){
        //     throw new Error('No parent declared, use ^.attr for nearest parent');
        // }

        //find top-level parent
        //if ^ is top parent, grab first
        //this should be the first handler on parent, but order isn't guaranteed
        parent = parents[nodes[0]];

        nodes.splice(0,1);
        $.each(nodes, function(i, v){
            if (i === nodes.length-1){
                value = v;
            } else {
                parent = parent[v];
            }
        });

        return typeof parent !== 'undefined' ? [parent, value] : undefined;
    }

    var grabHandlersFrom = function(element){
        //if handlers appear more than once, only the nearest parent is used
        //TODO: how to handle if we are using
        var handlers = {};
        var myHandlers = $.data(element, '_handlers');
        //first grab our own
        if (typeof myHandlers !== 'undefined'){
            $.each(myHandlers, function(key, value){
                if (typeof handlers[key] === 'undefined'){
                    handlers[key] = value;
                }
            });
        }
        //grab handlers from our immediate parent (which should chain up)
        //if we are window.body return (highest allowed node)
        if (element !== document.body){
            $.each(grabHandlersFrom(element.parentElement), function(key, value){
                if (typeof handlers[key] === 'undefined'){
                    handlers[key] = value;
                }
            });
        }

        return handlers;
    }

    this.runHandlers = function(){
        //bind as a handler name to the value of the attr (if any), or just use the handler name
        var element = document.body;
        if (arguments.length > 0){
            element = arguments[0];
        }
        //grab attrs of the element
        var attrs = sW.Utils.getAllAttrsFromElement(element);
        var parents = grabHandlersFrom(element);

        $.each(namespace.allHandlers, function(key, h){
            var handlerValue = h.handlerValue;
            if (attrs.hasOwnProperty(key)){
                var handler = new h(element, parents, attrs, handlerValue);
                var data = $.data(element, '_handlers');
                if (typeof $.data(element, '_handlers') === 'undefined'){
                    data = {};
                    $.data(element, '_handlers', data);
                }
                //store handler by name specified
                var alias = key;
                if (handlerValue === 'alias'){
                    var alias = attrs[key] || key;
                }
                data[alias] = handler;
            }
        });

        $.each(element.children, function(i, value){
            namespace.runHandlers(value);
        });
        
    }
});