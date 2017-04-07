[![Build Status](https://travis-ci.org/cuttingsoup/react-native-firebase-local-cache.svg?branch=master)](https://travis-ci.org/cuttingsoup/react-native-firebase-local-cache) [![Coverage Status](https://coveralls.io/repos/github/cuttingsoup/react-native-firebase-local-cache/badge.svg?branch=master)](https://coveralls.io/github/cuttingsoup/react-native-firebase-local-cache?branch=master) 

# react-native-firebase-local-cache
A simple wrapper to add local caching of data to Firebase `on(...)` and `once(...)` listeners, useful for improving the apparent load time of screens/pages in your app. 

## Updated API

The exported methods from the module have changed slightly recently with the addition of support for `child_...ed` events and an equivalent to `once(...)`. The exports are:

### `'value'` Events

`onValue(dbRef, snapCallback, processedCallback, cancelCallbackOrContext, context)`

`offValue(dbRef)`

### `'child_added'` Events

`onChildAdded(dbRef, fromCacheCallback, newDataArrivingCallback, snapCallback, cancelCallbackOrContext, context)`

`offChildAdded(dbRef, dataToCache)`

### Other Child Events

`onChildRemoved(dbRef, callback, cancelCallbackOrContext, context)`

`onChildChanged(dbRef, callback, cancelCallbackOrContext, context)`

`onChildMoved(dbRef, callback, cancelCallbackOrContext, context)`

### Once/Twice `'value'` Events

`twice(dbRef, snapCallback, processedCallback, cancelCallbackOrContext, context)`

### Cache Control

`clearCacheForRef(dbRef)`

`clearCache()`

## Simple Use Case - `onValue`

`onValue(dbRef, snapCallback, processedCallback, cancelCallbackOrContext, context)`

In the simplest example, say displaying a users name and email. Previously you could do the following:

```javascript
this.userRef.on('value', function(snap) {
  this.setState({
    name: snap.val().name,
    email: snap.val().email
  });
},this);
```

The equivalent using this module would use `onValue(dbRef, snapCallback, processedCallback, cancelCallbackOrContext, context)`:

```javascript
import * as cachedListener from 'react-native-firebase-local-cache';

...

cachedListener.onValue(this.userRef, function(snap) {
  return {
    name: snap.val().name,
    email: snap.val().email
  });
}, this.setState, this);
```

There is a little bit of trickiness going on here, but essentially the return value of `snapCallback` is cached, then passed as an argument to the `processedCallback`. The next time the listener is set up, `processedCallback` (in this case `this.setState`) will be called with the cached data immediately. When fresh snapshots arrive from the server they will be processed through both callbacks.

So why not cache the `snapshot` directly? It is actually a pretty complex object that can't be stringified easily, it makes more sense to just process the snapshot and save that. Contributions always welcome though!

Another slightly more complex example, say you have a list showing chat rooms a user is subscribed to, you might use the following code:

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

Again, until any data has been loaded, the list will remain empty. The equivalent code to cache this list for subsequent loads would be:

```javascript
import * as cachedListener from 'react-native-firebase-local-cache';

...


cachedListener.onValue(this.userRoomsRef, function(snap) {
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

The first callback does any processing of new data required and returns a __`JSON.stringify-able`__ object that can be cached. (_Note: objects are only committed to the cache when the corresponding `cachedListener.off(...)` method is called._)

The second callback is passed either the freshly processed new data, or when first started, the cached data.

A cancelCallback and/or context can optionally be passed as well.

## Multiple Listeners - `onValue`

If you have multiple listeners attached to the same location, it is possible that they will overwrite each other, here is a very contrived example:

On one screen:

```javascript
this.userRef = firebase.database().ref(`users/${this.userId}`);

cachedListener.onValue(this.userRef, function(snap) {
  return {
    name: snap.val().name,
    email: snap.val().email
  });
}, this.setState, this);
```

And on another:

```javascript
this.userRef = firebase.database().ref(`users/${this.userId}`);

cachedListener.onValue(this.userRef, function(snap) {
  return {
    name: snap.val().name,
    email: snap.val().email,
    age: snap.val().age
  });
}, function(user) {
  this.setState(user);
  this._doSomethingWithEmail(user.email);
}, this);
```

When the first case runs, it will remove the `age` from the cache as it is not present in the returned data. 

One solution is to use a helper method that will use a single method to process the snapshot, and save everything you require:

```javascript
const usersRef = firebase.database().ref('users');

...

