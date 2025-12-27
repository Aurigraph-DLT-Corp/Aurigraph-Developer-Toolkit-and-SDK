/**
 * Aurigraph V11 Mobile Wallet
 * Main application entry point
 */

import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'

// Screens
import LoginScreen from '@screens/LoginScreen'
import WalletScreen from '@screens/WalletScreen'
import SendScreen from '@screens/SendScreen'
import ReceiveScreen from '@screens/ReceiveScreen'
import DashboardScreen from '@screens/DashboardScreen'
import SettingsScreen from '@screens/SettingsScreen'

// Redux
import store, { persistor } from '@redux/store'

// Navigation type definitions
import type { NavigatorScreenParams } from '@react-navigation/native'

// Navigation stack types
export type RootStackParamList = {
  Auth: undefined
  MainApp: NavigatorScreenParams<MainTabParamList>
}

export type MainTabParamList = {
  Wallet: undefined
  Dashboard: undefined
  Settings: undefined
}

export type WalletStackParamList = {
  WalletHome: undefined
  Send: undefined
  Receive: undefined
}

const Stack = createStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<MainTabParamList>()

/**
 * Main App Stack Navigator
 * Handles Auth vs MainApp navigation flow
 */
function RootNavigator() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated
    // This would typically restore auth state from AsyncStorage or Redux
    const bootstrapAsync = async () => {
      try {
        // Simulate checking stored auth state
        await new Promise((resolve) => setTimeout(resolve, 1000))
        // setIsLoggedIn(authState.isLoggedIn)
      } catch (e) {
        console.error('Failed to restore auth state', e)
      } finally {
        setIsLoading(false)
      }
    }

    bootstrapAsync()
  }, [])

  if (isLoading) {
    return null // Could show splash screen here
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <Stack.Group screenOptions={{ animationEnabled: false }}>
          <Stack.Screen
            name="Auth"
            component={LoginScreen}
            options={{ title: 'Login' }}
          />
        </Stack.Group>
      ) : (
        <Stack.Screen
          name="MainApp"
          component={MainTabNavigator}
          options={{ title: 'Aurigraph Wallet' }}
        />
      )}
    </Stack.Navigator>
  )
}

/**
 * Main Tab Navigator
 * Bottom tabs for Wallet, Dashboard, Settings
 */
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
      }}
    >
      <Tab.Screen
        name="Wallet"
        component={WalletTabNavigator}
        options={{
          title: 'Wallet',
          tabBarLabel: 'Wallet',
          headerShown: false,
        }}
      />

      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  )
}

/**
 * Wallet Tab Stack Navigator
 * Handles Wallet, Send, Receive screens
 */
function WalletTabNavigator() {
  const WalletStack = createStackNavigator<WalletStackParamList>()

  return (
    <WalletStack.Navigator>
      <WalletStack.Screen
        name="WalletHome"
        component={WalletScreen}
        options={{ title: 'My Wallet' }}
      />

      <WalletStack.Screen
        name="Send"
        component={SendScreen}
        options={{ title: 'Send Transaction' }}
      />

      <WalletStack.Screen
        name="Receive"
        component={ReceiveScreen}
        options={{ title: 'Receive' }}
      />
    </WalletStack.Navigator>
  )
}

/**
 * Root App Component
 * Wraps everything with Redux Provider and Redux Persist
 */
export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </PersistGate>
    </Provider>
  )
}
