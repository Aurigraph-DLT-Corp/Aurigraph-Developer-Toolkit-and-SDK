/**
 * Smart Contract Type Definitions
 *
 * Types for contract deployment, management, and execution
 */

export type ContractLanguage = 'solidity' | 'vyper' | 'java' | 'python' | 'rust';

export interface SmartContract {
  id: string;
  name: string;
  language: ContractLanguage;
  version: string;
  address: string;
  deployer: string;
  deployedAt: string;
  sourceCode: string;
  bytecode: string;
  abi: any;
  status: 'active' | 'paused' | 'destroyed';
  verified: boolean;
  verifiedAt?: string;
  transactionCount: number;
  balance: number;
  metadata?: {
    description?: string;
    documentation?: string;
    tags?: string[];
  };
}

export interface ContractTemplate {
  id: string;
  name: string;
  language: ContractLanguage;
  description: string;
  category: string;
  sourceCode: string;
  parameters: ContractParameter[];
  tags: string[];
}

export interface ContractParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  defaultValue?: any;
}

export interface ContractDeployRequest {
  name: string;
  language: ContractLanguage;
  sourceCode: string;
  constructorArgs?: any[];
  gasLimit?: number;
  metadata?: {
    description?: string;
    documentation?: string;
    tags?: string[];
  };
}

export interface ContractExecuteRequest {
  contractId: string;
  method: string;
  args: any[];
  gasLimit?: number;
  value?: number;
}

export interface ContractMethod {
  name: string;
  inputs: MethodInput[];
  outputs: MethodOutput[];
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
  type: 'function' | 'constructor' | 'receive' | 'fallback';
}

export interface MethodInput {
  name: string;
  type: string;
  indexed?: boolean;
}

export interface MethodOutput {
  name: string;
  type: string;
}

export interface ContractExecution {
  id: string;
  contractId: string;
  method: string;
  args: any[];
  caller: string;
  result?: any;
  gasUsed: number;
  status: 'success' | 'failed' | 'pending';
  transactionHash: string;
  timestamp: string;
  blockHeight: number;
  error?: string;
}

export interface ContractStats {
  totalContracts: number;
  activeContracts: number;
  totalExecutions: number;
  totalGasUsed: number;
  contractsByLanguage: Record<ContractLanguage, number>;
  verifiedContracts: number;
}
