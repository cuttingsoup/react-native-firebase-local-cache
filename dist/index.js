'use strict';
/**
 * @overview A simple wrapper to Firebase listeners to add local caching of data.
 * @license MIT
 */

var _reactNative = require('react-native');

var snapPeak = {};

var acceptedOnVerbs = ['value'];

function emptyFunction() {};

var cachedDb = {

	/**
  * Create an "on" listener that will first return a cached version of the endpoint.
  * @param {firebase.database.Reference} dbRef Firebase database reference to listen at.
  * @param {String} eventType One of the following strings: "value", "child_added", "child_changed", "child_removed", or "child_moved."
  * @param {Function} snapCallback Callback called when a new snapshot is available. Should return a JSON.stringify-able object that will be cached.
  * @param {Function} processedCallback Callback called with data returned by snapCallback, or cached data if available.
  * @param {Function|Object} cancelCallbackOrContext An optional callback that will be notified if your event subscription is ever canceled because your client does not have permission to read this data (or it had permission but has now lost it). This callback will be passed an Error object indicating why the failure occurred.
  * @param {Object} context If provided, this object will be used as this when calling your callback(s).
  * @returns {Promise} Resolves when the cache has been read and listener attached to DB ref. 
  */
	on: function on(dbRef, eventType, snapCallback, processedCallback, cancelCallbackOrContext, context) {
		if (!acceptedOnVerbs.includes(eventType)) {
			//Don't cache anything else yet.
			var callback = function callback(snap) {
				var processed = snapCallback.bind(this)(snap);
				processedCallback.bind(this)(processed);
			};
			return new Promise(function (resolve, reject) {
				dbRef.on(eventType, callback, cancelCallbackOrContext, context);
				resolve(null);
			});
		}

		var location = dbRef.toString().substring(dbRef.root.toString().length);
		var storageKey = '@FirebaseLocalCache:' + eventType + ':' + location;

		return _reactNative.AsyncStorage.getItem(storageKey).then(function (value) {
			if (value !== null) {
				var cachedVal = JSON.parse(value);
				if (cancelCallbackOrContext) {
					if (context) {
						processedCallback.bind(context)(cachedVal);
					} else {
						processedCallback.bind(cancelCallbackOrContext)(cachedVal);
					}
				} else {
					processedCallback(cachedVal);
				}
			}
		}).then(function () {
			var callbackPeak = function callbackPeak(snap) {
				var processed = snapCallback.bind(this)(snap);
				snapPeak[storageKey] = JSON.stringify(processed);
				processedCallback.bind(this)(processed);
			};
			dbRef.on(eventType, callbackPeak, cancelCallbackOrContext, context);
		});
	},


	/**
  * Remove any listeners from the specified ref, and save any existing data to the cache.
  * @param {firebase.database.Reference} dbRef Firebase database reference to clear.
  * @returns {Promise} Promis that will resolve after listener is switched off and cache has been written.
  */
	off: function off(dbRef) {
		var location = dbRef.toString().substring(dbRef.root.toString().length);

		// If a new acceptedOnVerb is added, do a foreach. Or do one when i am not feeling lazy.
		var storageKey = '@FirebaseLocalCache:value:' + location;

		//And turn listener off.
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