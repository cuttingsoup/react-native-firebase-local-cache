'use strict';
/**
 * @overview A simple wrapper to Firebase listeners to add local caching of data.
 * @license MIT
 */

var _reactNative = require('react-native');

var snapPeak = {};

var acceptedOnVerbs = ['value', 'child_added', 'twice'];

function emptyFunction() {};

function getStorageKeyFromDbRef(dbRef, eventType) {
	var location = "";

	if (dbRef.root) {
		location = dbRef.toString().substring(dbRef.root.toString().length);
	} else {
		//This is a query, not a ref.
		location = dbRef.toString().substring(dbRef.ref.root.toString().length);
	}

	return '@FirebaseLocalCache:' + eventType + ':' + location;
}

/**
 * Call a function with a single argument (arg), and bind the correct context. If no cancelCallback is defined, use cancelCallbackOrContext as context, otherwise use context.
 * @param {*} functionToCall The function that should be called - must take one argument.
 * @param {*} arg The argument to pass to functionToCall
 * @param {*} cancelCallbackOrContext A callback, or context if no callback is provided.
 * @param {*} context A context to bind to the funcitonToCall.
 */
function callWithContext(functionToCall, arg, cancelCallbackOrContext, context) {
	if (cancelCallbackOrContext) {
		if (context) {
			functionToCall.bind(context)(arg);
		} else {
			functionToCall.bind(cancelCallbackOrContext)(arg);
		}
	} else {
		functionToCall(arg);
	}
}

