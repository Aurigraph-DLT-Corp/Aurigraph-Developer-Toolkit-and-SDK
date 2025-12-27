import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Switch } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '@redux/slices/authSlice'
import { enableBiometric, disableBiometric } from '@redux/slices/authSlice'
import { RootState, AppDispatch } from '@redux/store'

export default function SettingsScreen() {
  const dispatch = useDispatch<AppDispatch>()
  const { biometricEnabled } = useSelector((state: RootState) => state.auth)

  const handleBiometricToggle = () => {
    if (biometricEnabled) {
      dispatch(disableBiometric())
    } else {
      dispatch(enableBiometric())
    }
  }

  const handleLogout = () => {
    dispatch(logout())
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>

        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>Biometric Authentication</Text>
            <Text style={styles.settingDescription}>Use Face ID or Fingerprint</Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={handleBiometricToggle}
            trackColor={{ false: '#ccc', true: '#81c784' }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>App Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Network</Text>
          <Text style={styles.infoValue}>Mainnet</Text>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
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
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  settingItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  settingDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  infoItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  infoValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
