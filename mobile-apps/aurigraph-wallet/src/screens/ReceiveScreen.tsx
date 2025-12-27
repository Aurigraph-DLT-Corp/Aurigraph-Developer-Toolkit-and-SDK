import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native'
import { useSelector } from 'react-redux'
import { RootState } from '@redux/store'

export default function ReceiveScreen() {
  const { address } = useSelector((state: RootState) => state.wallet)

  const handleCopyAddress = () => {
    // TODO: Copy address to clipboard
    console.log('Address copied:', address)
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Receive</Text>

      <View style={styles.qrSection}>
        <View style={styles.qrPlaceholder}>
          <Text style={styles.qrText}>QR Code</Text>
        </View>
      </View>

      <View style={styles.addressSection}>
        <Text style={styles.label}>Your Address</Text>
        <View style={styles.addressBox}>
          <Text style={styles.address}>{address}</Text>
          <TouchableOpacity onPress={handleCopyAddress}>
            <Text style={styles.copyButton}>Copy</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.hint}>Share this address to receive payments</Text>
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
  qrSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrText: {
    color: '#6b7280',
    fontSize: 16,
  },
  addressSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  addressBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  address: {
    flex: 1,
    fontSize: 12,
    color: '#4b5563',
    fontFamily: 'monospace',
  },
  copyButton: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  hint: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
  },
})
