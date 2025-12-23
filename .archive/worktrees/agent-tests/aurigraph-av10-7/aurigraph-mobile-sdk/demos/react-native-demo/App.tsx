/**
 * Aurigraph React Native Demo App
 * 
 * Complete demo showcasing all SDK features
 */

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';

import Aurigraph, {
  Wallet,
  Transaction,
  BridgeTransaction,
  AurigraphConfiguration,
} from '@aurigraph/react-native-sdk';

import {
  WalletSelector,
  SendTransaction,
  TransactionHistory,
  BalanceDisplay,
  CrossChainBridge,
} from '@aurigraph/react-native-sdk/components';

import {
  PriceChart,
  PortfolioPieChart,
  TransactionVolumeChart,
  NetworkStatsGauge,
} from '../shared/charts/AurigraphCharts';

import { ThemeManager, aurigraphDarkTheme, aurigraphLightTheme } from '../shared/themes/aurigraph_themes';

const AurigraphDemo: React.FC = () => {
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'wallet' | 'bridge' | 'analytics'>('wallet');

  // Sample data for charts
  const [priceData] = useState([
    { x: '1', y: 1250, label: 'Jan' },
    { x: '2', y: 1350, label: 'Feb' },
    { x: '3', y: 1180, label: 'Mar' },
    { x: '4', y: 1420, label: 'Apr' },
    { x: '5', y: 1580, label: 'May' },
    { x: '6', y: 1680, label: 'Jun' },
  ]);

  const [portfolioData] = useState([
    { label: 'AUR', value: 5000, color: '#007AFF' },
    { label: 'ETH', value: 3000, color: '#34C759' },
    { label: 'BTC', value: 2000, color: '#FF9500' },
    { label: 'Other', value: 1000, color: '#5856D6' },
  ]);

  const [volumeData] = useState([
    { x: 'Mon', y: 1200, label: 'Mon' },
    { x: 'Tue', y: 1800, label: 'Tue' },
    { x: 'Wed', y: 1500, label: 'Wed' },
    { x: 'Thu', y: 2100, label: 'Thu' },
    { x: 'Fri', y: 1900, label: 'Fri' },
    { x: 'Sat', y: 1400, label: 'Sat' },
    { x: 'Sun', y: 1100, label: 'Sun' },
  ]);

  // Initialize SDK
  useEffect(() => {
    initializeSDK();
  }, []);

  const initializeSDK = async () => {
    try {
      const config: AurigraphConfiguration = {
        networkEndpoint: 'https://testnet-api.aurigraph.io',
        grpcPort: 9004,
        environment: 'testnet',
        enableBiometrics: true,
        enableOfflineMode: true,
        debugMode: __DEV__,
      };

      await Aurigraph.initialize(config);
      setIsInitialized(true);
      
      // Set initial theme
      ThemeManager.setTheme(isDarkMode ? aurigraphDarkTheme : aurigraphLightTheme);
      
      Alert.alert('Success', 'Aurigraph SDK initialized successfully!');
    } catch (error: any) {
      Alert.alert('Error', `Failed to initialize SDK: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletSelect = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    loadBalance(wallet.address);
  };

  const loadBalance = async (address: string) => {
    try {
      const bal = await Aurigraph.getBalance(address);
      setBalance(bal);
    } catch (error) {
      console.warn('Failed to load balance:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    ThemeManager.setTheme(newTheme ? aurigraphDarkTheme : aurigraphLightTheme);
  };

  const createDemoWallet = async () => {
    try {
      const wallet = await Aurigraph.createWallet(
        `Demo Wallet ${Date.now()}`,
        undefined,
        true
      );
      
      setSelectedWallet(wallet);
      Alert.alert('Success', `Wallet created: ${wallet.name}`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const performDemoTransaction = async () => {
    if (!selectedWallet) {
      Alert.alert('Error', 'Please select a wallet first');
      return;
    }

    try {
      const hash = await Aurigraph.sendTransaction(
        selectedWallet.address,
        '0x742d35cc6cf34c39ee36670883c5e6547eeff93c', // Demo address
        '0.001',
        selectedWallet.id,
        undefined,
        true
      );
      
      Alert.alert('Success', `Transaction sent: ${hash.substring(0, 20)}...`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const performDemoBridge = async () => {
    try {
      const bridgeTransaction = await Aurigraph.initiateBridge({
        fromChain: 'aurigraph',
        toChain: 'ethereum',
        amount: '10',
        recipientAddress: '0x742d35cc6cf34c39ee36670883c5e6547eeff93c',
      });
      
      Alert.alert('Success', `Bridge initiated: ${bridgeTransaction.id}`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const theme = ThemeManager.getCurrentTheme();
  const styles = createStyles(theme);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Initializing Aurigraph SDK...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to initialize SDK</Text>
          <TouchableOpacity style={styles.retryButton} onPress={initializeSDK}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.colors.background}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Aurigraph Demo</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeButton}>
            <Text style={styles.themeButtonText}>{isDarkMode ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {(['wallet', 'bridge', 'analytics'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'wallet' && (
          <View>
            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton} onPress={createDemoWallet}>
                  <Text style={styles.actionButtonText}>Create Wallet</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={performDemoTransaction}>
                  <Text style={styles.actionButtonText}>Demo Transaction</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Wallet Selection */}
            <View style={styles.section}>
              <WalletSelector 
                onWalletSelect={handleWalletSelect}
                selectedWallet={selectedWallet}
              />
            </View>

            {/* Balance Display */}
            {selectedWallet && (
              <BalanceDisplay walletAddress={selectedWallet.address} />
            )}

            {/* Send Transaction */}
            <SendTransaction 
              fromWallet={selectedWallet}
              onTransactionSent={(hash) => {
                Alert.alert('Transaction Sent', `Hash: ${hash}`);
              }}
            />

            {/* Transaction History */}
            {selectedWallet && (
              <TransactionHistory 
                walletAddress={selectedWallet.address}
                onTransactionPress={(tx) => {
                  Alert.alert('Transaction Details', JSON.stringify(tx, null, 2));
                }}
              />
            )}
          </View>
        )}

        {activeTab === 'bridge' && (
          <View>
            {/* Bridge Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cross-Chain Bridge</Text>
              <TouchableOpacity style={styles.actionButton} onPress={performDemoBridge}>
                <Text style={styles.actionButtonText}>Demo Bridge</Text>
              </TouchableOpacity>
            </View>

            {/* Cross-Chain Bridge Component */}
            <CrossChainBridge 
              onBridgeInitiated={(bridgeId) => {
                Alert.alert('Bridge Initiated', `ID: ${bridgeId}`);
              }}
            />
          </View>
        )}

        {activeTab === 'analytics' && (
          <View>
            {/* Price Chart */}
            <View style={styles.section}>
              <PriceChart 
                data={priceData}
                theme={theme}
                onDataPointPress={(point) => {
                  Alert.alert('Price Point', `${point.label}: $${point.y}`);
                }}
              />
            </View>

            {/* Portfolio Distribution */}
            <View style={styles.section}>
              <PortfolioPieChart 
                data={portfolioData}
                theme={theme}
                onSegmentPress={(segment) => {
                  Alert.alert('Portfolio Segment', `${segment.label}: $${segment.value}`);
                }}
              />
            </View>

            {/* Transaction Volume */}
            <View style={styles.section}>
              <TransactionVolumeChart 
                data={volumeData}
                theme={theme}
                onDataPointPress={(point) => {
                  Alert.alert('Volume', `${point.label}: ${point.y} transactions`);
                }}
              />
            </View>

            {/* Network Stats */}
            <View style={styles.statsContainer}>
              <NetworkStatsGauge 
                value={1247503}
                maxValue={2000000}
                label="TPS"
                theme={theme}
              />
              <NetworkStatsGauge 
                value={89}
                maxValue={100}
                label="Network Health"
                unit="%"
                theme={theme}
                color={theme.colors.success}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.onBackground,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.onSurface + '20',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
  },
  headerActions: {
    flexDirection: 'row',
  },
  themeButton: {
    padding: 8,
  },
  themeButtonText: {
    fontSize: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    margin: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: theme.colors.onSurface,
  },
  activeTabText: {
    color: theme.colors.onPrimary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.onBackground,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: 16,
  },
});

export default AurigraphDemo;