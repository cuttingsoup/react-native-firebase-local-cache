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

import * as Helpers from '../Helpers';

const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

export default class StoryList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dataSource: ds.cloneWithRows([]),
    };  

    this._navigateToItem = this._navigateToItem.bind(this);

    //In reality you would use the uid from Firebase, not a hard coded string :)
    this.userId = 'user1';
    this.userItemsRef = firebase.database().ref().child(`user-items/${this.userId}`);
  }

  _navigateToItem(itemId) {
      this.props.onItemPress(itemId);
  }

  componentDidMount() {
    if(this.props.cached) {
      //Cached version:
      Helpers.onUserItemsListener(this.userId, function(items) {
        this.setState({
          dataSource: this.state.dataSource.cloneWithRows(items),
        }); 
      }, this);
    } else {
      //Non cached version:
      this.userItemsRef.on('value', function(snapshot) {
        var items = [];

        snapshot.forEach((child) => {
          items.push({
            name: child.val().name,
            _key: child.key
          });
        });
        
        this.setState({
          dataSource: this.state.dataSource.cloneWithRows(items),
        }); 
      }, this);
    }    
  }

  componentWillUnmount() {
    if(this.props.cached) {
      Helpers.offItemsListener(this.userId);
    } else {
      this.userItemsRef.off();
    }
  }

  _renderItem(item) {
    return (
      <View>
        <TouchableWithoutFeedback
          onPress={() => this._navigateToItem(item._key)}>
          <View>
            <Text style={styles.header}>
                {item.name}
            </Text>
          </View>
        </TouchableWithoutFeedback>
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
