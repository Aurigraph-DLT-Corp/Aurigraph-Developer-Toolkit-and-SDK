/**
 * Blockchain Components - Phase 11 SDK Integration
 *
 * This module exports all blockchain management components for different
 * blockchain networks and protocols supported by Aurigraph DLT V11.
 *
 * Components:
 * - ERC20TokenManager: EVM-based token management (Ethereum, Polygon, Arbitrum, etc.)
 * - EventFilterExplorer: Blockchain event filtering and historical event querying
 * - BitcoinUTXOManager: Bitcoin, Litecoin, Dogecoin UTXO-based chain management
 * - CosmosChainManager: Cosmos ecosystem chain management (Cosmos Hub, Osmosis, Akash, Juno, Stargaze)
 * - SolanaManager: Solana blockchain account and transaction management
 * - SubstrateManager: Substrate/Polkadot ecosystem management (Polkadot, Kusama, Acala, Moonbeam)
 */

// EVM-based blockchain components
export { default as ERC20TokenManager } from './ERC20TokenManager';

// Event management
export { default as EventFilterExplorer } from './EventFilterExplorer';

// UTXO-based blockchains
export { default as BitcoinUTXOManager } from './BitcoinUTXOManager';

// Cosmos ecosystem
export { default as CosmosChainManager } from './CosmosChainManager';

// Solana blockchain
export { default as SolanaManager } from './SolanaManager';

/**
 * Blockchain Manager Components Configuration
 *
 * This object contains metadata for all blockchain managers,
 * useful for routing, navigation, and feature discovery.
 */
export const BLOCKCHAIN_MANAGERS = [
  {
    id: 'erc20',
    name: 'ERC20 Token Manager',
    description: 'Manage ERC20 tokens across EVM-compatible networks',
    component: 'ERC20TokenManager',
    chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc'],
    features: ['token-list', 'balance-query', 'token-details'],
  },
  {
    id: 'events',
    name: 'Event Filter & Explorer',
    description: 'Query and filter blockchain events with advanced filtering',
    component: 'EventFilterExplorer',
    chains: ['ethereum', 'polygon', 'arbitrum', 'optimism'],
    features: ['event-filtering', 'historical-events', 'event-stats'],
  },
  {
    id: 'utxo',
    name: 'Bitcoin UTXO Manager',
    description: 'Manage UTXOs for Bitcoin, Litecoin, and other UTXO chains',
    component: 'BitcoinUTXOManager',
    chains: ['bitcoin', 'bitcoin-testnet', 'litecoin', 'dogecoin'],
    features: ['utxo-query', 'fee-estimation', 'address-validation', 'change-calculation'],
  },
  {
    id: 'cosmos',
    name: 'Cosmos Chain Manager',
    description: 'Manage accounts and transactions across Cosmos ecosystem',
    component: 'CosmosChainManager',
    chains: ['cosmoshub', 'osmosis', 'akash', 'juno', 'stargaze'],
    features: ['account-query', 'transaction-send', 'denomination-handling', 'balance-display'],
  },
  {
    id: 'solana',
    name: 'Solana Manager',
    description: 'Manage Solana accounts and SOL transfers',
    component: 'SolanaManager',
    chains: ['solana-mainnet', 'solana-testnet', 'solana-devnet'],
    features: ['account-connection', 'sol-transfer', 'transaction-tracking', 'cluster-selection'],
  },
  {
    id: 'substrate',
    name: 'Substrate Manager',
    description: 'Manage accounts and extrinsics on Substrate-based chains',
    component: 'SubstrateManager',
    chains: ['polkadot', 'kusama', 'acala', 'moonbeam'],
    features: ['account-query', 'extrinsic-submit', 'runtime-metadata', 'ss58-validation'],
  },
];

/**
 * Blockchain Network Configuration
 *
 * Centralized configuration for all supported blockchain networks
 */