var cachedDb = {

	/**
  * Create an 'value' on listener that will first return a cached version of the endpoint.
  * @param {firebase.database.Reference} dbRef Firebase database reference to listen at. 
  * @param {Function} snapCallback Callback called when a new snapshot is available. Should return a JSON.stringify-able object that will be cached. 
  * @param {Function} processedCallback Callback called with data returned by snapCallback, or cached data if available. 
  * @param {Function|Object} cancelCallbackOrContext An optional callback that will be notified if your event subscription is ever canceled because your client does not have permission to read this data (or it had permission but has now lost it). This callback will be passed an Error object indicating why the failure occurred.
  * @param {Object} context If provided, this object will be used as this when calling your callback(s).
  * @returns {Promise} Resolves when the cache has been read and listener attached to DB ref. 
  */
	onValue: function onValue(dbRef, snapCallback, processedCallback, cancelCallbackOrContext, context) {
		var storageKey = getStorageKeyFromDbRef(dbRef, 'value');

		return _reactNative.AsyncStorage.getItem(storageKey).then(function (value) {
			// Called processedCallback with cached value.
			if (value !== null) {
				var cachedVal = JSON.parse(value);
				callWithContext(processedCallback, cachedVal, cancelCallbackOrContext, context);
			}
		}).then(function () {
			var callbackPeak = function callbackPeak(snap) {
				var processed = snapCallback.bind(this)(snap);
				snapPeak[storageKey] = JSON.stringify(processed);
				processedCallback.bind(this)(processed);
			};
			dbRef.on('value', callbackPeak, cancelCallbackOrContext, context);
		});
	},


	/**
  * Remove any listeners from the specified ref, and save any existing data to the cache.
  * @param {firebase.database.Reference} dbRef Firebase database reference to clear.
  * @returns {Promise} Promis that will resolve after listener is switched off and cache has been written.
  */
	offValue: function offValue(dbRef) {
		var storageKey = getStorageKeyFromDbRef(dbRef, 'value');

		//Turn listener off.
		dbRef.off();

		return new Promise(function (resolve, reject) {
			if (storageKey in snapPeak) {
				var dataToCache = snapPeak[storageKey];
				delete snapPeak[storageKey];
				resolve(_reactNative.AsyncStorage.setItem(storageKey, dataToCache));
			} else {
				resolve(null);
			}
		});
	},


	/**
  * Create an 'child_added' on listener that will first return any cached data saved by a call to offChildAdded. When fresh data arrives, newDataArrivingCallback will be called once, followed by the standard snap callback. From this point on only the snapCallback will be called.
  * @param {firebase.database.Reference} dbRef Firebase database reference to listen at. 
  * @param {*} fromCacheCallback Callback that will be called with cached data if any is available.
  * @param {*} newDataArrivingCallback Callback called immediately before fresh data starts arriving.
  * @param {*} snapCallback Callback called when new data snapshots arrive from the server.
  * @param {*} cancelCallbackOrContext Optional callback that will be called in the case of an error, e.g. forbidden.
  * @param {*} context Optional context that will be bound to `this` in callbacks.
  * @returns {Promise} Resolves when the cache has been read and listener attached to DB ref.
  */
	onChildAdded: function onChildAdded(dbRef, fromCacheCallback, newDataArrivingCallback, snapCallback, cancelCallbackOrContext, context) {
		var storageKey = getStorageKeyFromDbRef(dbRef, 'child_added');

		return _reactNative.AsyncStorage.getItem(storageKey).then(function (value) {
			// Called processedCallback with cached value.
			if (value !== null) {
				var cachedVal = JSON.parse(value);
				callWithContext(fromCacheCallback, cachedVal, cancelCallbackOrContext, context);
			}
		}).then(function () {
			var firstData = true;

			var callbackIntercept = function callbackIntercept(snap) {
				//Call the data arriving callback the first time new data comes in.
				if (firstData) {
					firstData = false;
					newDataArrivingCallback.bind(this)();
				}
				//Then call the snapCallback as normal.
				snapCallback.bind(this)(snap);
			};

			dbRef.on('child_added', callbackIntercept, cancelCallbackOrContext, context);
		});
	},


	/**
  * Turn off listeners at a certain database.Reference, and cache the data passed in so that it can be passed to a new "child_added" listener if one is created. 
  * @param {*} dbRef Reference to stop listening at.
  * @param {*} dataToCache Data that should be cached for this location. Tip: [].slice(-20) to keep the latest 20 items.
  */
	offChildAdded: function offChildAdded(dbRef, dataToCache) {
		var storageKey = getStorageKeyFromDbRef(dbRef, 'child_added');

		//Turn listener off.
		dbRef.off();

		return new Promise(function (resolve, reject) {
			resolve(_reactNative.AsyncStorage.setItem(storageKey, JSON.stringify(dataToCache)));
		});
	},


	/**
  * Wrapper around Firebase on child_removed listener.
  * @param {*} dbRef Database reference to listen at.
  * @param {*} callback A callback that fires when the specified event occurs. The callback will be passed a DataSnapshot. For ordering purposes, "child_added", "child_changed", and "child_moved" will also be passed a string containing the key of the previous child, by sort order, or null if it is the first child.
  * @param {*} cancelCallbackOrContext An optional callback that will be notified if your event subscription is ever canceled because your client does not have permission to read this data (or it had permission but has now lost it). This callback will be passed an Error object indicating why the failure occurred.
  * @param {*} context If provided, this object will be used as this when calling your callback(s).
  */
	onChildRemoved: function onChildRemoved(dbRef, callback, cancelCallbackOrContext, context) {
		return dbRef.on('child_removed', callback, cancelCallbackOrContext, context);
	},


	/**
  * Wrapper around Firebase on child_changed listener.
  * @param {*} dbRef Database reference to listen at.
  * @param {*} callback A callback that fires when the specified event occurs. The callback will be passed a DataSnapshot. For ordering purposes, "child_added", "child_changed", and "child_moved" will also be passed a string containing the key of the previous child, by sort order, or null if it is the first child.
  * @param {*} cancelCallbackOrContext An optional callback that will be notified if your event subscription is ever canceled because your client does not have permission to read this data (or it had permission but has now lost it). This callback will be passed an Error object indicating why the failure occurred.
  * @param {*} context If provided, this object will be used as this when calling your callback(s).
  */
	onChildChanged: function onChildChanged(dbRef, callback, cancelCallbackOrContext, context) {
		return dbRef.on('child_changed', callback, cancelCallbackOrContext, context);
	},


	/**
  * Wrapper around Firebase on child_moved listener.
  * @param {*} dbRef Database reference to listen at.
  * @param {*} callback A callback that fires when the specified event occurs. The callback will be passed a DataSnapshot. For ordering purposes, "child_added", "child_changed", and "child_moved" will also be passed a string containing the key of the previous child, by sort order, or null if it is the first child.
  * @param {*} cancelCallbackOrContext An optional callback that will be notified if your event subscription is ever canceled because your client does not have permission to read this data (or it had permission but has now lost it). This callback will be passed an Error object indicating why the failure occurred.
  * @param {*} context If provided, this object will be used as this when calling your callback(s).
  */
	onChildMoved: function onChildMoved(dbRef, callback, cancelCallbackOrContext, context) {
		return dbRef.on('child_moved', callback, cancelCallbackOrContext, context);
	},


	/**
  * Twice, one better than once! Operates in a similar way to `onValue`, however `snapCallback` will only ever be called once when fresh data arrives. The value returned by `snapCallback` will be cached immediately, then passed to the `processedCallback`. If cached data is available when the listener is first turned on, it will be loaded and passed to `processedCallback`. Once data is cached then, each call to `twice` will call `processedCallback` twice, once with cached data, then once with fresh data after being processed by `snapCallback`.
  * @param {*} dbRef Database reference to listen at.
  * @param {Function} snapCallback Callback called when a new snapshot is available. Should return a JSON.stringify-able object that will be cached. 
  * @param {Function} processedCallback Callback called maximum of twice - once with cached data, once with freshly processed data.
  * @param {Function|Object} cancelCallbackOrContext An optional callback that will be notified if your event subscription is ever canceled because your client does not have permission to read this data (or it had permission but has now lost it). This callback will be passed an Error object indicating why the failure occurred.
  * @param {Object} context If provided, this object will be used as this when calling your callback(s).
  * @returns {Promise} Resolves when the cache has been read and listener attached to DB ref.
  */
	twice: function twice(dbRef, snapCallback, processedCallback, cancelCallbackOrContext, context) {
		var storageKey = getStorageKeyFromDbRef(dbRef, 'twice');

		return _reactNative.AsyncStorage.getItem(storageKey).then(function (value) {
			// Called processedCallback with cached value.
			if (value !== null) {
				var cachedVal = JSON.parse(value);
				callWithContext(processedCallback, cachedVal, cancelCallbackOrContext, context);
			}
		}).then(function () {
			var callbackPeak = function callbackPeak(snap) {
				var processed = snapCallback.bind(this)(snap);
				//Store to cache.
				_reactNative.AsyncStorage.setItem(storageKey, JSON.stringify(processed)).then(function () {
					processedCallback.bind(this)(processed);
				}.bind(this));
			};
			dbRef.once('value', callbackPeak, cancelCallbackOrContext, context);
		});
	},


	/**
  * Remove the currently cached data for a particular database.Reference. If there are any listeners still active, they will re-write their data to the cache when the .off method is called.
  * @param {firebase.database.Reference} dbRef Firebase database reference to clear.
  * @returns {Promise} Promise that resolves once all cached data for this ref has been cleared.
  */
	clearCacheForRef: function clearCacheForRef(dbRef) {
		var location = dbRef.toString().substring(dbRef.root.toString().length);

		var promises = [];

		acceptedOnVerbs.forEach(function (eventType) {
			var storageKey = '@FirebaseLocalCache:' + eventType + ':' + location;
			promises.push(_reactNative.AsyncStorage.removeItem(storageKey));
		});

		return Promise.all(promises);
	},


	/**
  * Remove all currently cached data. If there are any listeners still active, they will re-write their data to the cache when the .off method is called.
  * @returns {Promise} Promise that resolves when all cached data has been deleted.
  */
	clearCache: function clearCache() {
		return _reactNative.AsyncStorage.getAllKeys().then(function (keys) {
			var promises = [];

			keys.forEach(function (key) {
				if (key.startsWith('@FirebaseLocalCache:')) {
					//delete it from the cache if it exists.
					promises.push(_reactNative.AsyncStorage.removeItem(key));
				}
			});

			return Promise.all(promises);
		});
	}
};

module.exports = cachedDb;