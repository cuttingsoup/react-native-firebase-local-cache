'use strict';

const INDEX_PATH = '../src/index';

jest.unmock(INDEX_PATH);

jest.mock('react-native', () => {
	//Local store each time the mockule is loaded.
	var fakeStore = {};

	return ({
		AsyncStorage: {
			setItem: jest.fn((key, value) => {
				return new Promise((resolve, reject) => {
					fakeStore[key] = value;
					resolve(null);
				});
			}),
			getItem: jest.fn((key) => {
				return new Promise((resolve, reject) => {
					if (key in fakeStore) {
						resolve(fakeStore[key]);
					}
					resolve(null);
				});
			}),
			removeItem: jest.fn((key) => {
				return new Promise((resolve, reject) => {
					delete fakeStore[key];
					resolve(null);
				});
			}),
			getAllKeys: jest.fn(() => {
				var keys = [];

				for(var key in fakeStore) {
					if(fakeStore.hasOwnProperty(key)) {
						keys.push(key);
					}
				}

				return new Promise((resolve) => {
					resolve(keys);
				});
			}),
			getStore: jest.fn(() => {
				return fakeStore;
			}),
		}
	});
});

const mockUrl = "https://fake.firbase.com/";
const mockDbRefPath = "my/db/ref";
const mockDbRefUrl = mockUrl + mockDbRefPath;

const makeMockDbRef = () => {
	return {
		root: mockUrl,
		toString: function() { return mockDbRefUrl; },

		on: function(eventType, callback, cancelCallbackOrContext, context) {
			if(context) {
				callback.bind(context)("fake-data");
			} else if (cancelCallbackOrContext && typeof(cancelCallbackOrContext) !== 'function') {
				callback.bind(cancelCallbackOrContext)("fake-data");
			} else {
				callback("fake-data");
			}
		},

		off: jest.fn(),
	}
}

const makeMultiDataDbRef = () => {
	return {
		root: mockUrl,
		toString: function() { return mockDbRefUrl; },

		on: function(eventType, callback, cancelCallbackOrContext, context) {
			if(context) {
				callback.bind(context)("fake-data1");
				callback.bind(context)("fake-data2");
			} else if (cancelCallbackOrContext && typeof(cancelCallbackOrContext) !== 'function') {
				callback.bind(cancelCallbackOrContext)("fake-data1");
				callback.bind(cancelCallbackOrContext)("fake-data2");
			} else {
				callback("fake-data1");
				callback("fake-data2");
			}
		},

		off: jest.fn(),
	}
}

var mockForbiddenDbRef = {
	root: mockUrl,
	toString: function() { return mockDbRefUrl; },

	on: function(eventType, callback, cancelCallbackOrContext, context) {
		if(context) {
			cancelCallbackOrContext.bind(context)("error");
		} else {
			cancelCallbackOrContext("error");
		}
	}
}


