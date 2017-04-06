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

import * as firebase from 'firebase';

import * as Helpers from './Helpers';

export default class HomeScreen extends Component {
  static navigationOptions = {
    title: 'View Item',
  };

  constructor(props) {
    super(props);

    this.state = {
      cachedName: 'loading...',
      notCachedName: 'loading...',
    };

    this.itemId = this.props.navigation.state.params.itemId;
    //In reality you would use the users uid rather than a hard coded string 'user1'.
    this.itemRef = firebase.database().ref().child(`items/${this.itemId}`);
  }

  componentDidMount() {
    //Non-cached:
    this.itemRef.on('value', (snap) => {
      this.setState({
        notCachedName: snap.val().name,
        notCachedDescription: snap.val().description,
      })
    });

    //Cached:
    Helpers.onItemListener(this.itemId, (item) => {
      this.setState({
        cachedName: item.name,
        cachedDescription: item.description,
      })
    })
  }

  componentWillUnmount() {
    this.itemRef.off();
    Helpers.offItemListener(this.itemId);
  }

  render() {
    const { navigate } = this.props.navigation;

    return (
      <View style={styles.container}>
        <Text>Cached:</Text>
        <Text style={styles.bigText}>{this.state.cachedName}</Text>
        <Text style={styles.bigText}>{this.state.cachedDescription}</Text>
        <Text>Not Cached:</Text>
        <Text style={styles.bigText}>{this.state.notCachedName}</Text>
        <Text style={styles.bigText}>{this.state.notCachedDescription}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  bigText: {
    fontSize: 18
  }
});
