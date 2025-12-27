import React from 'react'
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native'
import { useSelector } from 'react-redux'
import { RootState } from '@redux/store'

export default function DashboardScreen() {
  const { balance, address } = useSelector((state: RootState) => state.wallet)
  const { items: transactions } = useSelector((state: RootState) => state.transactions)

  const pendingCount = transactions.filter((t) => t.status === 'pending').length
  const confirmedCount = transactions.filter((t) => t.status === 'confirmed').length

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Dashboard</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Balance</Text>
            <Text style={styles.statValue}>{balance}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={styles.statValue}>{pendingCount}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Confirmed</Text>
            <Text style={styles.statValue}>{confirmedCount}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Txs</Text>
            <Text style={styles.statValue}>{transactions.length}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{address?.slice(0, 20)}...</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1f2937',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  statCard: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  statCardInner: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  infoItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    fontFamily: 'monospace',
  },
})