describe('onValue', () => {

	it('should call snapCallback followed by processedCallback', () => {
		const { AsyncStorage } = require('react-native');
		const cachedDb = require(INDEX_PATH);

		var mockDbRef = makeMockDbRef();

		const snapCallback = jest.fn();
		snapCallback.mockReturnValueOnce("processed");

		const processedCallback = jest.fn();

		return cachedDb.onValue(mockDbRef, snapCallback, processedCallback).then(() => {
			expect(snapCallback).toBeCalledWith("fake-data");
			expect(processedCallback).toBeCalledWith("processed");
		});
	});

	it('should call the cancelled callback if permission is denied', () => {
		const { AsyncStorage } = require('react-native');
		const cachedDb = require(INDEX_PATH);

		const snapCallback = jest.fn();
		const processedCallback = jest.fn();
		const cancelledCallback = jest.fn();

		return cachedDb.onValue(mockForbiddenDbRef, snapCallback, processedCallback, cancelledCallback).then(() => {
			expect(snapCallback.mock.calls.length).toBe(0);
			expect(processedCallback.mock.calls.length).toBe(0);
			expect(cancelledCallback.mock.calls.length).toBe(1);
			expect(cancelledCallback).toBeCalledWith("error");
		});
	});

	it('should pass context if no cancelled callback is provided', () => {
		const { AsyncStorage } = require('react-native');
		const cachedDb = require(INDEX_PATH);

		const context = {str: 'test'};

		var mockDbRef = makeMockDbRef();

		const snapCallback = jest.fn();
		snapCallback.mockReturnValueOnce('processed');

		const snapCallbackWrapper = function(snap) {
			expect(this).toBeDefined();
			expect(this.str).toBe('test');
			return snapCallback(snap);
		}

		const processedCallback = jest.fn();
		const processedCallbackWrapper = function(data) {
			expect(this).toBeDefined();
			expect(this.str).toBe('test');
			processedCallback(data);
		}

		return cachedDb.onValue(mockDbRef, snapCallbackWrapper, processedCallbackWrapper, context).then(() => {
			expect(snapCallback.mock.calls.length).toBe(1);
			expect(snapCallback).toBeCalledWith("fake-data");
			expect(processedCallback.mock.calls.length).toBe(1);
			expect(processedCallback).toBeCalledWith("processed");
		});
	});
	
	
	it('should pass context to snapCallback and processedCallback if a cancelled callback is provided but not called', () => {
		const { AsyncStorage } = require('react-native');
		const cachedDb = require(INDEX_PATH);

		const context = {str: 'test'};

		var mockDbRef = makeMockDbRef();

		const snapCallback = jest.fn();
		snapCallback.mockReturnValueOnce('processed');

		const snapCallbackWrapper = function(snap) {
			expect(this).toBeDefined();
			expect(this.str).toBe('test');
			return snapCallback(snap);
		}

		const processedCallback = jest.fn();
		const processedCallbackWrapper = function(data) {
			expect(this).toBeDefined();
			expect(this.str).toBe('test');
			processedCallback(data);
		}

		const cancelledCallback = jest.fn();

		return cachedDb.onValue(mockDbRef, snapCallbackWrapper, processedCallbackWrapper, context).then(() => {
			expect(snapCallback.mock.calls.length).toBe(1);
			expect(snapCallback).toBeCalledWith("fake-data");
			expect(processedCallback.mock.calls.length).toBe(1);
			expect(processedCallback).toBeCalledWith("processed");
		});
	});

	it('should pass context to cancelledCallback if a cancelled callback is provided and called', () => {
		const { AsyncStorage } = require('react-native');
		const cachedDb = require(INDEX_PATH);

		const context = {str: 'test'};

		var mockDbRef = makeMockDbRef();

		const snapCallback = jest.fn();
		const processedCallback = jest.fn();

		const cancelledCallback = jest.fn();
		const cancelledCallbackWrapper = function(err) {
			expect(this).toBeDefined();
			expect(this.str).toBe('test');
			return cancelledCallback(err);
		}

		return cachedDb.onValue(mockForbiddenDbRef, snapCallback, processedCallback, cancelledCallbackWrapper, context).then(() => {
			expect(snapCallback.mock.calls.length).toBe(0);
			expect(processedCallback.mock.calls.length).toBe(0);
			expect(cancelledCallback.mock.calls.length).toBe(1);
			expect(cancelledCallback).toBeCalledWith("error");
		});
	});

	it('should call processedCallback if there is data in the cache, but not snapCallback', () => {
		const { AsyncStorage } = require('react-native');
		const cachedDb = require(INDEX_PATH);

		var mockDbRef = makeMockDbRef();

		const snapCallback = jest.fn();
		snapCallback.mockReturnValueOnce("processed");
		snapCallback.mockReturnValueOnce("processed2");

		const processedCallback = jest.fn();

		return cachedDb.onValue(mockDbRef, snapCallback, processedCallback)
		.then(() => { return cachedDb.offValue(mockDbRef) })
		.then(() => { return cachedDb.onValue(mockDbRef, snapCallback, processedCallback); })
		.then(() => {
			expect(snapCallback.mock.calls.length).toBe(2);
			expect(snapCallback).toBeCalledWith("fake-data");

			expect(processedCallback.mock.calls.length).toBe(3);
			expect(processedCallback.mock.calls[0][0]).toBe("processed"); //Original call
			expect(processedCallback.mock.calls[1][0]).toBe("processed"); //Cached data
			expect(processedCallback.mock.calls[2][0]).toBe("processed2"); // second call.

			expect(mockDbRef.off.mock.calls.length).toBe(1);
		});

	});

	it('should call processedCallback with correct context if there is data in the cache, but not snapCallback (context as 5th param)', () => {
		const { AsyncStorage } = require('react-native');
		const cachedDb = require(INDEX_PATH);

		const context = {str: 'test'};

		var mockDbRef = makeMockDbRef();

		const snapCallback = jest.fn();
		snapCallback.mockReturnValueOnce("processed");
		snapCallback.mockReturnValueOnce("processed2");

		const processedCallback = jest.fn();
		const processedCallbackWrapper = function(param) {
			expect(this).toBeDefined();
			expect(this.str).toBe('test');
			return processedCallback(param);
		}

		return cachedDb.onValue(mockDbRef, snapCallback, processedCallback)
		.then(() => { return cachedDb.offValue(mockDbRef) })
		.then(() => { return cachedDb.onValue(mockDbRef, snapCallback, processedCallbackWrapper, context); })
		.then(() => {
			expect(snapCallback.mock.calls.length).toBe(2);
			expect(snapCallback).toBeCalledWith("fake-data");

			expect(processedCallback.mock.calls.length).toBe(3);
			expect(processedCallback.mock.calls[0][0]).toBe("processed"); //Original call
			expect(processedCallback.mock.calls[1][0]).toBe("processed"); //Cached data
			expect(processedCallback.mock.calls[2][0]).toBe("processed2"); // second call.

			expect(mockDbRef.off.mock.calls.length).toBe(1);
		});
	});

	it('should call processedCallback with correct context if there is data in the cache, but not snapCallback (context as 6th param)', () => {
		const { AsyncStorage } = require('react-native');
		const cachedDb = require(INDEX_PATH);

		const context = {str: 'test'};

		var mockDbRef = makeMockDbRef();

		const snapCallback = jest.fn();
		snapCallback.mockReturnValueOnce("processed");
		snapCallback.mockReturnValueOnce("processed2");

		const processedCallback = jest.fn();
		const processedCallbackWrapper = function(param) {
			expect(this).toBeDefined();
			expect(this.str).toBe('test');
			return processedCallback(param);
		}

		return cachedDb.onValue(mockDbRef, snapCallback, processedCallback)
		.then(() => { return cachedDb.offValue(mockDbRef) })
		.then(() => { return cachedDb.onValue(mockDbRef, snapCallback, processedCallbackWrapper, ()=>{}, context); })
		.then(() => {
			expect(snapCallback.mock.calls.length).toBe(2);
			expect(snapCallback).toBeCalledWith("fake-data");

			expect(processedCallback.mock.calls.length).toBe(3);
			expect(processedCallback.mock.calls[0][0]).toBe("processed"); //Original call
			expect(processedCallback.mock.calls[1][0]).toBe("processed"); //Cached data
			expect(processedCallback.mock.calls[2][0]).toBe("processed2"); // second call.

			expect(mockDbRef.off.mock.calls.length).toBe(1);
		});
	});

});

