// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title TokenizedEquity
 * @dev Smart contract for tokenizing equities with fractional ownership, 
 *      automated corporate actions, and programmable equity features
 */
contract TokenizedEquity is ERC1155, AccessControl, Pausable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant TRANSFER_AGENT_ROLE = keccak256("TRANSFER_AGENT_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    
    // Token ID counter
    Counters.Counter private _tokenIdCounter;
    
    // Equity token structure
    struct EquityToken {
        string companySymbol;      // Stock symbol (e.g., AAPL, GOOGL)
        string companyName;        // Company name
        uint256 totalShares;       // Total shares represented
        uint256 sharePrice;        // Price per share in wei
        uint256 fractionalUnits;   // Number of fractional units
        bool tradingEnabled;       // Whether trading is enabled
        bool dividendsEnabled;     // Whether dividends are enabled
        bool votingEnabled;        // Whether voting is enabled
        address issuer;           // Company/issuer address
        uint256 issuanceDate;     // When the token was created
        string regulatoryStatus;  // Regulatory compliance status
    }
    
    // Dividend structure
    struct Dividend {
        uint256 tokenId;
        uint256 totalDividend;    // Total dividend amount
        uint256 perShareDividend; // Dividend per share
        uint256 recordDate;       // Snapshot date for eligibility
        uint256 paymentDate;      // When dividends are paid
        bool processed;           // Whether dividend has been processed
        mapping(address => bool) claimed; // Track claimed dividends
    }
    
    // Voting structure
    struct Vote {
        uint256 tokenId;
        string proposal;
        uint256 startTime;
        uint256 endTime;
        uint256 totalVotes;
        bool executed;
        mapping(address => uint256) votes; // address => voting power used
        mapping(uint256 => uint256) options; // option => vote count
    }
    
    // Storage
    mapping(uint256 => EquityToken) public equityTokens;
    mapping(uint256 => Dividend) public dividends;
    mapping(uint256 => Vote) public votes;
    mapping(address => bool) public kycVerified;
    mapping(address => mapping(uint256 => uint256)) public votingPower;
    
    // Counters
    Counters.Counter private _dividendCounter;
    Counters.Counter private _voteCounter;
    
    // Events
    event EquityTokenized(
        uint256 indexed tokenId,
        string companySymbol,
        uint256 totalShares,
        uint256 fractionalUnits,
        address indexed issuer
    );
    
    event DividendDeclared(
        uint256 indexed dividendId,
        uint256 indexed tokenId,
        uint256 totalDividend,
        uint256 recordDate,
        uint256 paymentDate
    );
    
    event DividendClaimed(
        uint256 indexed dividendId,
        address indexed shareholder,
        uint256 amount
    );
    
    event VotingStarted(
        uint256 indexed voteId,
        uint256 indexed tokenId,
        string proposal,
        uint256 endTime
    );
    
    event VoteCast(
        uint256 indexed voteId,
        address indexed voter,
        uint256 votingPower,
        uint256 option
    );
    
    event FractionalTransfer(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        uint256 fractionalAmount
    );
    
    event ComplianceStatusUpdated(
        address indexed user,
        bool kycStatus
    );
    
    constructor() ERC1155("https://api.aurigraph.io/tokens/{id}.json") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, msg.sender);
        _grantRole(TRANSFER_AGENT_ROLE, msg.sender);
        _grantRole(COMPLIANCE_ROLE, msg.sender);
    }
    
    /**
     * @dev Tokenize equity shares for a company
     */
    function tokenizeEquity(
        string memory companySymbol,
        string memory companyName,
        uint256 totalShares,
        uint256 sharePrice,
        uint256 fractionalUnits,
        string memory regulatoryStatus
    ) external onlyRole(ISSUER_ROLE) returns (uint256) {
        require(totalShares > 0, "Total shares must be greater than 0");
        require(fractionalUnits > 0, "Fractional units must be greater than 0");
        require(sharePrice > 0, "Share price must be greater than 0");
        
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        
        equityTokens[tokenId] = EquityToken({
            companySymbol: companySymbol,
            companyName: companyName,
            totalShares: totalShares,
            sharePrice: sharePrice,
            fractionalUnits: fractionalUnits,
            tradingEnabled: true,
            dividendsEnabled: true,
            votingEnabled: true,
            issuer: msg.sender,
            issuanceDate: block.timestamp,
            regulatoryStatus: regulatoryStatus
        });
        
        // Mint initial fractional units to issuer
        _mint(msg.sender, tokenId, fractionalUnits, "");
        
        emit EquityTokenized(
            tokenId,
            companySymbol,
            totalShares,
            fractionalUnits,
            msg.sender
        );
        
        return tokenId;
    }
    
    /**
     * @dev Purchase fractional equity tokens
     */
    function purchaseFractionalEquity(
        uint256 tokenId,
        uint256 fractionalAmount
    ) external payable nonReentrant whenNotPaused {
        require(kycVerified[msg.sender], "KYC verification required");
        require(equityTokens[tokenId].tradingEnabled, "Trading is disabled");
        require(fractionalAmount > 0, "Amount must be greater than 0");
        
        EquityToken storage equity = equityTokens[tokenId];
        
        // Calculate cost based on fractional ownership
        uint256 costPerFraction = (equity.sharePrice * equity.totalShares) / equity.fractionalUnits;
        uint256 totalCost = costPerFraction * fractionalAmount;
        
        require(msg.value >= totalCost, "Insufficient payment");
        
        // Transfer tokens from issuer to buyer
        _safeTransferFrom(
            equity.issuer,
            msg.sender,
            tokenId,
            fractionalAmount,
            ""
        );
        
        // Update voting power
        votingPower[msg.sender][tokenId] += fractionalAmount;
        
        // Refund excess payment
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
        
        // Transfer payment to issuer
        payable(equity.issuer).transfer(totalCost);
        
        emit FractionalTransfer(tokenId, equity.issuer, msg.sender, fractionalAmount);
    }
    
    /**
     * @dev Declare dividend for tokenized equity
     */
    function declareDividend(
        uint256 tokenId,
        uint256 totalDividend,
        uint256 recordDate,
        uint256 paymentDate
    ) external payable onlyRole(ISSUER_ROLE) {
        require(equityTokens[tokenId].dividendsEnabled, "Dividends are disabled");
        require(msg.value >= totalDividend, "Insufficient dividend amount");
        require(recordDate <= block.timestamp, "Record date must be in the past");
        require(paymentDate > block.timestamp, "Payment date must be in the future");
        
        _dividendCounter.increment();
        uint256 dividendId = _dividendCounter.current();
        
        EquityToken storage equity = equityTokens[tokenId];
        uint256 perShareDividend = totalDividend / equity.totalShares;
        
        Dividend storage dividend = dividends[dividendId];
        dividend.tokenId = tokenId;
        dividend.totalDividend = totalDividend;
        dividend.perShareDividend = perShareDividend;
        dividend.recordDate = recordDate;
        dividend.paymentDate = paymentDate;
        dividend.processed = false;
        
        emit DividendDeclared(
            dividendId,
            tokenId,
            totalDividend,
            recordDate,
            paymentDate
        );
    }
    
    /**
     * @dev Claim dividend for fractional equity ownership
     */
    function claimDividend(uint256 dividendId) external nonReentrant {
        Dividend storage dividend = dividends[dividendId];
        require(!dividend.claimed[msg.sender], "Dividend already claimed");
        require(block.timestamp >= dividend.paymentDate, "Payment date not reached");
        
        uint256 shareholderBalance = balanceOf(msg.sender, dividend.tokenId);
        require(shareholderBalance > 0, "No shares owned");
        
        EquityToken storage equity = equityTokens[dividend.tokenId];
        
        // Calculate dividend amount based on fractional ownership
        uint256 dividendAmount = (dividend.perShareDividend * shareholderBalance * equity.totalShares) / equity.fractionalUnits;
        
        dividend.claimed[msg.sender] = true;
        
        // Transfer dividend
        payable(msg.sender).transfer(dividendAmount);
        
        emit DividendClaimed(dividendId, msg.sender, dividendAmount);
    }
    
    /**
     * @dev Start voting on a proposal
     */
    function startVoting(
        uint256 tokenId,
        string memory proposal,
        uint256 duration
    ) external onlyRole(ISSUER_ROLE) returns (uint256) {
        require(equityTokens[tokenId].votingEnabled, "Voting is disabled");
        require(duration > 0, "Duration must be greater than 0");
        
        _voteCounter.increment();
        uint256 voteId = _voteCounter.current();
        
        Vote storage vote = votes[voteId];
        vote.tokenId = tokenId;
        vote.proposal = proposal;
        vote.startTime = block.timestamp;
        vote.endTime = block.timestamp + duration;
        vote.totalVotes = 0;
        vote.executed = false;
        
        emit VotingStarted(voteId, tokenId, proposal, vote.endTime);
        
        return voteId;
    }
    
    /**
     * @dev Cast vote on a proposal
     */
    function castVote(
        uint256 voteId,
        uint256 option,
        uint256 votingPowerToUse
    ) external {
        Vote storage vote = votes[voteId];
        require(block.timestamp >= vote.startTime, "Voting not started");
        require(block.timestamp <= vote.endTime, "Voting ended");
        require(!vote.executed, "Vote already executed");
        
        uint256 availableVotingPower = votingPower[msg.sender][vote.tokenId];
        require(availableVotingPower >= votingPowerToUse, "Insufficient voting power");
        require(votingPowerToUse > 0, "Voting power must be greater than 0");
        
        // Reduce available voting power
        votingPower[msg.sender][vote.tokenId] -= votingPowerToUse;
        
        // Record vote
        vote.votes[msg.sender] += votingPowerToUse;
        vote.options[option] += votingPowerToUse;
        vote.totalVotes += votingPowerToUse;
        
        emit VoteCast(voteId, msg.sender, votingPowerToUse, option);
    }
    
    /**
     * @dev Enable/disable trading for a tokenized equity
     */
    function setTradingEnabled(
        uint256 tokenId,
        bool enabled
    ) external onlyRole(ADMIN_ROLE) {
        equityTokens[tokenId].tradingEnabled = enabled;
    }
    
    /**
     * @dev Enable/disable dividends for a tokenized equity
     */
    function setDividendsEnabled(
        uint256 tokenId,
        bool enabled
    ) external onlyRole(ADMIN_ROLE) {
        equityTokens[tokenId].dividendsEnabled = enabled;
    }
    
    /**
     * @dev Enable/disable voting for a tokenized equity
     */
    function setVotingEnabled(
        uint256 tokenId,
        bool enabled
    ) external onlyRole(ADMIN_ROLE) {
        equityTokens[tokenId].votingEnabled = enabled;
    }
    
    /**
     * @dev Update KYC verification status
     */
    function updateKYCStatus(
        address user,
        bool verified
    ) external onlyRole(COMPLIANCE_ROLE) {
        kycVerified[user] = verified;
        emit ComplianceStatusUpdated(user, verified);
    }
    
    /**
     * @dev Get equity token information
     */
    function getEquityToken(uint256 tokenId) external view returns (
        string memory companySymbol,
        string memory companyName,
        uint256 totalShares,
        uint256 sharePrice,
        uint256 fractionalUnits,
        bool tradingEnabled,
        bool dividendsEnabled,
        bool votingEnabled,
        address issuer,
        uint256 issuanceDate,
        string memory regulatoryStatus
    ) {
        EquityToken storage equity = equityTokens[tokenId];
        return (
            equity.companySymbol,
            equity.companyName,
            equity.totalShares,
            equity.sharePrice,
            equity.fractionalUnits,
            equity.tradingEnabled,
            equity.dividendsEnabled,
            equity.votingEnabled,
            equity.issuer,
            equity.issuanceDate,
            equity.regulatoryStatus
        );
    }
    
    /**
     * @dev Get voting power for a user and token
     */
    function getVotingPower(address user, uint256 tokenId) external view returns (uint256) {
        return votingPower[user][tokenId];
    }
    
    /**
     * @dev Get vote results
     */
    function getVoteResults(uint256 voteId, uint256 option) external view returns (uint256) {
        return votes[voteId].options[option];
    }
    
    /**
     * @dev Override transfer to add compliance checks
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override whenNotPaused {
        // Compliance checks for transfers
        if (to != address(0) && from != address(0)) {
            require(kycVerified[to], "Recipient must be KYC verified");
            
            // Check if trading is enabled for each token
            for (uint256 i = 0; i < ids.length; i++) {
                require(equityTokens[ids[i]].tradingEnabled, "Trading is disabled for this equity");
            }
        }
        
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
    
    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev See {IERC165-supportsInterface}
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    
    /**
     * @dev Emergency withdraw function
     */
    function emergencyWithdraw() external onlyRole(ADMIN_ROLE) {
        payable(msg.sender).transfer(address(this).balance);
    }
}