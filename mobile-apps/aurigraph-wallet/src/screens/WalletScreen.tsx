/**
 * Wallet Screen
 * Displays wallet balance and recent transactions
 */

import React, { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView } from 'react-native'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '@redux/store'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { WalletStackParamList } from '@App'

type Props = NativeStackScreenProps<WalletStackParamList, 'WalletHome'>

export default function WalletScreen({ navigation }: Props) {
  const dispatch = useDispatch<AppDispatch>()
  const { balance, address, nonce } = useSelector((state: RootState) => state.wallet)
  const { items: transactions } = useSelector((state: RootState) => state.transactions)

  useEffect(() => {
    // TODO: Fetch wallet data from API
    // dispatch(fetchWalletData())
  }, [])

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionItem}>
      <View>
        <Text style={styles.transactionAddress}>
          {item.from === address ? 'Sent to: ' : 'Received from: '}
          {item.from === address ? item.to : item.from}
        </Text>
        <Text style={styles.transactionTime}>{new Date(item.timestamp * 1000).toLocaleDateString()}</Text>
      </View>
      <Text
        style={[
          styles.transactionAmount,
          { color: item.from === address ? '#dc2626' : '#16a34a' },
        ]}
      >
        {item.from === address ? '-' : '+'}{item.amount}
      </Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.label}>Total Balance</Text>
        <Text style={styles.balance}>{balance}</Text>
        <Text style={styles.address}>{address?.slice(0, 16)}...</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Send')}
        >
          <Text style={styles.actionButtonText}>Send</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Receive')}
        >
          <Text style={styles.actionButtonText}>Receive</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <FlatList
          data={transactions.slice(0, 5)}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.hash}
          scrollEnabled={false}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  balanceCard: {
    backgroundColor: '#6366f1',
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  label: {
    color: '#e0e7ff',
    fontSize: 14,
  },
  balance: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
  },
  address: {
    color: '#c7d2fe',
    fontSize: 12,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  transactionAddress: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  transactionTime: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
})
