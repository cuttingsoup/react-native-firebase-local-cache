# react-native-firebase-local-cache
A simple wrapper to add local caching of data to Firebase `on(...)` listeners, useful for improving the apparent load time of screens/pages in your app. 

## Sample Use Case

In the simplest example, say displaying a users name and email. Previously you could do the following:

```javascript
this.userRef.on('value', function(snap) {
  this.setState({
    name: snap.val().name,
    email: snap.val().email
  });
},this);
```

The equivalent using this module would be:

```javascript
cachedListener.on(this.userRef, 'value', function(snap) {
  return {
    name: snap.val().name,
    email: snap.val().email
  });
}, this.setState, this);
```

There is a little bit of trickiness going on here, but essentially the return value of the first callback is cached, then passed as an argument to the second callback. The next time a listener is set up, `setState` will be called with the cached data immediately, then when a snapshot arrived from the server it will be processed normally.

If you have a list of chat rooms a user is subscribed to, you might use the following code:

```javascript
this.userRoomsRef.on('value', function(snap) {
  var rooms = [];

  snap.forEach((child) => {
    rooms.push({
      roomName: child.val().name,
      _key: child.key
    });
  });
  
  this.setState({
    dataSource: this.state.dataSource.cloneWithRows(rooms))
  });
},this);
```

Until any data has been loaded, the list will remain empty. This package provides an alternative where the list is cached locally so the next time the screen is opened, the list is populated with cached data, and updated when fresh data arrives. The equivalent code would be:

```javascript
cachedListener.on(this.userRoomsRef, 'value', function(snap) {
  var rooms = [];

  snap.forEach((child) => {
    rooms.push({
      roomName: child.val().name,
      _key: child.key
    });
  });

  return rooms;
}, function(rooms) {
  this.setState({
    dataSource: this.state.dataSource.cloneWithRows(rooms))
  });
},this);
```

The first callback does any processing of new data required and returns a JSON.stringify-able object that can be cached. (_Note: objects are only commited to the cache when the corresponding `cachedListener.off(...)` method is called._)

The second callback is passed either the freshly processed new data, or when first started, the cached data.

A cancelCallback and/or context can optionally be passed as well.

## Differences and Limitations

There are some subtle differences between this implementation and the Firebase one that should be noted:

* Data is cached based on the `database.Reference`, as a result if there are two listeners for the same reference, they will overwrite each other's cache - it is recommended that a general processing callback be used, then the required data be extracted on the processedCallback.
* The only valid `eventType` value is `'value'`. Note that the module should pass everything through to the native method, but no data will be cached.
* The Firebase `database.Reference.on(...)` method returns the provided callback function unmodified. In this module a Promise is returned that is resolved after cached data has been loaded, the callback has been called, and the native listener has been started.
* If passing a context, either do so as the 5th parameter (if no cancelCallback is defined), or as the 6th parameter (if a cancelCallback is defined). I.e. don't pass a null or undefined cancelCallback, either omit it completely or put in something valid.
* You should have been calling the `dbRef.off()` method previously, continue to do so but call `cachedListener.off(dbRef)`. This is when the data is actually saved to the cache.

## Methods

__I think i am going to get rid of those `async`'s. Let me know if you are violently opposed.__

`on(dbRef, eventType, snapCallback, processedCallback, cancelCallbackOrContext, context)`

`async off(dbRef)`

`async clearCacheForRef(dbRef)`

`async clearCache()`

## Other Info

### Contributions/Criticism

Let me know if there are any issues/bugs/improvements and I'll have a crack at them. Otherwise, feel free to make contributions.

### Acknowledgments

I stole the basic structure of this module from [@jasonmerino](https://github.com/jasonmerino) who wrote the following module:
https://github.com/jasonmerino/react-native-simple-store

