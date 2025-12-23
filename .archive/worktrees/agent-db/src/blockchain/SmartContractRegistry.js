/**
 * Smart Contract Registry Service
 * Manages templates, deployments, and lifecycle of smart contracts
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const logger = require('../core/logger');

class SmartContractRegistry extends EventEmitter {
    constructor(dltIntegration) {
        super();
        this.dltIntegration = dltIntegration;
        this.templates = new Map();
        this.deployedContracts = new Map();
        this.contractVersions = new Map();
        this.auditTrail = [];
        this.contractsPath = path.join(__dirname, 'contracts');
        this.templatesPath = path.join(__dirname, 'templates');
        this.registryPath = path.join(__dirname, 'registry');
        
        // Contract states
        this.CONTRACT_STATES = {
            TEMPLATE: 'template',
            COMPILING: 'compiling',
            COMPILED: 'compiled',
            DEPLOYING: 'deploying',
            DEPLOYED: 'deployed',
            ACTIVE: 'active',
            PAUSED: 'paused',
            UPGRADED: 'upgraded',
            DEPRECATED: 'deprecated',
            TERMINATED: 'terminated'
        };
        
        // Template categories
        this.TEMPLATE_CATEGORIES = {
            TOKENIZATION: 'tokenization',
            EQUITY: 'equity',
            DEFI: 'defi',
            GOVERNANCE: 'governance',
            ESCROW: 'escrow',
            ORACLE: 'oracle',
            MULTISIG: 'multisig',
            UTILITY: 'utility',
            COMPLIANCE: 'compliance',
            BRIDGE: 'bridge'
        };
    }

    async initialize() {
        try {
            logger.info('🏗️ Initializing Smart Contract Registry...');
            
            // Create directory structure
            await this.createDirectoryStructure();
            
            // Load existing templates
            await this.loadContractTemplates();
            
            // Load deployed contracts
            await this.loadDeployedContracts();
            
            // Initialize built-in templates
            await this.initializeBuiltInTemplates();
            
            this.emit('registry-initialized');
            logger.info('✅ Smart Contract Registry initialized successfully');
            
            return {
                success: true,
                templatesLoaded: this.templates.size,
                deployedContracts: this.deployedContracts.size,
                supportedCategories: Object.keys(this.TEMPLATE_CATEGORIES)
            };
        } catch (error) {
            logger.error('❌ Failed to initialize Smart Contract Registry', { error: error.message });
            throw error;
        }
    }

    async createDirectoryStructure() {
        const directories = [this.contractsPath, this.templatesPath, this.registryPath];
        
        for (const dir of directories) {
            try {
                await fs.access(dir);
            } catch {
                await fs.mkdir(dir, { recursive: true });
                logger.info(`📁 Created directory: ${dir}`);
            }
        }
    }

    async registerTemplate(templateData) {
        try {
            const {
                name,
                category,
                version,
                description,
                author,
                license,
                sourceCode,
                abi,
                bytecode,
                dependencies = [],
                parameters = [],
                tags = []
            } = templateData;

            // Validate template
            this.validateTemplate(templateData);

            const templateId = this.generateTemplateId(name, version);
            const template = {
                id: templateId,
                name,
                category,
                version,
                description,
                author,
                license,
                sourceCode,
                abi,
                bytecode,
                dependencies,
                parameters,
                tags,
                hash: this.calculateHash(sourceCode),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                deployments: [],
                state: this.CONTRACT_STATES.TEMPLATE,
                isBuiltIn: false,
                auditStatus: {
                    audited: false,
                    auditReport: null,
                    securityScore: null
                }
            };

            // Store template
            this.templates.set(templateId, template);
            
            // Save to file system
            await this.saveTemplate(template);
            
            this.auditTrail.push({
                action: 'template_registered',
                templateId,
                timestamp: new Date().toISOString(),
                metadata: { name, category, version }
            });

            this.emit('template-registered', template);
            logger.info(`📋 Template registered: ${name} v${version}`, { templateId });

            return template;
        } catch (error) {
            logger.error('❌ Failed to register template', { error: error.message });
            throw error;
        }
    }

    async deployContract(templateId, deploymentConfig) {
        try {
            const {
                name,
                constructorParams = [],
                network = 'aurigraph',
                deployer,
                gasLimit,
                metadata = {}
            } = deploymentConfig;

            const template = this.templates.get(templateId);
            if (!template) {
                throw new Error(`Template not found: ${templateId}`);
            }

            const contractId = this.generateContractId(name);
            const deploymentData = {
                id: contractId,
                templateId,
                name,
                network,
                deployer,
                constructorParams,
                gasLimit,
                metadata,
                state: this.CONTRACT_STATES.DEPLOYING,
                deployedAt: new Date().toISOString(),
                address: null,
                transactionHash: null,
                blockNumber: null,
                gasUsed: null,
                version: template.version,
                interactions: [],
                events: []
            };

            this.deployedContracts.set(contractId, deploymentData);

            try {
                // Deploy via DLT Integration
                const deploymentResult = await this.dltIntegration.deployContract({
                    abi: template.abi,
                    bytecode: template.bytecode,
                    constructorParams,
                    gasLimit
                });

                // Update deployment data
                deploymentData.address = deploymentResult.contractAddress;
                deploymentData.transactionHash = deploymentResult.transactionHash;
                deploymentData.blockNumber = deploymentResult.blockNumber;
                deploymentData.gasUsed = deploymentResult.gasUsed;
                deploymentData.state = this.CONTRACT_STATES.DEPLOYED;

                // Update template deployment history
                template.deployments.push({
                    contractId,
                    address: deploymentResult.contractAddress,
                    deployedAt: deploymentData.deployedAt,
                    network
                });

                // Save deployment
                await this.saveDeployment(deploymentData);

                this.auditTrail.push({
                    action: 'contract_deployed',
                    contractId,
                    templateId,
                    address: deploymentResult.contractAddress,
                    timestamp: new Date().toISOString()
                });

                this.emit('contract-deployed', deploymentData);
                logger.info(`🚀 Contract deployed: ${name}`, { 
                    contractId, 
                    address: deploymentResult.contractAddress 
                });

                return deploymentData;
            } catch (deployError) {
                deploymentData.state = 'failed';
                deploymentData.error = deployError.message;
                throw deployError;
            }
        } catch (error) {
            logger.error('❌ Failed to deploy contract', { error: error.message });
            throw error;
        }
    }

    async upgradeContract(contractId, newTemplateId, upgradeConfig = {}) {
        try {
            const contract = this.deployedContracts.get(contractId);
            if (!contract) {
                throw new Error(`Contract not found: ${contractId}`);
            }

            const newTemplate = this.templates.get(newTemplateId);
            if (!newTemplate) {
                throw new Error(`Template not found: ${newTemplateId}`);
            }

            // Create new deployment for upgrade
            const upgradeData = {
                ...upgradeConfig,
                name: `${contract.name}_v${newTemplate.version}`,
                metadata: {
                    ...contract.metadata,
                    previousVersion: contract.version,
                    upgradeReason: upgradeConfig.reason || 'Upgrade deployment'
                }
            };

            const newContract = await this.deployContract(newTemplateId, upgradeData);

            // Mark old contract as upgraded
            contract.state = this.CONTRACT_STATES.UPGRADED;
            contract.upgradedTo = newContract.id;
            contract.upgradedAt = new Date().toISOString();

            // Create version chain
            if (!this.contractVersions.has(contract.name)) {
                this.contractVersions.set(contract.name, []);
            }
            this.contractVersions.get(contract.name).push({
                contractId: newContract.id,
                version: newTemplate.version,
                deployedAt: newContract.deployedAt,
                previousVersion: contract.id
            });

            this.emit('contract-upgraded', { oldContract: contract, newContract });
            logger.info(`🔄 Contract upgraded: ${contract.name}`, { 
                from: contract.id, 
                to: newContract.id 
            });

            return newContract;
        } catch (error) {
            logger.error('❌ Failed to upgrade contract', { error: error.message });
            throw error;
        }
    }

    async pauseContract(contractId, reason = '') {
        return this.updateContractState(contractId, this.CONTRACT_STATES.PAUSED, { reason });
    }

    async resumeContract(contractId) {
        return this.updateContractState(contractId, this.CONTRACT_STATES.ACTIVE);
    }

    async deprecateContract(contractId, reason = '') {
        return this.updateContractState(contractId, this.CONTRACT_STATES.DEPRECATED, { reason });
    }

    async updateContractState(contractId, newState, metadata = {}) {
        try {
            const contract = this.deployedContracts.get(contractId);
            if (!contract) {
                throw new Error(`Contract not found: ${contractId}`);
            }

            const previousState = contract.state;
            contract.state = newState;
            contract.lastStateChange = new Date().toISOString();
            contract.stateMetadata = metadata;

            await this.saveDeployment(contract);

            this.auditTrail.push({
                action: 'state_changed',
                contractId,
                previousState,
                newState,
                metadata,
                timestamp: new Date().toISOString()
            });

            this.emit('contract-state-changed', { contractId, previousState, newState });
            logger.info(`🔄 Contract state changed: ${contractId}`, { previousState, newState });

            return contract;
        } catch (error) {
            logger.error('❌ Failed to update contract state', { error: error.message });
            throw error;
        }
    }

    async getTemplates(filters = {}) {
        const { category, tags, author, audited } = filters;
        let templates = Array.from(this.templates.values());

        if (category) {
            templates = templates.filter(t => t.category === category);
        }
        
        if (tags && tags.length > 0) {
            templates = templates.filter(t => 
                tags.some(tag => t.tags.includes(tag))
            );
        }
        
        if (author) {
            templates = templates.filter(t => t.author === author);
        }
        
        if (audited !== undefined) {
            templates = templates.filter(t => t.auditStatus.audited === audited);
        }

        return templates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    async getDeployedContracts(filters = {}) {
        const { network, state, templateId } = filters;
        let contracts = Array.from(this.deployedContracts.values());

        if (network) {
            contracts = contracts.filter(c => c.network === network);
        }
        
        if (state) {
            contracts = contracts.filter(c => c.state === state);
        }
        
        if (templateId) {
            contracts = contracts.filter(c => c.templateId === templateId);
        }

        return contracts.sort((a, b) => new Date(b.deployedAt) - new Date(a.deployedAt));
    }

    async getRegistryStatistics() {
        const templates = Array.from(this.templates.values());
        const contracts = Array.from(this.deployedContracts.values());

        return {
            templates: {
                total: templates.length,
                byCategory: this.groupBy(templates, 'category'),
                byAuthor: this.groupBy(templates, 'author'),
                audited: templates.filter(t => t.auditStatus.audited).length
            },
            contracts: {
                total: contracts.length,
                byState: this.groupBy(contracts, 'state'),
                byNetwork: this.groupBy(contracts, 'network'),
                active: contracts.filter(c => c.state === this.CONTRACT_STATES.ACTIVE).length
            },
            deployments: {
                totalDeployments: contracts.length,
                successfulDeployments: contracts.filter(c => c.state !== 'failed').length,
                failedDeployments: contracts.filter(c => c.state === 'failed').length,
                avgGasUsed: this.calculateAverage(contracts, 'gasUsed')
            },
            auditTrail: {
                totalEvents: this.auditTrail.length,
                lastActivity: this.auditTrail[this.auditTrail.length - 1]?.timestamp
            }
        };
    }

    async initializeBuiltInTemplates() {
        const builtInTemplates = [
            {
                name: 'TokenizedEquity',
                category: this.TEMPLATE_CATEGORIES.EQUITY,
                version: '1.0.0',
                description: 'ERC1155-based tokenized equity with fractional ownership',
                author: 'HMS Team',
                license: 'MIT',
                sourceCode: await this.loadSourceCode('TokenizedEquity.sol'),
                tags: ['equity', 'fractional', 'erc1155', 'ownership'],
                parameters: [
                    { name: 'companySymbol', type: 'string', description: 'Company stock symbol' },
                    { name: 'companyName', type: 'string', description: 'Company name' },
                    { name: 'totalShares', type: 'uint256', description: 'Total number of shares' },
                    { name: 'sharePrice', type: 'uint256', description: 'Price per share in wei' }
                ]
            },
            {
                name: 'CorporateActions',
                category: this.TEMPLATE_CATEGORIES.EQUITY,
                version: '1.0.0',
                description: 'Automated corporate actions for tokenized equities',
                author: 'HMS Team',
                license: 'MIT',
                sourceCode: await this.loadSourceCode('CorporateActions.sol'),
                tags: ['corporate', 'dividends', 'voting', 'automation'],
                parameters: [
                    { name: 'equityContract', type: 'address', description: 'Address of equity token contract' }
                ]
            },
            {
                name: 'MultiSigWallet',
                category: this.TEMPLATE_CATEGORIES.MULTISIG,
                version: '1.0.0',
                description: 'Multi-signature wallet for secure asset management',
                author: 'HMS Team',
                license: 'MIT',
                sourceCode: `// MultiSig Wallet Template
pragma solidity ^0.8.19;

contract MultiSigWallet {
    event Deposit(address indexed sender, uint amount, uint balance);
    event SubmitTransaction(address indexed owner, uint indexed txIndex, address indexed to, uint value, bytes data);
    event ConfirmTransaction(address indexed owner, uint indexed txIndex);
    event RevokeConfirmation(address indexed owner, uint indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint indexed txIndex);

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint public numConfirmationsRequired;

    struct Transaction {
        address to;
        uint value;
        bytes data;
        bool executed;
        uint numConfirmations;
    }

    mapping(uint => mapping(address => bool)) public isConfirmed;
    Transaction[] public transactions;

    constructor(address[] memory _owners, uint _numConfirmationsRequired) {
        require(_owners.length > 0, "owners required");
        require(_numConfirmationsRequired > 0 && _numConfirmationsRequired <= _owners.length, "invalid number of required confirmations");

        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "invalid owner");
            require(!isOwner[owner], "owner not unique");

            isOwner[owner] = true;
            owners.push(owner);
        }

        numConfirmationsRequired = _numConfirmationsRequired;
    }

    modifier onlyOwner() {
        require(isOwner[msg.sender], "not owner");
        _;
    }

    function submitTransaction(address _to, uint _value, bytes memory _data) public onlyOwner {
        uint txIndex = transactions.length;
        transactions.push(Transaction({
            to: _to,
            value: _value,
            data: _data,
            executed: false,
            numConfirmations: 0
        }));
        emit SubmitTransaction(msg.sender, txIndex, _to, _value, _data);
    }

    function confirmTransaction(uint _txIndex) public onlyOwner {
        require(_txIndex < transactions.length, "tx does not exist");
        require(!isConfirmed[_txIndex][msg.sender], "tx already confirmed");

        Transaction storage transaction = transactions[_txIndex];
        transaction.numConfirmations += 1;
        isConfirmed[_txIndex][msg.sender] = true;

        emit ConfirmTransaction(msg.sender, _txIndex);
    }

    function executeTransaction(uint _txIndex) public onlyOwner {
        require(_txIndex < transactions.length, "tx does not exist");

        Transaction storage transaction = transactions[_txIndex];

        require(transaction.numConfirmations >= numConfirmationsRequired, "cannot execute tx");

        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "tx failed");

        emit ExecuteTransaction(msg.sender, _txIndex);
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }
}`,
                tags: ['multisig', 'wallet', 'security', 'governance'],
                parameters: [
                    { name: 'owners', type: 'address[]', description: 'Array of wallet owners' },
                    { name: 'requiredConfirmations', type: 'uint256', description: 'Number of confirmations required' }
                ]
            }
        ];

        for (const templateData of builtInTemplates) {
            if (!this.templates.has(this.generateTemplateId(templateData.name, templateData.version))) {
                const template = await this.registerTemplate(templateData);
                template.isBuiltIn = true;
                logger.info(`📋 Built-in template registered: ${templateData.name}`);
            }
        }
    }

    // Helper methods
    validateTemplate(templateData) {
        const required = ['name', 'category', 'version', 'description', 'sourceCode'];
        for (const field of required) {
            if (!templateData[field]) {
                throw new Error(`Template validation failed: ${field} is required`);
            }
        }

        if (!Object.values(this.TEMPLATE_CATEGORIES).includes(templateData.category)) {
            throw new Error(`Invalid category: ${templateData.category}`);
        }
    }

    generateTemplateId(name, version) {
        return `${name.toLowerCase().replace(/\s+/g, '-')}-${version}`;
    }

    generateContractId(name) {
        const timestamp = Date.now();
        const hash = crypto.createHash('sha256').update(`${name}-${timestamp}`).digest('hex').substr(0, 8);
        return `${name.toLowerCase().replace(/\s+/g, '-')}-${hash}`;
    }

    calculateHash(content) {
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key] || 'unknown';
            groups[group] = (groups[group] || 0) + 1;
            return groups;
        }, {});
    }

    calculateAverage(array, key) {
        const values = array.map(item => item[key]).filter(val => val !== null && val !== undefined);
        return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    }

    async loadSourceCode(filename) {
        try {
            const filePath = path.join(this.contractsPath, filename);
            return await fs.readFile(filePath, 'utf-8');
        } catch (error) {
            logger.warn(`⚠️ Could not load source code for ${filename}: ${error.message}`);
            return `// Source code for ${filename} not found`;
        }
    }

    async saveTemplate(template) {
        const filePath = path.join(this.templatesPath, `${template.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(template, null, 2));
    }

    async saveDeployment(deployment) {
        const filePath = path.join(this.registryPath, `${deployment.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(deployment, null, 2));
    }

    async loadContractTemplates() {
        try {
            const files = await fs.readdir(this.templatesPath);
            const jsonFiles = files.filter(file => file.endsWith('.json'));
            
            for (const file of jsonFiles) {
                try {
                    const filePath = path.join(this.templatesPath, file);
                    const content = await fs.readFile(filePath, 'utf-8');
                    const template = JSON.parse(content);
                    this.templates.set(template.id, template);
                } catch (error) {
                    logger.warn(`⚠️ Failed to load template ${file}: ${error.message}`);
                }
            }
            
            logger.info(`📋 Loaded ${this.templates.size} templates`);
        } catch (error) {
            logger.warn(`⚠️ Templates directory not found: ${error.message}`);
        }
    }

    async loadDeployedContracts() {
        try {
            const files = await fs.readdir(this.registryPath);
            const jsonFiles = files.filter(file => file.endsWith('.json'));
            
            for (const file of jsonFiles) {
                try {
                    const filePath = path.join(this.registryPath, file);
                    const content = await fs.readFile(filePath, 'utf-8');
                    const deployment = JSON.parse(content);
                    this.deployedContracts.set(deployment.id, deployment);
                } catch (error) {
                    logger.warn(`⚠️ Failed to load deployment ${file}: ${error.message}`);
                }
            }
            
            logger.info(`🚀 Loaded ${this.deployedContracts.size} deployed contracts`);
        } catch (error) {
            logger.warn(`⚠️ Registry directory not found: ${error.message}`);
        }
    }
}

module.exports = SmartContractRegistry;