// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title UtilityToken
 * @dev ERC20 utility token with burning, capping, and service integration capabilities
 * Designed for platform utilities, payments, staking, and service access
 */
contract UtilityToken is ERC20, ERC20Burnable, ERC20Capped, AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant SERVICE_ROLE = keccak256("SERVICE_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    // Service integration
    struct Service {
        bool active;
        uint256 cost;
        uint256 discount; // percentage discount for token holders
        string name;
        string description;
    }

    // Staking system
    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 rewardRate;
        uint256 lastClaimTime;
    }

    // Token economics
    uint256 public inflationRate; // annual inflation rate in basis points (100 = 1%)
    uint256 public lastInflationTime;
    uint256 public totalBurned;
    uint256 public totalStaked;
    
    // Service and utility mappings
    mapping(bytes32 => Service) public services;
    mapping(address => StakeInfo) public stakes;
    mapping(address => uint256) public serviceUsage;
    mapping(address => uint256) public loyaltyPoints;
    
    // Arrays for enumeration
    bytes32[] public serviceIds;
    
    // Events
    event ServiceRegistered(bytes32 indexed serviceId, string name, uint256 cost);
    event ServiceUsed(address indexed user, bytes32 indexed serviceId, uint256 cost, uint256 discount);
    event TokensStaked(address indexed user, uint256 amount);
    event TokensUnstaked(address indexed user, uint256 amount, uint256 rewards);
    event RewardsClaimed(address indexed user, uint256 rewards);
    event LoyaltyPointsEarned(address indexed user, uint256 points);
    event InflationMinted(uint256 amount, uint256 timestamp);
    event TokensBurned(address indexed burner, uint256 amount, string reason);

    constructor(
        string memory name,
        string memory symbol,
        uint256 cap,
        uint256 initialSupply,
        address admin,
        uint256 _inflationRate
    ) ERC20(name, symbol) ERC20Capped(cap) {
        require(admin != address(0), "Admin cannot be zero address");
        require(initialSupply <= cap, "Initial supply exceeds cap");
        require(_inflationRate <= 10000, "Inflation rate too high"); // Max 100%
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(SERVICE_ROLE, admin);
        _grantRole(BURNER_ROLE, admin);
        
        inflationRate = _inflationRate;
        lastInflationTime = block.timestamp;
        
        if (initialSupply > 0) {
            _mint(admin, initialSupply);
        }
    }

    // Minting functions
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function batchMint(address[] calldata recipients, uint256[] calldata amounts) 
        external 
        onlyRole(MINTER_ROLE) 
    {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
        }
    }

    // Inflation mechanism
    function mintInflation() public {
        require(block.timestamp >= lastInflationTime + 365 days, "Inflation already minted this year");
        
        uint256 inflationAmount = (totalSupply() * inflationRate) / 10000;
        
        if (totalSupply() + inflationAmount <= cap()) {
            lastInflationTime = block.timestamp;
            _mint(address(this), inflationAmount);
            emit InflationMinted(inflationAmount, block.timestamp);
        }
    }

    // Service management
    function registerService(
        bytes32 serviceId,
        string memory name,
        string memory description,
        uint256 cost,
        uint256 discount
    ) public onlyRole(SERVICE_ROLE) {
        require(!services[serviceId].active, "Service already exists");
        require(cost > 0, "Cost must be greater than 0");
        require(discount <= 100, "Discount cannot exceed 100%");
        
        services[serviceId] = Service({
            active: true,
            cost: cost,
            discount: discount,
            name: name,
            description: description
        });
        
        serviceIds.push(serviceId);
        emit ServiceRegistered(serviceId, name, cost);
    }

    function updateService(
        bytes32 serviceId,
        uint256 cost,
        uint256 discount,
        bool active
    ) public onlyRole(SERVICE_ROLE) {
        require(services[serviceId].active || !active, "Service does not exist");
        require(discount <= 100, "Discount cannot exceed 100%");
        
        services[serviceId].cost = cost;
        services[serviceId].discount = discount;
        services[serviceId].active = active;
    }

    function useService(bytes32 serviceId) public nonReentrant {
        Service storage service = services[serviceId];
        require(service.active, "Service not active");
        
        uint256 tokenBalance = balanceOf(msg.sender);
        uint256 cost = service.cost;
        uint256 discount = 0;
        
        // Apply discount for token holders
        if (tokenBalance > 0) {
            discount = (cost * service.discount) / 100;
            cost -= discount;
        }
        
        require(tokenBalance >= cost, "Insufficient token balance");
        
        // Burn tokens for service usage
        _burn(msg.sender, cost);
        totalBurned += cost;
        
        // Track usage and award loyalty points
        serviceUsage[msg.sender]++;
        uint256 points = cost / 1e18; // 1 point per token spent
        loyaltyPoints[msg.sender] += points;
        
        emit ServiceUsed(msg.sender, serviceId, service.cost, discount);
        emit LoyaltyPointsEarned(msg.sender, points);
    }

    // Staking system
    function stake(uint256 amount) public nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        StakeInfo storage stakeInfo = stakes[msg.sender];
        
        // Claim existing rewards before updating stake
        if (stakeInfo.amount > 0) {
            claimStakingRewards();
        }
        
        _transfer(msg.sender, address(this), amount);
        
        stakeInfo.amount += amount;
        stakeInfo.startTime = block.timestamp;
        stakeInfo.rewardRate = calculateRewardRate(stakeInfo.amount);
        stakeInfo.lastClaimTime = block.timestamp;
        
        totalStaked += amount;
        
        emit TokensStaked(msg.sender, amount);
    }

    function unstake(uint256 amount) public nonReentrant {
        StakeInfo storage stakeInfo = stakes[msg.sender];
        require(stakeInfo.amount >= amount, "Insufficient staked amount");
        
        // Claim rewards before unstaking
        claimStakingRewards();
        
        stakeInfo.amount -= amount;
        totalStaked -= amount;
        
        uint256 rewards = calculateStakingRewards(msg.sender);
        
        _transfer(address(this), msg.sender, amount);
        
        if (rewards > 0 && balanceOf(address(this)) >= rewards) {
            _transfer(address(this), msg.sender, rewards);
        }
        
        emit TokensUnstaked(msg.sender, amount, rewards);
    }

    function claimStakingRewards() public nonReentrant {
        uint256 rewards = calculateStakingRewards(msg.sender);
        require(rewards > 0, "No rewards to claim");
        require(balanceOf(address(this)) >= rewards, "Insufficient contract balance");
        
        stakes[msg.sender].lastClaimTime = block.timestamp;
        _transfer(address(this), msg.sender, rewards);
        
        emit RewardsClaimed(msg.sender, rewards);
    }

    function calculateStakingRewards(address staker) public view returns (uint256) {
        StakeInfo storage stakeInfo = stakes[staker];
        if (stakeInfo.amount == 0) return 0;
        
        uint256 timeStaked = block.timestamp - stakeInfo.lastClaimTime;
        uint256 annualReward = (stakeInfo.amount * stakeInfo.rewardRate) / 10000;
        
        return (annualReward * timeStaked) / 365 days;
    }

    function calculateRewardRate(uint256 stakedAmount) internal pure returns (uint256) {
        // Tiered reward system: more tokens staked = higher reward rate
        if (stakedAmount >= 100000 * 1e18) return 1200; // 12% APY
        if (stakedAmount >= 50000 * 1e18) return 1000;  // 10% APY
        if (stakedAmount >= 10000 * 1e18) return 800;   // 8% APY
        if (stakedAmount >= 1000 * 1e18) return 600;    // 6% APY
        return 400; // 4% APY
    }

    // Enhanced burning with reasons
    function burnWithReason(uint256 amount, string memory reason) public {
        require(hasRole(BURNER_ROLE, msg.sender) || msg.sender == _msgSender(), "Unauthorized burn");
        _burn(_msgSender(), amount);
        totalBurned += amount;
        emit TokensBurned(_msgSender(), amount, reason);
    }

    function burnFrom(address account, uint256 amount, string memory reason) public onlyRole(BURNER_ROLE) {
        uint256 currentAllowance = allowance(account, _msgSender());
        require(currentAllowance >= amount, "Burn amount exceeds allowance");
        
        _approve(account, _msgSender(), currentAllowance - amount);
        _burn(account, amount);
        totalBurned += amount;
        emit TokensBurned(account, amount, reason);
    }

    // View functions
    function getServiceInfo(bytes32 serviceId) public view returns (Service memory) {
        return services[serviceId];
    }

    function getServiceCount() public view returns (uint256) {
        return serviceIds.length;
    }

    function getServiceIdAt(uint256 index) public view returns (bytes32) {
        require(index < serviceIds.length, "Index out of bounds");
        return serviceIds[index];
    }

    function getStakeInfo(address staker) public view returns (StakeInfo memory) {
        return stakes[staker];
    }

    function getTokenomics() public view returns (
        uint256 totalSupplyAmount,
        uint256 totalBurnedAmount,
        uint256 totalStakedAmount,
        uint256 circulatingSupply,
        uint256 inflationRatePercent
    ) {
        return (
            totalSupply(),
            totalBurned,
            totalStaked,
            totalSupply() - totalStaked,
            inflationRate
        );
    }

    function getUserStats(address user) public view returns (
        uint256 balance,
        uint256 stakedAmount,
        uint256 pendingRewards,
        uint256 loyaltyPointsBalance,
        uint256 servicesUsed
    ) {
        return (
            balanceOf(user),
            stakes[user].amount,
            calculateStakingRewards(user),
            loyaltyPoints[user],
            serviceUsage[user]
        );
    }

    // Emergency functions
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function emergencyWithdraw() public onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 balance = balanceOf(address(this));
        _transfer(address(this), msg.sender, balance);
    }

    // Required overrides
    function _mint(address to, uint256 amount)
        internal
        override(ERC20, ERC20Capped)
    {
        super._mint(to, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }

    // Support interface
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}