export function createCachedUserListener(userId, callback, errorCallback, context) {
  cachedListener.onValue(usersRef.child(userId), function(snapshot) {
    //Process the snapshot to get any data that might be required.
    return {
      name: snap.val().name,
      email: snap.val().email,
      age: snap.val().age
    };
  }, callback, errorCallback, context);
}
```

On your original files, just use the data that is required:

```javascript
Helper.createCachedUserListener(this.userId, function(user) {
  this.setState(user);
  this._doSomethingWithEmail(user.email);
}, this);
```

You'll still need to call the off method to commit the data to the cache, whether you do this in a helper method or by calling it directly is up to you.

## Simple Use Case - `twice`

This is a wrapper around the firebase `once` method and operates in a very similar way to the `onValue` method listed above. The key differences are:

* Just like `once`, it will only wait for one new piece of data to come from the server, then it will stop listening and disconnect.
* `snapCallback` will only be called once when the new data arrives, `processedCallback` will be called twice - once with cached data, once with new data.
* Data is cached as soon as it is returned from the snapCallback, rather than when the `off` method is called. (Since you don't need to call it...)
* It is cached separately to the `onValue` data.

## Simple Use Case - `onChildAdded`

The flow of data through the `onChildAdded` method is somewhat different , but this is reflective of the common use cases.

### `onChildAdded(dbRef, fromCacheCallback, newDataArrivingCallback, snapCallback, cancelCallbackOrContext, context)` 

Create an 'child_added' on listener that will first return any cached data saved by a call to offChildAdded. When fresh data arrives, newDataArrivingCallback will be called once, followed by the standard snap callback. From this point on only the snapCallback will be called.

**Parameters**

**dbRef**: `firebase.database.Reference`, Firebase database reference to listen at.

**fromCacheCallback**: `*`, Callback that will be called with cached data if any is available.

**newDataArrivingCallback**: `*`, Callback called immediately before fresh data starts arriving.

**snapCallback**: `*`, Callback called when new data snapshots arrive from the server.

**cancelCallbackOrContext**: `*`, Optional callback that will be called in the case of an error, e.g. forbidden.

**context**: `*`, Optional context that will be bound to `this` in callbacks.

**Returns**: `Promise`, Resolves when the cache has been read and listener attached to DB ref.

### Example App Demo

The following is from the example app:

```javascript
  _startCachedListener() {
    cachedListener.onChildAdded(this.messagesRef, function(cached){
      // Receiving cached list of messages:
      this.setState({
        dataSource: this.state.dataSource.cloneWithRows(cached),
      }); 
    }, function() {
      //Clean up messages list (not required but this is where you would do it if it was)
      this.messages = [];
    }, function(snapshot) {
      //New snapshot available.
      this.messages.push(this._messageFromSnapshot(snapshot));
    
      this.setState({
        dataSource: this.state.dataSource.cloneWithRows(this.messages),
      }); 
    },this);
  }

  _stopCachedListener() {
    //Cache the top two messages. Alternatively, use this.messages.slice(-2) for the last two - depends on how they are sorted.
    cachedListener.offChildAdded(this.messagesRef, this.messages.slice(0,2)); 
  }
```

The first callback , `fromCacheCallback`, is passed the cached data, and loads the ListView datasource with this data.

When fresh data starts arriving the second callback, `newDataArrivingCallback`, is called. In this case nothing needs to be done, however there are cases where cached data needs to be cleared.

After this is called, the third callback, `snapCallback`, is called with the new snapshot.

In the `_stopCachedListener` call, the first 2 messages are slices off the message array and passed to the `offChildAdded` method, the next time the screen is opened `fromCacheCallback` will be called and passed this item.

The other `child_...` eventypes are all wrapped in `onChild...` methods that do nothing other than pass data through to the native method.

## Differences and Limitations

There are some subtle differences between this implementation and the Firebase one that should be noted:

* The Firebase `database.Reference.on(...)` method returns the provided callback function unmodified. In this module a Promise is returned that is resolved after cached data has been loaded, the callback has been called, and the native listener has been started.
* If passing a context, either do so as the 5th parameter (if no cancelCallback is defined), or as the 6th parameter (if a cancelCallback is defined). I.e. don't pass a null or undefined cancelCallback, either omit it completely or put in something valid.
* You should have been calling the `dbRef.off()` method previously, continue to do so but call `cachedListener.offValue(dbRef)` or `cachedListener.offChildAdded(...)`. This is when the data is actually saved to the cache.

## API

See the auto-generated and hopefully up-to-date docs at: [./docs/index.md](https://github.com/cuttingsoup/react-native-firebase-local-cache/blob/master/docs/index.md)

The code above should give a pretty good idea of how to use it.

Or look at the future Example app which doesn't yet exist.

## Other Info

### Contributions/Criticism

Let me know if there are any issues/bugs/improvements and I'll have a crack at them. Otherwise, feel free to make contributions.

### Acknowledgments

I stole the basic structure of this module from [@jasonmerino](https://github.com/jasonmerino) who wrote the following module:
https://github.com/jasonmerino/react-native-simple-store

