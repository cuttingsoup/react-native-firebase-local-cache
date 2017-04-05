'use strict';
/**
 * @overview A simple wrapper to Firebase listeners to add local caching of data.
 * @license MIT
 */
import { AsyncStorage } from 'react-native';

var snapPeak = {};

const acceptedOnVerbs = ['value'];

function emptyFunction(){};

const cachedDb = {

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
	on(dbRef, eventType, snapCallback, processedCallback, cancelCallbackOrContext, context) {
		if(!acceptedOnVerbs.includes(eventType)) {
			//Don't cache anything else yet.
			var callback = function(snap) {
				const processed = snapCallback.bind(this)(snap);
				processedCallback.bind(this)(processed);
			}
			return new Promise((resolve, reject) => {
					dbRef.on(eventType, callback, cancelCallbackOrContext, context);
					resolve(null);
				});
		}

		const location = dbRef.toString().substring(dbRef.root.toString().length);
		const storageKey = `@FirebaseLocalCache:${eventType}:${location}`;

		return AsyncStorage.getItem(storageKey)
		.then(function(value) {
			if (value !== null){
				var cachedVal = JSON.parse(value);
				if(cancelCallbackOrContext) {
					if(context) {
						processedCallback.bind(context)(cachedVal);
					} else {
						processedCallback.bind(cancelCallbackOrContext)(cachedVal);
					}
				} else {
					processedCallback(cachedVal);
				}				
			}
		}).then(() => {
			var callbackPeak = function(snap) {
				const processed = snapCallback.bind(this)(snap);
				snapPeak[storageKey] = JSON.stringify(processed);
				processedCallback.bind(this)(processed);
			}
			dbRef.on(eventType, callbackPeak, cancelCallbackOrContext, context);
		});
	},

	/**
	 * Remove any listeners from the specified ref, and save any existing data to the cache.
	 * @param {firebase.database.Reference} dbRef Firebase database reference to clear.
	 */
	async off(dbRef) {
		const location = dbRef.toString().substring(dbRef.root.toString().length);

		// If a new acceptedOnVerb is added, do a foreach. Or do one when i am not feeling lazy.
		var storageKey = `@FirebaseLocalCache:value:${location}`;

		//Save to the cache, if there is data for it. Don't return until saved.
		if(storageKey in snapPeak) {
			await AsyncStorage.setItem(storageKey, snapPeak[storageKey]);
			//Clear the locally cached version.
			delete snapPeak[storageKey];
		}

		//And turn listener off.
		dbRef.off();
	},

	/**
	 * Remove the currently cached data for a particular database.Reference. If there are any listeners still active, they will re-write their data to the cache when the .off method is called.
	 * @param {firebase.database.Reference} dbRef Firebase database reference to clear.
	 */
	async clearCacheForRef(dbRef) {
		const location = dbRef.toString().substring(dbRef.root.toString().length);

		acceptedOnVerbs.forEach(async (eventType) => {
			const storageKey = `@FirebaseLocalCache:${eventType}:${location}`;
			await AsyncStorage.removeItem(storageKey);
		});
	},

	/**
	 * Remove all currently cached data. If there are any listeners still active, they will re-write their data to the cache when the .off method is called.
	 */
	async clearCache() {
		const keys = await AsyncStorage.getAllKeys();
		keys.forEach(async (key) => {
			if (key.startsWith('@FirebaseLocalCache:')) {
				//delete it from the cache if it exists.
				await AsyncStorage.removeItem(key);
			}
		});
	},


};

module.exports = cachedDb;
