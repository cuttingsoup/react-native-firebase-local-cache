/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
} from 'react-native';

import { StackNavigator } from 'react-navigation';

import * as firebase from 'firebase';

const config = {
    apiKey: "<YOUR_API_KEY>",
    authDomain: "<YOUR_AUTH_DOMAIN>",
    databaseURL: "<YOUR_DATABASE URL",
    projectId: "<YOUR_PROJECT_ID>",
    messagingSenderId: "<YOUR_MESSAGING_SENDER_ID>"
};

firebase.initializeApp(config);

import HomeScreen from './app/HomeScreen'
import ViewItemScreen from './app/ViewItemScreen'

const firebaseLocalCache = StackNavigator({
  Home: { screen: HomeScreen },
  ViewItem: { screen: ViewItemScreen },
});

AppRegistry.registerComponent('firebaseLocalCache', () => firebaseLocalCache);
