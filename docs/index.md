# Global





* * *

### on(dbRef, eventType, snapCallback, processedCallback, cancelCallbackOrContext, context) 

Create an "on" listener that will first return a cached version of the endpoint.

**Parameters**

**dbRef**: `firebase.database.Reference`, Firebase database reference to listen at.

**eventType**: `String`, One of the following strings: "value", "child_added", "child_changed", "child_removed", or "child_moved."

**snapCallback**: `function`, Callback called when a new snapshot is available. Should return a JSON.stringify-able object that will be cached.

**processedCallback**: `function`, Callback called with data returned by snapCallback, or cached data if available.

**cancelCallbackOrContext**: `function | Object`, An optional callback that will be notified if your event subscription is ever canceled because your client does not have permission to read this data (or it had permission but has now lost it). This callback will be passed an Error object indicating why the failure occurred.

**context**: `Object`, If provided, this object will be used as this when calling your callback(s).

**Returns**: `Promise`, Resolves when the cache has been read and listener attached to DB ref.


### off(dbRef) 

Remove any listeners from the specified ref, and save any existing data to the cache.

**Parameters**

**dbRef**: `firebase.database.Reference`, Firebase database reference to clear.

**Returns**: `Promise`, Promis that will resolve after listener is switched off and cache has been written.


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


