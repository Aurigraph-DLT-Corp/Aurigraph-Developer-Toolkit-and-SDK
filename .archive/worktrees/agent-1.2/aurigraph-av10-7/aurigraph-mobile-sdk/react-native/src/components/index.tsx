/**
 * Aurigraph React Native UI Components
 * 
 * Pre-built React Native components for common blockchain operations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Aurigraph, Wallet, Transaction, TransactionStatus } from '../index';
import { useAurigraph } from '../hooks';

// Wallet Selector Component
export interface WalletSelectorProps {
  onWalletSelect: (wallet: Wallet) => void;
  selectedWallet?: Wallet;
  style?: any;
}

export const WalletSelector: React.FC<WalletSelectorProps> = ({
  onWalletSelect,
  selectedWallet,
  style,
}) => {
  const { wallets, refreshWallets, loading } = useAurigraph();
  const [isVisible, setIsVisible] = useState(false);

  return (
    <View style={[styles.walletSelector, style]}>
      <TouchableOpacity
        style={styles.walletButton}
        onPress={() => setIsVisible(true)}
      >
        <Text style={styles.walletButtonText}>
          {selectedWallet ? selectedWallet.name : 'Select Wallet'}
        </Text>
        {selectedWallet && (
          <Text style={styles.walletAddress}>
            {selectedWallet.address.substring(0, 10)}...
          </Text>
        )}
      </TouchableOpacity>

      <Modal visible={isVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Wallet</Text>
            
            {loading ? (
              <ActivityIndicator size="large" color="#007AFF" />
            ) : (
              <FlatList
                data={wallets}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.walletItem}
                    onPress={() => {
                      onWalletSelect(item);
                      setIsVisible(false);
                    }}
                  >
                    <Text style={styles.walletName}>{item.name}</Text>
                    <Text style={styles.walletAddressSmall}>{item.address}</Text>
                  </TouchableOpacity>
                )}
                refreshControl={
                  <RefreshControl
                    refreshing={loading}
                    onRefresh={refreshWallets}
                  />
                }
              />
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Send Transaction Component
export interface SendTransactionProps {
  fromWallet?: Wallet;
  onTransactionSent?: (hash: string) => void;
  style?: any;
}

export const SendTransaction: React.FC<SendTransactionProps> = ({
  fromWallet,
  onTransactionSent,
  style,
}) => {
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(fromWallet);

  const handleSend = async () => {
    if (!selectedWallet || !toAddress || !amount) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const hash = await Aurigraph.sendTransaction(
        selectedWallet.address,
        toAddress,
        amount,
        selectedWallet.id,
        undefined,
        true
      );

      Alert.alert('Success', `Transaction sent: ${hash}`);
      onTransactionSent?.(hash);
      
      // Reset form
      setToAddress('');
      setAmount('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.sendTransaction, style]}>
      <Text style={styles.title}>Send Transaction</Text>
      
      {!fromWallet && (
        <WalletSelector
          onWalletSelect={setSelectedWallet}
          selectedWallet={selectedWallet}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Recipient Address"
        value={toAddress}
        onChangeText={setToAddress}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />

      <TouchableOpacity
        style={[styles.sendButton, loading && styles.disabledButton]}
        onPress={handleSend}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.sendButtonText}>Send</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

// Transaction History Component
export interface TransactionHistoryProps {
  walletAddress?: string;
  onTransactionPress?: (transaction: Transaction) => void;
  style?: any;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  walletAddress,
  onTransactionPress,
  style,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadTransactions = async (isRefresh = false) => {
    if (!walletAddress) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const txs = await Aurigraph.getTransactionHistory(walletAddress, 50, 0);
      setTransactions(txs);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [walletAddress]);

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case 'confirmed':
        return '#4CAF50';
      case 'pending':
      case 'broadcasted':
        return '#FF9800';
      case 'failed':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.transactionItem}
      onPress={() => onTransactionPress?.(item)}
    >
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionHash}>
          {item.hash?.substring(0, 10)}...
        </Text>
        <Text style={styles.transactionAmount}>{item.amount} AUR</Text>
      </View>
      <View style={styles.transactionMeta}>
        <Text
          style={[
            styles.transactionStatus,
            { color: getStatusColor(item.status) },
          ]}
        >
          {item.status.toUpperCase()}
        </Text>
        <Text style={styles.transactionDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.transactionHistory, style]}>
      <Text style={styles.title}>Transaction History</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransaction}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadTransactions(true)}
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No transactions found</Text>
          }
        />
      )}
    </View>
  );
};

// Balance Display Component
export interface BalanceDisplayProps {
  walletAddress?: string;
  style?: any;
}

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  walletAddress,
  style,
}) => {
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);

  const loadBalance = async () => {
    if (!walletAddress) return;

    setLoading(true);
    try {
      const bal = await Aurigraph.getBalance(walletAddress);
      setBalance(bal);
    } catch (error) {
      console.error('Failed to load balance:', error);
      setBalance('Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalance();
    const interval = setInterval(loadBalance, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [walletAddress]);

  return (
    <View style={[styles.balanceDisplay, style]}>
      <Text style={styles.balanceLabel}>Balance</Text>
      {loading ? (
        <ActivityIndicator size="small" color="#007AFF" />
      ) : (
        <Text style={styles.balanceAmount}>{balance} AUR</Text>
      )}
    </View>
  );
};

// Cross-Chain Bridge Component
export interface CrossChainBridgeProps {
  onBridgeInitiated?: (bridgeId: string) => void;
  style?: any;
}

export const CrossChainBridge: React.FC<CrossChainBridgeProps> = ({
  onBridgeInitiated,
  style,
}) => {
  const [fromChain, setFromChain] = useState('aurigraph');
  const [toChain, setToChain] = useState('ethereum');
  const [amount, setAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [supportedChains, setSupportedChains] = useState<string[]>([]);

  useEffect(() => {
    const loadSupportedChains = async () => {
      try {
        const chains = await Aurigraph.getSupportedChains();
        setSupportedChains(chains);
      } catch (error) {
        console.error('Failed to load supported chains:', error);
      }
    };
    loadSupportedChains();
  }, []);

  const handleBridge = async () => {
    if (!amount || !recipientAddress) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const bridgeTransaction = await Aurigraph.initiateBridge({
        fromChain,
        toChain,
        amount,
        recipientAddress,
      });

      Alert.alert('Success', `Bridge initiated: ${bridgeTransaction.id}`);
      onBridgeInitiated?.(bridgeTransaction.id);
      
      // Reset form
      setAmount('');
      setRecipientAddress('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.crossChainBridge, style]}>
      <Text style={styles.title}>Cross-Chain Bridge</Text>
      
      <Text style={styles.label}>From Chain: {fromChain}</Text>
      <Text style={styles.label}>To Chain: {toChain}</Text>

      <TextInput
        style={styles.input}
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Recipient Address"
        value={recipientAddress}
        onChangeText={setRecipientAddress}
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={[styles.bridgeButton, loading && styles.disabledButton]}
        onPress={handleBridge}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.bridgeButtonText}>Bridge</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  walletSelector: {
    marginBottom: 16,
  },
  walletButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    backgroundColor: 'white',
  },
  walletButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  walletAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  walletItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 16,
  },
  walletName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  walletAddressSmall: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  cancelButton: {
    backgroundColor: '#f44336',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  cancelButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  sendTransaction: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  transactionHistory: {
    flex: 1,
    padding: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionHash: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  transactionAmount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  transactionMeta: {
    alignItems: 'flex-end',
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  transactionDate: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 40,
  },
  balanceDisplay: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    margin: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  crossChainBridge: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bridgeButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  bridgeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});