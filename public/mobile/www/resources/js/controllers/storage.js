/* Local Storage */
var PStorage = (function() {

	_database_config = {
		name: 'partners_db',
		version: '1.0',
		display_name: 'Partners APP',
		size: 100000
	};

	_cached_data = {};
	_number_of_rows = 0;
	_database = undefined;
	_initialized = false;

	/* General Init - Getting local data and set it as chach property */
	function init(callback) {
		_initDatabase();
		_refreshData(callback);
	}

	/* Reloading data */
	function reload(callback) {
		_refreshData(callback);
	}

	/* Update the Cache after reload */
	function setCache(new_cache) {
		_cached_data = new_cache;
	}

	/* Dropping partners table */
	function drop()
	{
		_database.transaction(function(tx) {
			tx.executeSql('DROP TABLE partners');
		});

		_cached_data = {};
		_initialized = false;
	}

	/* init Database Object */
	function _initDatabase() {
		if(_initialized) return;

		_database = window.openDatabase(_database_config['name'], _database_config['version'], _database_config['display_name'], _database_config['size']);
		_database.transaction(_populateDatabase, _popFailed, _popSuccess);
		_initialized = true;
	}

	/* Create database for the first time */
	function _populateDatabase(tx) {
		//tx.executeSql('DROP TABLE partners');
     	tx.executeSql('CREATE TABLE IF NOT EXISTS partners (id, param_name, param_value)');
	}

	/* Populate Success */
	function _popSuccess() {}

	/* Populate Failed */
	function _popFailed() {
		/* Google Analytics Error Message */
	}

	/* Refreshing local data */
	function _refreshData(done)
	{
		/* Init database */
		if(typeof(_database) == 'undefined') _initDatabase();
		
		_database.transaction(function(tx) {
			/* Setting Values inside database */
			tx.executeSql('SELECT * FROM partners', [], function(tx, results) {
				/* Success Callback */
				var new_cache = {};
				var last_index = 0;

				for(var index = 0 ; index < results.rows.length; index++) {
					/* Assign the data */
					var item = results.rows.item(index);
					new_cache[item['param_name']] = {
						value: item['param_value'],
						id: item['id']
					}

					if(item['id'] > last_index) last_index = (item['id'] + 1);
				}

				PStorage.setCache(new_cache, last_index);
				if (!!done) done();
			
			}, function(e, a) {
				/* Error Callback - Google Analytics */
				console.log('database error:');
				console.log(e);
			});

		});
	}

	/* Getting Data Based on Cache*/
	function get(key, as_object)
	{
		return (as_object ? _cached_data[key] : (_cached_data[key] && _cached_data[key]['value'] ? b64_to_utf8(_cached_data[key]['value']) : undefined));
	}

	/**
	 * Setting Values inside databse
	 * @param {string} key
	 * @param {mixed} value
	 * @param {function} callback
	 */
	function set(key, value, done)
	{
		/* Init database */
		if(typeof(_database) == 'undefined') _initDatabase();

		var query = '';
		var params = [];
		var exist_key = get(key, true);

		console.log('Key: ' + key);
		console.log('Value: ');
		console.log(value);

		value = utf8_to_b64(value);// Converting the Value
		query = 'INSERT INTO partners (id, param_name, param_value) VALUES ('+_number_of_rows+',"' + key + '", "' + value + '")';

		_database.transaction(function(tx)
		{
			/* Performing Query */
			tx.executeSql(query, params, function(tx, results)
			{
				/* Success */
				PStorage.reload(done);

			}, function(tx, error)
			{
				/* Failure */
				console.log('SQL FAILED'); // Google Analytics
				console.log(error.message);
			})

		}, function(error) {
			/* Transaction Failed - Google Analytics? */
			console.log('SET TRANSCTION FAILED');
			console.log(error.message);
		});		
	}

	function addslashes(str) {
  		return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
	}

	function utf8_to_b64( str ) {
  		return window.btoa(unescape(encodeURIComponent( str )));
	}

	function b64_to_utf8( str ) {
  		return decodeURIComponent(escape(window.atob( str )));
	}

	return {
		init:init,
		reload:reload,
		setCache:setCache,
		utf8_to_b64:utf8_to_b64,
		b64_to_utf8:b64_to_utf8,
		get:get,
		set:set,
		drop:drop
	};
})();