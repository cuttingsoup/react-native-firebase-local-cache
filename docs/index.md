# Global





* * *

### callWithContext(functionToCall, arg, cancelCallbackOrContext, context) 

Call a function with a single argument (arg), and bind the correct context. If no cancelCallback is defined, use cancelCallbackOrContext as context, otherwise use context.

**Parameters**

**functionToCall**: `*`, The function that should be called - must take one argument.

**arg**: `*`, The argument to pass to functionToCall

**cancelCallbackOrContext**: `*`, A callback, or context if no callback is provided.

**context**: `*`, A context to bind to the funcitonToCall.



### onValue(dbRef, snapCallback, processedCallback, cancelCallbackOrContext, context) 

Create an 'value' on listener that will first return a cached version of the endpoint.

**Parameters**

**dbRef**: `firebase.database.Reference`, Firebase database reference to listen at.

**snapCallback**: `function`, Callback called when a new snapshot is available. Should return a JSON.stringify-able object that will be cached.

**processedCallback**: `function`, Callback called with data returned by snapCallback, or cached data if available.

**cancelCallbackOrContext**: `function | Object`, An optional callback that will be notified if your event subscription is ever canceled because your client does not have permission to read this data (or it had permission but has now lost it). This callback will be passed an Error object indicating why the failure occurred.

**context**: `Object`, If provided, this object will be used as this when calling your callback(s).

**Returns**: `Promise`, Resolves when the cache has been read and listener attached to DB ref.


### offValue(dbRef) 

Remove any listeners from the specified ref, and save any existing data to the cache.

**Parameters**

**dbRef**: `firebase.database.Reference`, Firebase database reference to clear.

**Returns**: `Promise`, Promis that will resolve after listener is switched off and cache has been written.


### onChildAdded(dbRef, fromCacheCallback, newDataArrivingCallback, snapCallback, cancelCallbackOrContext, context) 

Create an 'child_added' on listener that will first return any cached data saved by a call to offChildAdded. When fresh data arrives, newDataArrivingCallback will be called once, followed by the standard snap callback. From this point on only the snapCallback will be called.

**Parameters**

**dbRef**: `firebase.database.Reference`, Firebase database reference to listen at.

**fromCacheCallback**: `*`, Callback that will be called with cached data if any is available.

**newDataArrivingCallback**: `*`, Callback called immediately before fresh data starts arriving.

**snapCallback**: `*`, Callback called when new data snapshots arrive from the server.

**cancelCallbackOrContext**: `*`, Optional callback that will be called in the case of an error, e.g. forbidden.

**context**: `*`, Optional context that will be bound to `this` in callbacks.

**Returns**: `Promise`, Resolves when the cache has been read and listener attached to DB ref.


### offChildAdded(dbRef, dataToCache) 

Turn off listeners at a certain database.Reference, and cache the data passed in so that it can be passed to a new "child_added" listener if one is created.

**Parameters**

**dbRef**: `*`, Reference to stop listening at.

**dataToCache**: `*`, Data that should be cached for this location. Tip: [].slice(-20) to keep the latest 20 items.



### onChildRemoved(dbRef, callback, cancelCallbackOrContext, context) 

Wrapper around Firebase on child_removed listener.

**Parameters**

**dbRef**: `*`, Database reference to listen at.

**callback**: `*`, A callback that fires when the specified event occurs. The callback will be passed a DataSnapshot. For ordering purposes, "child_added", "child_changed", and "child_moved" will also be passed a string containing the key of the previous child, by sort order, or null if it is the first child.

**cancelCallbackOrContext**: `*`, An optional callback that will be notified if your event subscription is ever canceled because your client does not have permission to read this data (or it had permission but has now lost it). This callback will be passed an Error object indicating why the failure occurred.

**context**: `*`, If provided, this object will be used as this when calling your callback(s).



### onChildChanged(dbRef, callback, cancelCallbackOrContext, context) 

Wrapper around Firebase on child_changed listener.

**Parameters**

**dbRef**: `*`, Database reference to listen at.

**callback**: `*`, A callback that fires when the specified event occurs. The callback will be passed a DataSnapshot. For ordering purposes, "child_added", "child_changed", and "child_moved" will also be passed a string containing the key of the previous child, by sort order, or null if it is the first child.

**cancelCallbackOrContext**: `*`, An optional callback that will be notified if your event subscription is ever canceled because your client does not have permission to read this data (or it had permission but has now lost it). This callback will be passed an Error object indicating why the failure occurred.

**context**: `*`, If provided, this object will be used as this when calling your callback(s).



### onChildMoved(dbRef, callback, cancelCallbackOrContext, context) 

Wrapper around Firebase on child_moved listener.

**Parameters**

**dbRef**: `*`, Database reference to listen at.

**callback**: `*`, A callback that fires when the specified event occurs. The callback will be passed a DataSnapshot. For ordering purposes, "child_added", "child_changed", and "child_moved" will also be passed a string containing the key of the previous child, by sort order, or null if it is the first child.

**cancelCallbackOrContext**: `*`, An optional callback that will be notified if your event subscription is ever canceled because your client does not have permission to read this data (or it had permission but has now lost it). This callback will be passed an Error object indicating why the failure occurred.

**context**: `*`, If provided, this object will be used as this when calling your callback(s).



### twice(dbRef, snapCallback, processedCallback, cancelCallbackOrContext, context) 

Twice, one better than once! Operates in a similar way to `onValue`, however `snapCallback` will only ever be called once when fresh data arrives. The value returned by `snapCallback` will be cached immediately, then passed to the `processedCallback`. If cached data is available when the listener is first turned on, it will be loaded and passed to `processedCallback`. Once data is cached then, each call to `twice` will call `processedCallback` twice, once with cached data, then once with fresh data after being processed by `snapCallback`.

**Parameters**

**dbRef**: `*`, Database reference to listen at.

**snapCallback**: `function`, Callback called when a new snapshot is available. Should return a JSON.stringify-able object that will be cached.

**processedCallback**: `function`, Callback called maximum of twice - once with cached data, once with freshly processed data.

**cancelCallbackOrContext**: `function | Object`, An optional callback that will be notified if your event subscription is ever canceled because your client does not have permission to read this data (or it had permission but has now lost it). This callback will be passed an Error object indicating why the failure occurred.

**context**: `Object`, If provided, this object will be used as this when calling your callback(s).

**Returns**: `Promise`, Resolves when the cache has been read and listener attached to DB ref.


### clearCacheForRef(dbRef) 

Remove the currently cached data for a particular database.Reference. If there are any listeners still active, they will re-write their data to the cache when the .off method is called.

**Parameters**

**dbRef**: `firebase.database.Reference`, Firebase database reference to clear.

**Returns**: `Promise`, Promise that resolves once all cached data for this ref has been cleared.


### clearCache() 

Remove all currently cached data. If there are any listeners still active, they will re-write their data to the cache when the .off method is called.

**Returns**: `Promise`, Promise that resolves when all cached data has been deleted.



* * *





**License:** MIT 

**Overview:** A simple wrapper to Firebase listeners to add local caching of data.


