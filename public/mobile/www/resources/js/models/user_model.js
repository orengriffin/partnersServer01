/* User Model */
var userModel = (function() {

	var _model = {};

	function set(key, value) {
		_model[key] = value;
		return this;
	}

	function get(key) {
		return _model[key];
	}

	return {
		set:set,
		get:get
	}
})();