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
const mockDbRefUrl = mockUrl + "my/db/ref";

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


describe('on', () => {

	it('should call snapCallback followed by processedCallback', () => {
		const { AsyncStorage } = require('react-native');
		const cachedDb = require(INDEX_PATH);

		var mockDbRef = makeMockDbRef();

		const snapCallback = jest.fn();
		snapCallback.mockReturnValueOnce("processed");

		const processedCallback = jest.fn();

		return cachedDb.on(mockDbRef, 'value', snapCallback, processedCallback).then(() => {
			expect(snapCallback).toBeCalledWith("fake-data");
			expect(processedCallback).toBeCalledWith("processed");
		});
	});

	it('should call snapCallback followed by processedCallback as normal if unsupported eventType used', () => {
		const { AsyncStorage } = require('react-native');
		const cachedDb = require(INDEX_PATH);

		var mockDbRef = makeMockDbRef();

		const snapCallback = jest.fn();
		snapCallback.mockReturnValueOnce("processed");

		const processedCallback = jest.fn();

		return cachedDb.on(mockDbRef, 'child_added', snapCallback, processedCallback).then(() => {
			expect(snapCallback.mock.calls.length).toBe(1);
			expect(snapCallback).toBeCalledWith("fake-data");
			expect(processedCallback.mock.calls.length).toBe(1);
			expect(processedCallback).toBeCalledWith("processed");
		});
	});

	it('should call snapCallback followed by processedCallback as normal if unsupported eventType used, with correct context', () => {
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

		return cachedDb.on(mockDbRef, 'child_changed', snapCallbackWrapper, processedCallbackWrapper, context).then(() => {
			expect(snapCallback.mock.calls.length).toBe(1);
			expect(snapCallback).toBeCalledWith("fake-data");
			expect(processedCallback.mock.calls.length).toBe(1);
			expect(processedCallback).toBeCalledWith("processed");
		});
	});

	it('should call the cancelled callback if permission is denied', () => {
		const { AsyncStorage } = require('react-native');
		const cachedDb = require(INDEX_PATH);

		const snapCallback = jest.fn();
		const processedCallback = jest.fn();
		const cancelledCallback = jest.fn();

		return cachedDb.on(mockForbiddenDbRef, 'value', snapCallback, processedCallback, cancelledCallback).then(() => {
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

		return cachedDb.on(mockDbRef, 'value', snapCallbackWrapper, processedCallbackWrapper, context).then(() => {
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

		return cachedDb.on(mockDbRef, 'value', snapCallbackWrapper, processedCallbackWrapper, context).then(() => {
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

		return cachedDb.on(mockForbiddenDbRef, 'value', snapCallback, processedCallback, cancelledCallbackWrapper, context).then(() => {
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

		return cachedDb.on(mockDbRef, 'value', snapCallback, processedCallback)
		.then(() => { return cachedDb.off(mockDbRef) })
		.then(() => { return cachedDb.on(mockDbRef, 'value', snapCallback, processedCallback); })
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

		return cachedDb.on(mockDbRef, 'value', snapCallback, processedCallback)
		.then(() => { return cachedDb.off(mockDbRef) })
		.then(() => { return cachedDb.on(mockDbRef, 'value', snapCallback, processedCallbackWrapper, context); })
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

		return cachedDb.on(mockDbRef, 'value', snapCallback, processedCallback)
		.then(() => { return cachedDb.off(mockDbRef) })
		.then(() => { return cachedDb.on(mockDbRef, 'value', snapCallback, processedCallbackWrapper, ()=>{}, context); })
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

describe('clearCacheForRef', () => {

	it('should delete items in the AsyncStorage for a particular db ref', () => {
		const { AsyncStorage } = require('react-native');
		const cachedDb = require(INDEX_PATH);

		var mockDbRef = makeMockDbRef();

		const snapCallback = jest.fn();
		snapCallback.mockReturnValueOnce("processed");

		const processedCallback = jest.fn();

		return cachedDb.on(mockDbRef, 'value', snapCallback, processedCallback)
		.then(() => { return cachedDb.off(mockDbRef) }) //put something in the cache.
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

		return cachedDb.on(mockDbRef, 'value', snapCallback, processedCallback)
		.then(() => { return cachedDb.off(mockDbRef) }) //put something in the cache.
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