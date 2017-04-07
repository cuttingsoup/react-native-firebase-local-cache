/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  View,
  Text,
  StyleSheet
} from 'react-native';

import { NavigationActions } from 'react-navigation';

import ItemList from './components/ItemList'
import ChildAddedList from './components/ChildAddedList'

export default class HomeScreen extends Component {
  static navigationOptions = {
    title: 'Firebase Cache',
  };

  constructor(props) {
    super(props);

    this._navigateToItem = this._navigateToItem.bind(this);
  }

  _navigateToItem(itemId) {
    this.props.navigation.navigate('ViewItem', {itemId: itemId});
  }

  render() {
    const { navigate } = this.props.navigation;

    return (
      <View style={styles.container}>
        <Text>Cached:</Text>
        <ItemList
          cached={true}
          onItemPress={this._navigateToItem} />
        <Text>Not Cached</Text>
        <ItemList
          cached={false}
          onItemPress={this._navigateToItem} />
        <Text>Cached 'child_added'</Text>
        <ChildAddedList
          cached={true}
          onItemPress={this._navigateToItem} />
        <Text>Not Cached 'child_added'</Text>
        <ChildAddedList
          cached={false}
          onItemPress={this._navigateToItem} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
});
