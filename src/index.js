'use strict';
/**
 * @overview A simple wrapper to Firebase listeners to add local caching of data.
 * @license MIT
 */
import { AsyncStorage } from 'react-native';

var snapPeak = {};

const acceptedOnVerbs = ['value'];

function emptyFunction(){};

function getStorageKeyFromDbRef(dbRef, eventType) {
	const location = dbRef.toString().substring(dbRef.root.toString().length);
	return `@FirebaseLocalCache:${eventType}:${location}`;
}

/**
 * Call a function with a single argument (arg), and bind the correct context. If no cancelCallback is defined, use cancelCallbackOrContext as context, otherwise use context.
 * @param {*} functionToCall 
 * @param {*} arg 
 * @param {*} cancelCallbackOrContext 
 * @param {*} context 
 */
function callWithContext(functionToCall, arg, cancelCallbackOrContext, context) {
	if(cancelCallbackOrContext) {
		if(context) {
			functionToCall.bind(context)(arg);
		} else {
			functionToCall.bind(cancelCallbackOrContext)(arg);
		}
	} else {
		functionToCall(arg);
	}	
}

const cachedDb = {

	/**
	 * Create an 'value' on listener that will first return a cached version of the endpoint.
	 * @param {firebase.database.Reference} dbRef Firebase database reference to listen at. 
	 * @param {Function} snapCallback Callback called when a new snapshot is available. Should return a JSON.stringify-able object that will be cached. 
	 * @param {Function} processedCallback Callback called with data returned by snapCallback, or cached data if available. 
	 * @param {Function|Object} cancelCallbackOrContext An optional callback that will be notified if your event subscription is ever canceled because your client does not have permission to read this data (or it had permission but has now lost it). This callback will be passed an Error object indicating why the failure occurred.
	 * @param {Object} context If provided, this object will be used as this when calling your callback(s).
	 * @returns {Promise} Resolves when the cache has been read and listener attached to DB ref. 
	 */
	onValue(dbRef, snapCallback, processedCallback, cancelCallbackOrContext, context) {
		const storageKey = getStorageKeyFromDbRef(dbRef, 'value');

		return AsyncStorage.getItem(storageKey)
		.then(function(value) {
			// Called processedCallback with cached value.
			if (value !== null){
				var cachedVal = JSON.parse(value);
				callWithContext(processedCallback, cachedVal, cancelCallbackOrContext, context);
			}
		}).then(() => {
			var callbackPeak = function(snap) {
				const processed = snapCallback.bind(this)(snap);
				snapPeak[storageKey] = JSON.stringify(processed);
				processedCallback.bind(this)(processed);
			}
			dbRef.on('value', callbackPeak, cancelCallbackOrContext, context);
		});
	},

	/**
	 * Remove any listeners from the specified ref, and save any existing data to the cache.
	 * @param {firebase.database.Reference} dbRef Firebase database reference to clear.
	 * @returns {Promise} Promis that will resolve after listener is switched off and cache has been written.
	 */
	offValue(dbRef) {
		var storageKey = getStorageKeyFromDbRef(dbRef, 'value');

		//Turn listener off.
		dbRef.off();

		return new Promise((resolve, reject) => {
			if(storageKey in snapPeak) {
				const dataToCache = snapPeak[storageKey];
				delete snapPeak[storageKey];
				resolve(AsyncStorage.setItem(storageKey, dataToCache));
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
	clearCacheForRef(dbRef) {
		const location = dbRef.toString().substring(dbRef.root.toString().length);

		var promises = [];

		acceptedOnVerbs.forEach((eventType) => {
			const storageKey = `@FirebaseLocalCache:${eventType}:${location}`;
			promises.push(AsyncStorage.removeItem(storageKey))
		})
		
		return Promise.all(promises);
	},

	/**
	 * Remove all currently cached data. If there are any listeners still active, they will re-write their data to the cache when the .off method is called.
	 * @returns {Promise} Promise that resolves when all cached data has been deleted.
	 */
	clearCache() {
		return AsyncStorage.getAllKeys()
		.then((keys) => {
			var promises = [];

			keys.forEach((key) => {
				if (key.startsWith('@FirebaseLocalCache:')) {
					//delete it from the cache if it exists.
					promises.push(AsyncStorage.removeItem(key));
				}
			});

			return Promise.all(promises);
		});
	},


};

module.exports = cachedDb;
