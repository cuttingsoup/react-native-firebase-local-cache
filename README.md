[![Build Status](https://travis-ci.org/cuttingsoup/react-native-firebase-local-cache.svg?branch=master)](https://travis-ci.org/cuttingsoup/react-native-firebase-local-cache) [![Coverage Status](https://coveralls.io/repos/github/cuttingsoup/react-native-firebase-local-cache/badge.svg?branch=master)](https://coveralls.io/github/cuttingsoup/react-native-firebase-local-cache?branch=master) 

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
import * as cachedListener from 'react-native-firebase-local-cache';

...

cachedListener.on(this.userRef, 'value', function(snap) {
  return {
    name: snap.val().name,
    email: snap.val().email
  });
}, this.setState, this);
```

There is a little bit of trickiness going on here, but essentially the return value of the first callback is cached, then passed as an argument to the second callback. The next time a listener is set up, `setState` will be called with the cached data immediately, then when a snapshot arrived from the server it will be processed normally.

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

The first callback does any processing of new data required and returns a __`JSON.stringify-able`__ object that can be cached. (_Note: objects are only committed to the cache when the corresponding `cachedListener.off(...)` method is called._)

The second callback is passed either the freshly processed new data, or when first started, the cached data.

A cancelCallback and/or context can optionally be passed as well.

## Multiple Listeners

If you have multiple listeners attached to the same location, it is possible that they will overwrite each other, here is a very contrived example:

On one screen:

```javascript
this.userRef = firebase.database().ref(`users/${this.userId}`);

cachedListener.on(this.userRef, 'value', function(snap) {
  return {
    name: snap.val().name,
    email: snap.val().email
  });
}, this.setState, this);
```

And on another:

```javascript
this.userRef = firebase.database().ref(`users/${this.userId}`);

cachedListener.on(this.userRef, 'value', function(snap) {
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
  cachedListener.on(usersRef.child(userId), 'value', function(snapshot) {
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
  this._do_somethingWithEmail(user.email);
}, this);
```

You'll still need to call the off method to commit the data to the cache, whether you do this in a helper method or by calling it directly is up to you.

## Differences and Limitations

There are some subtle differences between this implementation and the Firebase one that should be noted:

* The only valid `eventType` value is `'value'`. Note that the module should pass everything through to the native method, but no data will be cached.
* The Firebase `database.Reference.on(...)` method returns the provided callback function unmodified. In this module a Promise is returned that is resolved after cached data has been loaded, the callback has been called, and the native listener has been started.
* If passing a context, either do so as the 5th parameter (if no cancelCallback is defined), or as the 6th parameter (if a cancelCallback is defined). I.e. don't pass a null or undefined cancelCallback, either omit it completely or put in something valid.
* You should have been calling the `dbRef.off()` method previously, continue to do so but call `cachedListener.off(dbRef)`. This is when the data is actually saved to the cache.

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