describe('onChildAdded', () => {

	it('should call dataAvailableCallback followed by snapCallback, but not cachedCallback if no cached data is available', () => {
		const { AsyncStorage } = require('react-native');
		const cachedDb = require(INDEX_PATH);

		var mockDbRef = makeMockDbRef();

		const cachedCallback = jest.fn();

		const dataAvailableCallback = jest.fn();

		const snapCallback = jest.fn();

		return cachedDb.onChildAdded(mockDbRef, cachedCallback, dataAvailableCallback, snapCallback).then(() => {
			expect(cachedCallback.mock.calls.length).toBe(0);
			expect(dataAvailableCallback.mock.calls.length).toBe(1);
			expect(snapCallback.mock.calls.length).toBe(1);
		});
	});

	it('should call all callbacks if cached data is available', () => {
		const { AsyncStorage } = require('react-native');
		const cachedDb = require(INDEX_PATH);

		var mockDbRef = makeMockDbRef();

		//Add something to the cache.
		AsyncStorage.setItem(`@FirebaseLocalCache:child_added:${mockDbRefPath}`, JSON.stringify('cached data'));

		const cachedCallback = jest.fn();

		const dataAvailableCallback = jest.fn();

		const snapCallback = jest.fn();

		return cachedDb.onChildAdded(mockDbRef, cachedCallback, dataAvailableCallback, snapCallback).then(() => {
			expect(cachedCallback.mock.calls.length).toBe(1);
			expect(cachedCallback).toBeCalledWith('cached data');

			expect(dataAvailableCallback.mock.calls.length).toBe(1);
			expect(snapCallback.mock.calls.length).toBe(1);
		});
	});

	it('should call only call dataAvailableCallback once', () => {
		const { AsyncStorage } = require('react-native');
		const cachedDb = require(INDEX_PATH);

		//Make sure multiple sets of data arrive.
		var mockDbRef = makeMultiDataDbRef();

		//Add something to the cache.
		AsyncStorage.setItem(`@FirebaseLocalCache:child_added:${mockDbRefPath}`, JSON.stringify('cached data'));

		const cachedCallback = jest.fn();

		const dataAvailableCallback = jest.fn();

		const snapCallback = jest.fn();

		return cachedDb.onChildAdded(mockDbRef, cachedCallback, dataAvailableCallback, snapCallback).then(() => {
			expect(cachedCallback.mock.calls.length).toBe(1);
			expect(cachedCallback).toBeCalledWith('cached data');

			expect(dataAvailableCallback.mock.calls.length).toBe(1);
			expect(snapCallback.mock.calls.length).toBe(2);
			expect(snapCallback.mock.calls[0][0]).toBe("fake-data1");
			expect(snapCallback.mock.calls[1][0]).toBe("fake-data2");
		});
	});

	it('should pass context correctly with no errorCallback', () => {
		const { AsyncStorage } = require('react-native');
		const cachedDb = require(INDEX_PATH);

		const context = {str: 'test'};

		//Make sure multiple sets of data arrive.
		var mockDbRef = makeMockDbRef();

		//Add something to the cache.
		AsyncStorage.setItem(`@FirebaseLocalCache:child_added:${mockDbRefPath}`, JSON.stringify('cached data'));

		const cachedCallback = jest.fn();
		const cachedCallbackWrapper = function() {
			expect(this).toBeDefined();
			expect(this.str).toBe('test');
			return cachedCallback();
		}

		const dataAvailableCallback = jest.fn();
		const dataAvailableCallbackWrapper = function() {
			expect(this).toBeDefined();
			expect(this.str).toBe('test');
			return dataAvailableCallback();
		}

		const snapCallback = jest.fn();
		const snapCallbackWrapper = function() {
			expect(this).toBeDefined();
			expect(this.str).toBe('test');
			return snapCallback();
		}

		return cachedDb.onChildAdded(mockDbRef, cachedCallbackWrapper, dataAvailableCallbackWrapper, snapCallbackWrapper, context).then(() => {
			expect(cachedCallback.mock.calls.length).toBe(1);
			expect(dataAvailableCallback.mock.calls.length).toBe(1);
			expect(snapCallback.mock.calls.length).toBe(1);
		});
	});

	it('should pass context correctly with errorCallback', () => {
		const { AsyncStorage } = require('react-native');
		const cachedDb = require(INDEX_PATH);

		const context = {str: 'test'};

		//Make sure multiple sets of data arrive.
		var mockDbRef = makeMockDbRef();

		//Add something to the cache.
		AsyncStorage.setItem(`@FirebaseLocalCache:child_added:${mockDbRefPath}`, JSON.stringify('cached data'));

		const cachedCallback = jest.fn();
		const cachedCallbackWrapper = function() {
			expect(this).toBeDefined();
			expect(this.str).toBe('test');
			return cachedCallback();
		}

		const dataAvailableCallback = jest.fn();
		const dataAvailableCallbackWrapper = function() {
			expect(this).toBeDefined();
			expect(this.str).toBe('test');
			return dataAvailableCallback();
		}

		const snapCallback = jest.fn();
		const snapCallbackWrapper = function() {
			expect(this).toBeDefined();
			expect(this.str).toBe('test');
			return snapCallback();
		}

		const errorCallback = jest.fn();

		return cachedDb.onChildAdded(mockDbRef, cachedCallbackWrapper, dataAvailableCallbackWrapper, snapCallbackWrapper, errorCallback, context).then(() => {
			expect(errorCallback.mock.calls.length).toBe(0);
			expect(cachedCallback.mock.calls.length).toBe(1);
			expect(dataAvailableCallback.mock.calls.length).toBe(1);
			expect(snapCallback.mock.calls.length).toBe(1);
		});
	});

	it('should call errorCallback if error occurs and pass context', () => {
		const { AsyncStorage } = require('react-native');
		const cachedDb = require(INDEX_PATH);

		const context = {str: 'test'};

		//Use forbidden db ref.
		var mockDbRef = mockForbiddenDbRef;

		const cachedCallback = jest.fn();
		const dataAvailableCallback = jest.fn();
		const snapCallback = jest.fn();
		const errorCallback = jest.fn();
		const errorCallbackWrapper = function() {
			expect(this).toBeDefined();
			expect(this.str).toBe('test');
			return errorCallback();
		}

		return cachedDb.onChildAdded(mockDbRef, cachedCallback, dataAvailableCallback, snapCallback, errorCallbackWrapper, context).then(() => {
			expect(errorCallback.mock.calls.length).toBe(1);
			expect(cachedCallback.mock.calls.length).toBe(0);
			expect(dataAvailableCallback.mock.calls.length).toBe(0);
			expect(snapCallback.mock.calls.length).toBe(0);
		});
	});
});

