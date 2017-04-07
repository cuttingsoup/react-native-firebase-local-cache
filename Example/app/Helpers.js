import * as firebase from 'firebase';
import * as cachedListener from 'react-native-firebase-local-cache';

// Listeners for items list:

export function onUserItemsListener(userId, callback, errorCallback, context) {
  cachedListener.onValue(firebase.database().ref().child(`user-items/${userId}`), function(snapshot) {
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
  cachedListener.offValue(firebase.database().ref().child(`user-items/${userId}`));
};

// Listeners for a specific item:

export function onItemListener(itemId, callback, errorCallback, context) {
  cachedListener.onValue(firebase.database().ref().child('items').child(itemId), function(snapshot) {
    return {
      name: snapshot.val().name,
      description: snapshot.val().description,
    };
  }, callback, errorCallback, context);
};

export function offItemListener(itemId) {
  cachedListener.offValue(firebase.database().ref().child('items').child(itemId));
};