export const BLOCKCHAIN_NETWORKS = {
  // EVM Networks
  ethereum: {
    name: 'Ethereum',
    type: 'evm',
    chainId: 1,
    rpcEndpoint: 'https://eth-mainnet.g.alchemy.com/v2/KEY',
    blockExplorer: 'https://etherscan.io',
  },
  polygon: {
    name: 'Polygon',
    type: 'evm',
    chainId: 137,
    rpcEndpoint: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
  },
  arbitrum: {
    name: 'Arbitrum One',
    type: 'evm',
    chainId: 42161,
    rpcEndpoint: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
  },
  optimism: {
    name: 'Optimism',
    type: 'evm',
    chainId: 10,
    rpcEndpoint: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io',
  },
  bsc: {
    name: 'Binance Smart Chain',
    type: 'evm',
    chainId: 56,
    rpcEndpoint: 'https://bsc-dataseed1.binance.org',
    blockExplorer: 'https://bscscan.com',
  },

  // UTXO Networks
  bitcoin: {
    name: 'Bitcoin Mainnet',
    type: 'utxo',
    network: 'mainnet',
    blockExplorer: 'https://blockchain.com',
  },
  'bitcoin-testnet': {
    name: 'Bitcoin Testnet',
    type: 'utxo',
    network: 'testnet',
    blockExplorer: 'https://testnet.blockchain.com',
  },
  litecoin: {
    name: 'Litecoin',
    type: 'utxo',
    network: 'mainnet',
    blockExplorer: 'https://litecoinblockexplorer.net',
  },
  dogecoin: {
    name: 'Dogecoin',
    type: 'utxo',
    network: 'mainnet',
    blockExplorer: 'https://dogeblocks.com',
  },

  // Cosmos Networks
  cosmoshub: {
    name: 'Cosmos Hub',
    type: 'cosmos',
    chainId: 'cosmoshub-4',
    rpcEndpoint: 'https://rpc.cosmos.network',
    blockExplorer: 'https://www.mintscan.io/cosmos',
  },
  osmosis: {
    name: 'Osmosis',
    type: 'cosmos',
    chainId: 'osmosis-1',
    rpcEndpoint: 'https://rpc.osmosis.zone',
    blockExplorer: 'https://www.mintscan.io/osmosis',
  },
  akash: {
    name: 'Akash',
    type: 'cosmos',
    chainId: 'akashnet-2',
    rpcEndpoint: 'https://rpc.akash.network',
    blockExplorer: 'https://www.mintscan.io/akash',
  },
  juno: {
    name: 'Juno',
    type: 'cosmos',
    chainId: 'juno-1',
    rpcEndpoint: 'https://rpc.juno.zones',
    blockExplorer: 'https://www.mintscan.io/juno',
  },
  stargaze: {
    name: 'Stargaze',
    type: 'cosmos',
    chainId: 'stargaze-1',
    rpcEndpoint: 'https://rpc.stargaze.zones',
    blockExplorer: 'https://www.mintscan.io/stargaze',
  },

  // Solana Networks
  'solana-mainnet': {
    name: 'Solana Mainnet Beta',
    type: 'solana',
    cluster: 'mainnet-beta',
    rpcEndpoint: 'https://api.mainnet-beta.solana.com',
    blockExplorer: 'https://solscan.io',
  },
  'solana-testnet': {
    name: 'Solana Testnet',
    type: 'solana',
    cluster: 'testnet',
    rpcEndpoint: 'https://api.testnet.solana.com',
    blockExplorer: 'https://solscan.io?cluster=testnet',
  },
  'solana-devnet': {
    name: 'Solana Devnet',
    type: 'solana',
    cluster: 'devnet',
    rpcEndpoint: 'https://api.devnet.solana.com',
    blockExplorer: 'https://solscan.io?cluster=devnet',
  },

  // Substrate Networks
  polkadot: {
    name: 'Polkadot',
    type: 'substrate',
    ss58Prefix: 0,
    rpcEndpoint: 'https://rpc.polkadot.io',
    blockExplorer: 'https://polkascan.io',
  },
  kusama: {
    name: 'Kusama',
    type: 'substrate',
    ss58Prefix: 2,
    rpcEndpoint: 'https://kusama-rpc.polkadot.io',
    blockExplorer: 'https://kusama.subscan.io',
  },
  acala: {
    name: 'Acala',
    type: 'substrate',
    ss58Prefix: 10,
    rpcEndpoint: 'https://acala-rpc.aca-api.network',
    blockExplorer: 'https://acala.subscan.io',
  },
  moonbeam: {
    name: 'Moonbeam',
    type: 'substrate',
    ss58Prefix: 1284,
    rpcEndpoint: 'https://rpc.api.moonbeam.network',
    blockExplorer: 'https://moonbeam.subscan.io',
  },
};