describe('offChildAdded', () => {

	it('should write data to the async store', () => {
		const { AsyncStorage } = require('react-native');
		const cachedDb = require(INDEX_PATH);

		var mockDbRef = makeMockDbRef();

		//Expected path to store at.
		const storageKey = `@FirebaseLocalCache:child_added:${mockDbRefPath}`

		return cachedDb.offChildAdded(mockDbRef, 'amIStored')
		.then(() => AsyncStorage.getItem(storageKey))
		.then((result) => {
			expect(result).toBe(JSON.stringify('amIStored'));
		});
	});
});

describe('clearCacheForRef', () => {

	it('should delete items in the AsyncStorage for a particular db ref', () => {
		const { AsyncStorage } = require('react-native');
		const cachedDb = require(INDEX_PATH);

		var mockDbRef = makeMockDbRef();

		const snapCallback = jest.fn();
		snapCallback.mockReturnValueOnce("processed");

		const processedCallback = jest.fn();

		return cachedDb.onValue(mockDbRef, snapCallback, processedCallback)
		.then(() => { return cachedDb.offValue(mockDbRef) }) //put something in the cache.
		.then(() => { 
			var count = 0;

			for(var propName in AsyncStorage.getStore()) {
 				if(AsyncStorage.getStore().hasOwnProperty(propName)) {
					count++;   
				}
			}

			expect(count).toBe(1);
		}).then(() => {
			return cachedDb.clearCacheForRef(mockDbRef);
		}).then(() => {
			for(var propName in AsyncStorage.getStore()) {
 				if(AsyncStorage.getStore().hasOwnProperty(propName)) {
					console.log(propName + ': ' + AsyncStorage.getStore()[propName]);
					expect('unreachable code').toBe('not reached...');
				}
			}
		});
	});

});

describe('clearCache', () => {

	it('should delete all items in the AsyncStorage', () => {
		const { AsyncStorage } = require('react-native');
		const cachedDb = require(INDEX_PATH);

		var mockDbRef = makeMockDbRef();

		const snapCallback = jest.fn();
		snapCallback.mockReturnValueOnce("processed");

		const processedCallback = jest.fn();

		return cachedDb.onValue(mockDbRef, snapCallback, processedCallback)
		.then(() => { return cachedDb.offValue(mockDbRef) }) //put something in the cache.
		.then(() => { 
			var count = 0;

			for(var propName in AsyncStorage.getStore()) {
 				if(AsyncStorage.getStore().hasOwnProperty(propName)) {
					count++;   
				}
			}

			expect(count).toBe(1);
		}).then(() => {
			return cachedDb.clearCache();
		}).then(() => {
			for(var propName in AsyncStorage.getStore()) {
 				if(AsyncStorage.getStore().hasOwnProperty(propName)) {
					console.log('Uh oh! >>> ' + propName + ': ' + AsyncStorage.getStore()[propName]);
					expect('unreachable code').toBe('not reached...');
				}
			}
		});
	});

});