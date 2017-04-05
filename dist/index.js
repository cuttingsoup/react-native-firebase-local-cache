'use strict';
/**
 * @overview A simple wrapper to Firebase listeners to add local caching of data.
 * @license MIT
 */

var _reactNative = require('react-native');

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

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
  */
	off: function off(dbRef) {
		var _this = this;

		return _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
			var location, storageKey;
			return regeneratorRuntime.wrap(function _callee$(_context) {
				while (1) {
					switch (_context.prev = _context.next) {
						case 0:
							location = dbRef.toString().substring(dbRef.root.toString().length);

							// If a new acceptedOnVerb is added, do a foreach. Or do one when i am not feeling lazy.

							storageKey = '@FirebaseLocalCache:value:' + location;

							//Save to the cache, if there is data for it. Don't return until saved.

							if (!(storageKey in snapPeak)) {
								_context.next = 6;
								break;
							}

							_context.next = 5;
							return _reactNative.AsyncStorage.setItem(storageKey, snapPeak[storageKey]);

						case 5:
							//Clear the locally cached version.
							delete snapPeak[storageKey];

						case 6:

							//And turn listener off.
							dbRef.off();

						case 7:
						case 'end':
							return _context.stop();
					}
				}
			}, _callee, _this);
		}))();
	},


	/**
  * Remove the currently cached data for a particular database.Reference. If there are any listeners still active, they will re-write their data to the cache when the .off method is called.
  * @param {firebase.database.Reference} dbRef Firebase database reference to clear.
  */
	clearCacheForRef: function clearCacheForRef(dbRef) {
		var _this2 = this;

		return _asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
			var location;
			return regeneratorRuntime.wrap(function _callee3$(_context3) {
				while (1) {
					switch (_context3.prev = _context3.next) {
						case 0:
							location = dbRef.toString().substring(dbRef.root.toString().length);


							acceptedOnVerbs.forEach(function () {
								var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(eventType) {
									var storageKey;
									return regeneratorRuntime.wrap(function _callee2$(_context2) {
										while (1) {
											switch (_context2.prev = _context2.next) {
												case 0:
													storageKey = '@FirebaseLocalCache:' + eventType + ':' + location;
													_context2.next = 3;
													return _reactNative.AsyncStorage.removeItem(storageKey);

												case 3:
												case 'end':
													return _context2.stop();
											}
										}
									}, _callee2, _this2);
								}));

								return function (_x) {
									return _ref.apply(this, arguments);
								};
							}());

						case 2:
						case 'end':
							return _context3.stop();
					}
				}
			}, _callee3, _this2);
		}))();
	},


	/**
  * Remove all currently cached data. If there are any listeners still active, they will re-write their data to the cache when the .off method is called.
  */
	clearCache: function clearCache() {
		var _this3 = this;

		return _asyncToGenerator(regeneratorRuntime.mark(function _callee5() {
			var keys;
			return regeneratorRuntime.wrap(function _callee5$(_context5) {
				while (1) {
					switch (_context5.prev = _context5.next) {
						case 0:
							_context5.next = 2;
							return _reactNative.AsyncStorage.getAllKeys();

						case 2:
							keys = _context5.sent;

							keys.forEach(function () {
								var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(key) {
									return regeneratorRuntime.wrap(function _callee4$(_context4) {
										while (1) {
											switch (_context4.prev = _context4.next) {
												case 0:
													if (!key.startsWith('@FirebaseLocalCache:')) {
														_context4.next = 3;
														break;
													}

													_context4.next = 3;
													return _reactNative.AsyncStorage.removeItem(key);

												case 3:
												case 'end':
													return _context4.stop();
											}
										}
									}, _callee4, _this3);
								}));

								return function (_x2) {
									return _ref2.apply(this, arguments);
								};
							}());

						case 4:
						case 'end':
							return _context5.stop();
					}
				}
			}, _callee5, _this3);
		}))();
	}
};

module.exports = cachedDb;