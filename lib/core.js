




var sW = {};
sW.__defaults = {};

sW.require = function(variable){
	if (typeof window[variable] == 'undefined'){
		throw new ReferenceError('Stalwart requirement "' + variable + '" not found!');
	}
	return true;
}

sW.onInit = function(callback){
	sW.require('jQuery');
	sW.require('ring');
	sW.require('_');
	window.onload = callback;
}

sW.setDefault = function(func, name, value){
	if (!sW.__defaults[func]){
		sW.__defaults[func] = {}
	}
	sW.__defaults[func][name] = value;
}

sW.getDefaults = function(func){
	return sW.__defaults[func];
}

sW.getDefault = function(func, name){
	return sW.__defaults[func][name];
}

sW.forEach = function(obj_or_arr, callback){
	//If array will call callback with (element, index) as arguments
	//If object will call callback with (element, key, index) as arguments
	if ($.isArray(obj_or_arr)){
		for (var i=0; i<obj_or_arr.length; i++){
			callback(obj_or_arr[i], i);
		}
	} else {
		//assume an object
		var keys = Object.keys(obj_or_arr);
		for (var i=0; i<keys.length; i++){
			callback(obj_or_arr[keys[i]], keys[i], i);
		}
	}
}

sW.setDefault('formatString', 'array_separator', '%%');
sW.setDefault('formatString', 'key_separator', '{,}');
sW.formatString = function(string, args, sep){
	//formats a string with either array of values that replace sep (%% by default) characters
	//or, takes an object of keys that match sep_start+key+sep_end (sep is split on comma and defaults to {,}) and replace with value
	
	if ($.isArray(args)){
		var sep = sep || sW.__defaults.formatString.array_separator;
		var parts = string.split(sep);
		var result = '';
		
		sW.forEach(parts, function(obj, i){
			result = result + obj + args[i];
		});
		
		return result;
	} else {
		//assume object
		var sep = (sep || sW.__defaults.formatString.key_separator);
		var seps = sep.split(',');
		var sep_start = seps[0];
		var sep_end = seps[1];
		sW.forEach(args, function(obj, key, i){
			string = string.replace(sep_start+key+sep_end, obj);
		});
	}
	
	return string;
}