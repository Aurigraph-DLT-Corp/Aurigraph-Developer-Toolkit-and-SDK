// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./TokenizedEquity.sol";

/**
 * @title CorporateActions
 * @dev Smart contract for automated corporate actions including stock splits,
 *      spin-offs, mergers, and advanced dividend distributions
 */
contract CorporateActions is AccessControl, Pausable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant CORPORATE_ROLE = keccak256("CORPORATE_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    
    // References to equity contract
    TokenizedEquity public immutable equityContract;
    
    // Action types
    enum ActionType {
        STOCK_SPLIT,
        STOCK_DIVIDEND,
        CASH_DIVIDEND,
        RIGHTS_OFFERING,
        SPIN_OFF,
        MERGER,
        SPECIAL_DIVIDEND,
        SHARE_BUYBACK
    }
    
    // Corporate action structure
    struct CorporateAction {
        uint256 actionId;
        ActionType actionType;
        uint256 tokenId;           // Affected equity token
        string description;
        uint256 recordDate;        // Eligibility date
        uint256 executionDate;     // When action takes effect
        uint256 exDate;           // Ex-dividend date
        bool executed;
        bool canceled;
        mapping(string => bytes) parameters; // Flexible parameters
    }
    
    // Stock split parameters
    struct StockSplit {
        uint256 splitRatio;        // e.g., 2 for 2:1 split
        uint256 newTotalShares;
        uint256 newFractionalUnits;
    }
    
    // Dividend parameters
    struct DividendAction {
        uint256 totalAmount;
        uint256 perShareAmount;
        address paymentToken;      // Address(0) for ETH
        bool isSpecialDividend;
        uint256 taxRate;          // Tax withholding rate
    }
    
    // Rights offering parameters
    struct RightsOffering {
        uint256 rightsRatio;      // e.g., 1:10 (1 right per 10 shares)
        uint256 subscriptionPrice;
        uint256 subscriptionPeriod;
        uint256 newTokenId;       // Token ID for new shares
    }
    
    // Merger parameters
    struct Merger {
        uint256 exchangeRatio;    // New shares per old share
        uint256 newTokenId;       // New company token ID
        address newIssuer;
        bool cashOption;
        uint256 cashAmount;
    }
    
    // Storage
    mapping(uint256 => CorporateAction) public corporateActions;
    mapping(uint256 => StockSplit) public stockSplits;
    mapping(uint256 => DividendAction) public dividendActions;
    mapping(uint256 => RightsOffering) public rightsOfferings;
    mapping(uint256 => Merger) public mergers;
    
    // Tracking
    mapping(address => mapping(uint256 => bool)) public actionClaimed;
    mapping(uint256 => uint256[]) public tokenActions; // tokenId => actionIds
    
    Counters.Counter private _actionIdCounter;
    
    // Events
    event CorporateActionAnnounced(
        uint256 indexed actionId,
        ActionType actionType,
        uint256 indexed tokenId,
        string description,
        uint256 recordDate,
        uint256 executionDate
    );
    
    event StockSplitExecuted(
        uint256 indexed actionId,
        uint256 indexed tokenId,
        uint256 splitRatio,
        uint256 newTotalShares
    );
    
    event DividendProcessed(
        uint256 indexed actionId,
        uint256 indexed tokenId,
        uint256 totalAmount,
        uint256 perShareAmount
    );
    
    event RightsOfferingLaunched(
        uint256 indexed actionId,
        uint256 indexed tokenId,
        uint256 rightsRatio,
        uint256 subscriptionPrice
    );
    
    event MergerExecuted(
        uint256 indexed actionId,
        uint256 oldTokenId,
        uint256 newTokenId,
        uint256 exchangeRatio
    );
    
    event ActionClaimed(
        uint256 indexed actionId,
        address indexed shareholder,
        uint256 amount
    );
    
    event ActionCanceled(
        uint256 indexed actionId,
        string reason
    );
    
    constructor(address _equityContract) {
        equityContract = TokenizedEquity(_equityContract);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(CORPORATE_ROLE, msg.sender);
        _grantRole(COMPLIANCE_ROLE, msg.sender);
    }
    
    /**
     * @dev Announce a stock split
     */
    function announceStockSplit(
        uint256 tokenId,
        uint256 splitRatio,
        uint256 recordDate,
        uint256 executionDate,
        string memory description
    ) external onlyRole(CORPORATE_ROLE) returns (uint256) {
        require(splitRatio > 1, "Split ratio must be greater than 1");
        require(recordDate > block.timestamp, "Record date must be in the future");
        require(executionDate > recordDate, "Execution date must be after record date");
        
        _actionIdCounter.increment();
        uint256 actionId = _actionIdCounter.current();
        
        // Get current equity info
        (,, uint256 totalShares,, uint256 fractionalUnits,,,,,,) = equityContract.getEquityToken(tokenId);
        
        // Create corporate action
        CorporateAction storage action = corporateActions[actionId];
        action.actionId = actionId;
        action.actionType = ActionType.STOCK_SPLIT;
        action.tokenId = tokenId;
        action.description = description;
        action.recordDate = recordDate;
        action.executionDate = executionDate;
        action.executed = false;
        action.canceled = false;
        
        // Create stock split details
        stockSplits[actionId] = StockSplit({
            splitRatio: splitRatio,
            newTotalShares: totalShares * splitRatio,
            newFractionalUnits: fractionalUnits * splitRatio
        });
        
        tokenActions[tokenId].push(actionId);
        
        emit CorporateActionAnnounced(
            actionId,
            ActionType.STOCK_SPLIT,
            tokenId,
            description,
            recordDate,
            executionDate
        );
        
        return actionId;
    }
    
    /**
     * @dev Execute a stock split
     */
    function executeStockSplit(uint256 actionId) external onlyRole(CORPORATE_ROLE) {
        CorporateAction storage action = corporateActions[actionId];
        require(action.actionType == ActionType.STOCK_SPLIT, "Not a stock split");
        require(block.timestamp >= action.executionDate, "Execution date not reached");
        require(!action.executed, "Action already executed");
        require(!action.canceled, "Action was canceled");
        
        StockSplit storage split = stockSplits[actionId];
        
        // Update equity token (this would require admin role on equity contract)
        // For now, we emit event and external system handles the update
        
        action.executed = true;
        
        emit StockSplitExecuted(
            actionId,
            action.tokenId,
            split.splitRatio,
            split.newTotalShares
        );
    }
    
    /**
     * @dev Announce cash dividend
     */
    function announceCashDividend(
        uint256 tokenId,
        uint256 totalAmount,
        uint256 recordDate,
        uint256 executionDate,
        uint256 exDate,
        uint256 taxRate,
        string memory description
    ) external payable onlyRole(CORPORATE_ROLE) returns (uint256) {
        require(msg.value >= totalAmount, "Insufficient dividend funding");
        require(recordDate > block.timestamp, "Record date must be in the future");
        require(executionDate > recordDate, "Execution date must be after record date");
        require(exDate <= recordDate, "Ex-date must be before or on record date");
        require(taxRate <= 100, "Tax rate cannot exceed 100%");
        
        _actionIdCounter.increment();
        uint256 actionId = _actionIdCounter.current();
        
        // Get equity info to calculate per-share amount
        (,, uint256 totalShares,,,,,,,) = equityContract.getEquityToken(tokenId);
        uint256 perShareAmount = totalAmount / totalShares;
        
        // Create corporate action
        CorporateAction storage action = corporateActions[actionId];
        action.actionId = actionId;
        action.actionType = ActionType.CASH_DIVIDEND;
        action.tokenId = tokenId;
        action.description = description;
        action.recordDate = recordDate;
        action.executionDate = executionDate;
        action.exDate = exDate;
        action.executed = false;
        action.canceled = false;
        
        // Create dividend details
        dividendActions[actionId] = DividendAction({
            totalAmount: totalAmount,
            perShareAmount: perShareAmount,
            paymentToken: address(0), // ETH
            isSpecialDividend: false,
            taxRate: taxRate
        });
        
        tokenActions[tokenId].push(actionId);
        
        emit CorporateActionAnnounced(
            actionId,
            ActionType.CASH_DIVIDEND,
            tokenId,
            description,
            recordDate,
            executionDate
        );
        
        return actionId;
    }
    
    /**
     * @dev Claim dividend from cash dividend action
     */
    function claimDividend(uint256 actionId) external nonReentrant {
        CorporateAction storage action = corporateActions[actionId];
        require(action.actionType == ActionType.CASH_DIVIDEND, "Not a cash dividend");
        require(block.timestamp >= action.executionDate, "Execution date not reached");
        require(!action.canceled, "Action was canceled");
        require(!actionClaimed[msg.sender][actionId], "Dividend already claimed");
        
        // Check shareholder balance at record date (simplified - use current balance)
        uint256 shareholderBalance = equityContract.balanceOf(msg.sender, action.tokenId);
        require(shareholderBalance > 0, "No shares owned");
        
        DividendAction storage dividend = dividendActions[actionId];
        
        // Get equity info for calculation
        (,, uint256 totalShares,, uint256 fractionalUnits,,,,,,) = equityContract.getEquityToken(action.tokenId);
        
        // Calculate dividend amount based on fractional ownership
        uint256 dividendAmount = (dividend.perShareAmount * shareholderBalance * totalShares) / fractionalUnits;
        
        // Apply tax withholding
        uint256 taxAmount = (dividendAmount * dividend.taxRate) / 100;
        uint256 netDividend = dividendAmount - taxAmount;
        
        actionClaimed[msg.sender][actionId] = true;
        
        // Transfer dividend
        payable(msg.sender).transfer(netDividend);
        
        emit ActionClaimed(actionId, msg.sender, netDividend);
    }
    
    /**
     * @dev Announce rights offering
     */
    function announceRightsOffering(
        uint256 tokenId,
        uint256 rightsRatio,
        uint256 subscriptionPrice,
        uint256 recordDate,
        uint256 executionDate,
        uint256 subscriptionPeriod,
        string memory description
    ) external onlyRole(CORPORATE_ROLE) returns (uint256) {
        require(rightsRatio > 0, "Rights ratio must be greater than 0");
        require(subscriptionPrice > 0, "Subscription price must be greater than 0");
        require(recordDate > block.timestamp, "Record date must be in the future");
        require(executionDate > recordDate, "Execution date must be after record date");
        require(subscriptionPeriod > 0, "Subscription period must be greater than 0");
        
        _actionIdCounter.increment();
        uint256 actionId = _actionIdCounter.current();
        
        // Create corporate action
        CorporateAction storage action = corporateActions[actionId];
        action.actionId = actionId;
        action.actionType = ActionType.RIGHTS_OFFERING;
        action.tokenId = tokenId;
        action.description = description;
        action.recordDate = recordDate;
        action.executionDate = executionDate;
        action.executed = false;
        action.canceled = false;
        
        // Create rights offering details
        rightsOfferings[actionId] = RightsOffering({
            rightsRatio: rightsRatio,
            subscriptionPrice: subscriptionPrice,
            subscriptionPeriod: subscriptionPeriod,
            newTokenId: 0 // Will be set when new shares are created
        });
        
        tokenActions[tokenId].push(actionId);
        
        emit CorporateActionAnnounced(
            actionId,
            ActionType.RIGHTS_OFFERING,
            tokenId,
            description,
            recordDate,
            executionDate
        );
        
        return actionId;
    }
    
    /**
     * @dev Exercise rights in rights offering
     */
    function exerciseRights(
        uint256 actionId,
        uint256 rightsToExercise
    ) external payable nonReentrant {
        CorporateAction storage action = corporateActions[actionId];
        require(action.actionType == ActionType.RIGHTS_OFFERING, "Not a rights offering");
        require(block.timestamp >= action.executionDate, "Execution date not reached");
        require(block.timestamp <= action.executionDate + rightsOfferings[actionId].subscriptionPeriod, "Subscription period ended");
        require(!action.canceled, "Action was canceled");
        require(rightsToExercise > 0, "Must exercise at least one right");
        
        RightsOffering storage offering = rightsOfferings[actionId];
        
        // Check shareholder balance for rights eligibility
        uint256 shareholderBalance = equityContract.balanceOf(msg.sender, action.tokenId);
        uint256 availableRights = shareholderBalance / offering.rightsRatio;
        require(availableRights >= rightsToExercise, "Insufficient rights");
        
        // Calculate payment required
        uint256 paymentRequired = rightsToExercise * offering.subscriptionPrice;
        require(msg.value >= paymentRequired, "Insufficient payment");
        
        // This would mint new shares (requires integration with equity contract)
        // For now, emit event for external processing
        
        // Refund excess payment
        if (msg.value > paymentRequired) {
            payable(msg.sender).transfer(msg.value - paymentRequired);
        }
        
        emit ActionClaimed(actionId, msg.sender, rightsToExercise);
    }
    
    /**
     * @dev Announce merger
     */
    function announceMerger(
        uint256 oldTokenId,
        uint256 exchangeRatio,
        address newIssuer,
        uint256 recordDate,
        uint256 executionDate,
        bool cashOption,
        uint256 cashAmount,
        string memory description
    ) external onlyRole(CORPORATE_ROLE) returns (uint256) {
        require(exchangeRatio > 0, "Exchange ratio must be greater than 0");
        require(newIssuer != address(0), "New issuer cannot be zero address");
        require(recordDate > block.timestamp, "Record date must be in the future");
        require(executionDate > recordDate, "Execution date must be after record date");
        
        _actionIdCounter.increment();
        uint256 actionId = _actionIdCounter.current();
        
        // Create corporate action
        CorporateAction storage action = corporateActions[actionId];
        action.actionId = actionId;
        action.actionType = ActionType.MERGER;
        action.tokenId = oldTokenId;
        action.description = description;
        action.recordDate = recordDate;
        action.executionDate = executionDate;
        action.executed = false;
        action.canceled = false;
        
        // Create merger details
        mergers[actionId] = Merger({
            exchangeRatio: exchangeRatio,
            newTokenId: 0, // Will be set when new token is created
            newIssuer: newIssuer,
            cashOption: cashOption,
            cashAmount: cashAmount
        });
        
        tokenActions[oldTokenId].push(actionId);
        
        emit CorporateActionAnnounced(
            actionId,
            ActionType.MERGER,
            oldTokenId,
            description,
            recordDate,
            executionDate
        );
        
        return actionId;
    }
    
    /**
     * @dev Cancel a corporate action
     */
    function cancelAction(
        uint256 actionId,
        string memory reason
    ) external onlyRole(CORPORATE_ROLE) {
        CorporateAction storage action = corporateActions[actionId];
        require(!action.executed, "Cannot cancel executed action");
        require(!action.canceled, "Action already canceled");
        
        action.canceled = true;
        
        emit ActionCanceled(actionId, reason);
    }
    
    /**
     * @dev Get corporate action details
     */
    function getCorporateAction(uint256 actionId) external view returns (
        ActionType actionType,
        uint256 tokenId,
        string memory description,
        uint256 recordDate,
        uint256 executionDate,
        bool executed,
        bool canceled
    ) {
        CorporateAction storage action = corporateActions[actionId];
        return (
            action.actionType,
            action.tokenId,
            action.description,
            action.recordDate,
            action.executionDate,
            action.executed,
            action.canceled
        );
    }
    
    /**
     * @dev Get actions for a token
     */
    function getTokenActions(uint256 tokenId) external view returns (uint256[] memory) {
        return tokenActions[tokenId];
    }
    
    /**
     * @dev Check if action was claimed by user
     */
    function hasClaimedAction(address user, uint256 actionId) external view returns (bool) {
        return actionClaimed[user][actionId];
    }
    
    /**
     * @dev Emergency functions
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    function emergencyWithdraw() external onlyRole(ADMIN_ROLE) {
        payable(msg.sender).transfer(address(this).balance);
    }
}