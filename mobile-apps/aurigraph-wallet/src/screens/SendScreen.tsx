import React, { useState } from 'react'
import { View, TextInput, TouchableOpacity, Text, StyleSheet, SafeAreaView } from 'react-native'
import { useDispatch } from 'react-redux'

export default function SendScreen() {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    setIsLoading(true)
    try {
      // TODO: Call API to submit transaction
      console.log('Sending', amount, 'to', recipient)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Send Transaction</Text>

      <TextInput
        style={styles.input}
        placeholder="Recipient Address"
        value={recipient}
        onChangeText={setRecipient}
        editable={!isLoading}
      />

      <TextInput
        style={styles.input}
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        editable={!isLoading}
        keyboardType="decimal-pad"
      />

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSend}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>{isLoading ? 'Sending...' : 'Send'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
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
})
