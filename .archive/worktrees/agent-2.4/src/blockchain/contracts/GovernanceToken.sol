// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title GovernanceToken
 * @dev ERC20 token with voting capabilities for decentralized governance
 * Includes features like delegation, voting power calculation, and proposal management
 */
contract GovernanceToken is ERC20, ERC20Votes, ERC20Permit, AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool cancelled;
        mapping(address => Receipt) receipts;
    }

    struct Receipt {
        bool hasVoted;
        uint8 support; // 0=against, 1=for, 2=abstain
        uint256 votes;
    }

    // Governance parameters
    uint256 public proposalThreshold;
    uint256 public votingDelay;
    uint256 public votingPeriod;
    uint256 public quorumPercentage;
    
    // Proposal storage
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    
    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        uint256 startBlock,
        uint256 endBlock
    );
    
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        uint8 support,
        uint256 weight,
        string reason
    );
    
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);
    event GovernanceParametersUpdated(
        uint256 proposalThreshold,
        uint256 votingDelay,
        uint256 votingPeriod,
        uint256 quorumPercentage
    );

    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address admin,
        uint256 _proposalThreshold,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _quorumPercentage
    ) ERC20(name, symbol) ERC20Permit(name) {
        require(admin != address(0), "Admin cannot be zero address");
        require(_quorumPercentage <= 100, "Quorum percentage cannot exceed 100");
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(GOVERNANCE_ROLE, admin);
        
        proposalThreshold = _proposalThreshold;
        votingDelay = _votingDelay;
        votingPeriod = _votingPeriod;
        quorumPercentage = _quorumPercentage;
        
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

    // Pause functions
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // Governance functions
    function propose(
        string memory title,
        string memory description
    ) public returns (uint256) {
        require(
            getVotes(msg.sender) >= proposalThreshold,
            "Proposer votes below proposal threshold"
        );
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");

        uint256 proposalId = ++proposalCount;
        uint256 startBlock = block.number + votingDelay;
        uint256 endBlock = startBlock + votingPeriod;

        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.title = title;
        proposal.description = description;
        proposal.startBlock = startBlock;
        proposal.endBlock = endBlock;

        emit ProposalCreated(proposalId, msg.sender, title, startBlock, endBlock);
        return proposalId;
    }

    function castVote(uint256 proposalId, uint8 support) public returns (uint256) {
        return _castVote(proposalId, msg.sender, support, "");
    }

    function castVoteWithReason(
        uint256 proposalId,
        uint8 support,
        string calldata reason
    ) public returns (uint256) {
        return _castVote(proposalId, msg.sender, support, reason);
    }

    function castVoteBySig(
        uint256 proposalId,
        uint8 support,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public returns (uint256) {
        address signer = ECDSA.recover(
            _hashTypedDataV4(keccak256(abi.encode(
                keccak256("Ballot(uint256 proposalId,uint8 support)"),
                proposalId,
                support
            ))),
            v,
            r,
            s
        );
        return _castVote(proposalId, signer, support, "");
    }

    function _castVote(
        uint256 proposalId,
        address voter,
        uint8 support,
        string memory reason
    ) internal returns (uint256) {
        require(state(proposalId) == ProposalState.Active, "Voting is closed");
        require(support <= 2, "Invalid vote type");

        Proposal storage proposal = proposals[proposalId];
        Receipt storage receipt = proposal.receipts[voter];
        
        require(!receipt.hasVoted, "Voter already voted");

        uint256 weight = getPastVotes(voter, proposal.startBlock);
        require(weight > 0, "No voting power");

        receipt.hasVoted = true;
        receipt.support = support;
        receipt.votes = weight;

        if (support == 0) {
            proposal.againstVotes += weight;
        } else if (support == 1) {
            proposal.forVotes += weight;
        } else {
            proposal.abstainVotes += weight;
        }

        emit VoteCast(voter, proposalId, support, weight, reason);
        return weight;
    }

    function executeProposal(uint256 proposalId) public onlyRole(GOVERNANCE_ROLE) {
        require(state(proposalId) == ProposalState.Succeeded, "Proposal cannot be executed");
        
        Proposal storage proposal = proposals[proposalId];
        proposal.executed = true;
        
        emit ProposalExecuted(proposalId);
    }

    function cancelProposal(uint256 proposalId) public {
        Proposal storage proposal = proposals[proposalId];
        
        require(
            msg.sender == proposal.proposer || hasRole(GOVERNANCE_ROLE, msg.sender),
            "Only proposer or governance can cancel"
        );
        require(state(proposalId) != ProposalState.Executed, "Cannot cancel executed proposal");
        
        proposal.cancelled = true;
        emit ProposalCancelled(proposalId);
    }

    // View functions
    enum ProposalState {
        Pending,
        Active,
        Cancelled,
        Defeated,
        Succeeded,
        Executed
    }

    function state(uint256 proposalId) public view returns (ProposalState) {
        require(proposalId <= proposalCount && proposalId > 0, "Invalid proposal id");
        
        Proposal storage proposal = proposals[proposalId];
        
        if (proposal.cancelled) {
            return ProposalState.Cancelled;
        } else if (proposal.executed) {
            return ProposalState.Executed;
        } else if (block.number <= proposal.startBlock) {
            return ProposalState.Pending;
        } else if (block.number <= proposal.endBlock) {
            return ProposalState.Active;
        } else if (_quorumReached(proposalId) && _voteSucceeded(proposalId)) {
            return ProposalState.Succeeded;
        } else {
            return ProposalState.Defeated;
        }
    }

    function _quorumReached(uint256 proposalId) internal view returns (bool) {
        Proposal storage proposal = proposals[proposalId];
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        uint256 totalSupplyAtSnapshot = getPastTotalSupply(proposal.startBlock);
        return totalVotes >= (totalSupplyAtSnapshot * quorumPercentage) / 100;
    }

    function _voteSucceeded(uint256 proposalId) internal view returns (bool) {
        Proposal storage proposal = proposals[proposalId];
        return proposal.forVotes > proposal.againstVotes;
    }

    function getProposalVotes(uint256 proposalId) 
        public 
        view 
        returns (uint256 forVotes, uint256 againstVotes, uint256 abstainVotes) 
    {
        Proposal storage proposal = proposals[proposalId];
        return (proposal.forVotes, proposal.againstVotes, proposal.abstainVotes);
    }

    function hasVoted(uint256 proposalId, address voter) public view returns (bool) {
        return proposals[proposalId].receipts[voter].hasVoted;
    }

    function getReceipt(uint256 proposalId, address voter) 
        public 
        view 
        returns (Receipt memory) 
    {
        return proposals[proposalId].receipts[voter];
    }

    // Governance parameter updates
    function updateGovernanceParameters(
        uint256 _proposalThreshold,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _quorumPercentage
    ) public onlyRole(GOVERNANCE_ROLE) {
        require(_quorumPercentage <= 100, "Quorum percentage cannot exceed 100");
        
        proposalThreshold = _proposalThreshold;
        votingDelay = _votingDelay;
        votingPeriod = _votingPeriod;
        quorumPercentage = _quorumPercentage;
        
        emit GovernanceParametersUpdated(
            _proposalThreshold,
            _votingDelay,
            _votingPeriod,
            _quorumPercentage
        );
    }

    // Required overrides
    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }

    function _afterTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._burn(account, amount);
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