/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ListView,
  TouchableWithoutFeedback,
} from 'react-native';

import { NavigationActions } from 'react-navigation';

import * as firebase from 'firebase';

import * as cachedListener from 'react-native-firebase-local-cache';

const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

export default class ChildAddedList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dataSource: ds.cloneWithRows([]),
    };

    this.messagesRef = firebase.database().ref().child('messages');

    this.messages = []
  }

  _messageFromSnapshot(snapshot) {
    return {
      message: snapshot.val().message,
      _key: snapshot.key
    };
  }

  componentDidMount() {
    if(this.props.cached) {
      this._startCachedListener();
    } else {
      this._startUncachedListener();
    }    
  }

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

  _startUncachedListener() {
    this.messagesRef.on('child_added', function(snapshot) {
      this.messages.push(this._messageFromSnapshot(snapshot));
    
      this.setState({
        dataSource: this.state.dataSource.cloneWithRows(this.messages),
      }); 
    }, this);

    this.messagesRef.on('child_removed', function(snapshot) {
      this.messages.splice(this.messages.indexOf(this._messageFromSnapshot(snapshot)), 1);
    }, this);
  }

  _stopUncachedListener() {
      this.messagesRef.off();
  }

  componentWillUnmount() {
    if(this.props.cached) {
      this._stopCachedListener();
    } else {
      this._stopUncachedListener();
    }
  }

  _renderItem(item) {
    return (
      <View>
          <Text style={styles.header}>
              {item.message}
          </Text>
      </View>
    );
  }

  render() {
    return (
      <View style={styles.container}>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={this._renderItem.bind(this)}
          enableEmptySections={true}
          style={styles.listview} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  header:{
    elevation: 2,
    backgroundColor: '#FEFEFE',
    borderBottomWidth: 1,
    borderBottomColor: '#CFD8DC',
    fontSize: 16,
    padding: 12,
  },
  listview: {
    flex: 1,
  },
});
