import * as firebase from 'firebase';
import * as cachedListener from 'react-native-firebase-local-cache';

// Listeners for items list:

export function onUserItemsListener(userId, callback, errorCallback, context) {
  cachedListener.on(firebase.database().ref().child(`user-items/${userId}`), 'value', function(snapshot) {
    var items = [];

    snapshot.forEach((child) => {
      items.push({
        name: child.val().name,
        _key: child.key
      });
    });
    
    return items;
  }, callback, errorCallback, context);
};

export function offItemsListener(userId) {
  cachedListener.off(firebase.database().ref().child(`user-items/${userId}`));
};

// Listeners for a specific item:

export function onItemListener(itemId, callback, errorCallback, context) {
  cachedListener.on(firebase.database().ref().child('items').child(itemId), 'value', function(snapshot) {
    return {
      name: snapshot.val().name,
      description: snapshot.val().description,
    };
  }, callback, errorCallback, context);
};

export function offItemListener(itemId) {
  cachedListener.off(firebase.database().ref().child('items').child(itemId));
};
