/**
 * Login Screen
 * Handles user authentication (email/password or biometric)
 */

import React, { useState } from 'react'
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { useDispatch } from 'react-redux'
import { login } from '@redux/slices/authSlice'
import { AppDispatch } from '@redux/store'

export default function LoginScreen() {
  const dispatch = useDispatch<AppDispatch>()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setIsLoading(true)
    setError('')

    try {
      // Validate input
      if (!email || !password) {
        setError('Email and password are required')
        setIsLoading(false)
        return
      }

      // TODO: Call API to authenticate
      // const response = await authService.login(email, password)

      // Mock login for now
      dispatch(
        login({
          user: {
            id: '1',
            email,
            name: email.split('@')[0],
          },
          token: 'mock_token_' + Date.now(),
        })
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aurigraph Wallet</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        editable={!isLoading}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        editable={!isLoading}
        secureTextEntry
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>{isLoading ? 'Logging in...' : 'Login'}</Text>
      </TouchableOpacity>

      <TouchableOpacity>
        <Text style={styles.link}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#1f2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#6366f1',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#dc2626',
    fontSize: 14,
    marginTop: 10,
  },
  link: {
    color: '#6366f1',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
})
