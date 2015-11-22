/*
  Copyright 2015, Matthew Roe, under MIT license
*/


sW.Handler = {};
sW.Module(sW.Handler, function(namespace){

    this.allHandlers = {};

    this.Handler = function(name, expects, definition){
        //definition can take the following args:
        //element
        //masters (obj with key:value pairs of masterNames:masters)
        //args (obj with keys with attrs you want resolved in the fashion specified)

        //first create the "handler" class
        namespace.allHandlers[name] = sW.Class('sW.Handler.'+name, function(){
            //automatically runs definition inside of this.__init__ and exposes anything set inside itself
            this.__init__ = function(element, masters){
                var args = this.__resolveExpects__(element, masters);
                var orig_keys = Object.keys(this);

                definition.call(this, $(element), masters, args);

                var cls = this;
                console.log(cls);

                $.each(Object.keys(this), function(i, key){
                    if (key !== '__exposed__' && orig_keys.indexOf(key) === -1 && !cls.isExposed(key)){
                        cls.exposeProp(key);
                    }
                });
            }

            this.__resolveExpects__ = function(element, masters){
                var attrs = sW.Utils.getAllAttrsFromElement(element);
                var attr,
                    cls = this,
                    found = {};
                $.each(expects, function(key, value){
                    attr = attrs[key];
                    var allow_questionable = false;
                    if (value.indexOf('?') !== -1){
                        allow_questionable = true;
                        value = value.replace('?', '');
                    }

                    //simples, check if attr is there at all
                    if (value === '' && allow_questionable){
                        found[key] = namespace.handleAttrExists(attr);
                    //check if we are assigning to a literal (simple only for now)
                    } else if (value === '='){
                        found[key] = namespace.handleAttrLiteral(masters, attr, allow_questionable);
                    //return obj,value for binding purposes :)
                    } else if (value === '@'){
                        //I think I have to return the master object and the varname here, not just the varname
                        found[key] = namespace.handleAttrWatch(masters, attr, allow_questionable);
                    }
                });

                console.log(found);

                return found;
            }
        });
    }

    //helper functions
    this.handleAttrExists = function(attr){
        //handles whether the attr is present or not
        if (typeof attr === 'undefined'){
            return false;
        }
        return true;
    }
    this.handleAttrLiteral = function(masters, attr, allow_questionable){
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
    this.handleAttrWatch = function(masters, attr, allow_questionable){
        if (typeof attr === 'undefined'){
            if (allow_questionable){
                return null;
            } else {
                throw new Error('Missing required attribute: '+value);
            }
        }

        //find the true master, ie, second-last element (splitting on .)
        var nodes = attr.split('.');
        var master, value;

        if (nodes.length === 1){
            throw new Error('No master declared, use ^.attr for nearest master');
        }

        //find top-level master
        //if ^ is top master, grab most recent
        if (nodes[0] === '^'){
            master = masters._listed[0];
        } else {
            master = masters[nodes[0]];
        }

        nodes.splice(0,1);
        $.each(nodes, function(i, v){
            if (i === nodes.length-1){
                value = v;
            } else {
                master = master[v];
            }
        });

        return [master, value];
    }


    this.attachHandlers = function(){
        $.each(namespace.allHandlers, function(key, value){
            $.each($('['+key+']'), function(i, element){
                var handler = new value(element, {_listed:[]});
            });
        });
    }
    //TODO, bind handlers to values, ie <div sw-handler="xxx">
    //or <div sw-handlers="xxx,yyy,zzz">

    //or do something similar to angular directives?
    //<div my-handle></div>
    //sW.Handle.Handler('my-handle', function(element){})
});