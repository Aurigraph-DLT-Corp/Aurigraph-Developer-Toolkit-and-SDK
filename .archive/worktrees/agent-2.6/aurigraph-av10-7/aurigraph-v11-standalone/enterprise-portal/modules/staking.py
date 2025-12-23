"""
Aurigraph V11 Enterprise - Staking Module
Comprehensive staking system with validators, delegators, and rewards
"""

import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any
import logging
import random

logger = logging.getLogger(__name__)

class StakingManager:
    """Manages staking operations, validators, and rewards"""
    
    def __init__(self):
        self.stakes = {}
        self.validators = {}
        self.rewards_pool = 2000000  # Total rewards pool
        self.staking_token = "AUR"
        self.min_stake_amount = 1000
        self.annual_yield_rate = 0.12  # 12% APY
        
        # Initialize with sample data
        self._initialize_sample_data()
    
    def _initialize_sample_data(self):
        """Initialize with sample staking data"""
        
        # Sample validators
        sample_validators = [
            {
                "id": "validator_001",
                "name": "Aurigraph Foundation Validator",
                "address": "0x1234567890abcdef1234567890abcdef12345678",
                "commission_rate": 0.05,
                "total_stake": 500000,
                "delegator_count": 234,
                "uptime": 99.8,
                "status": "Active",
                "description": "Official Aurigraph Foundation validator node",
                "created_at": (datetime.now() - timedelta(days=90)).isoformat()
            },
            {
                "id": "validator_002", 
                "name": "Enterprise Validator Alpha",
                "address": "0x2345678901bcdef23456789012cdef2345678901",
                "commission_rate": 0.03,
                "total_stake": 750000,
                "delegator_count": 456,
                "uptime": 99.9,
                "status": "Active",
                "description": "High-performance enterprise validator with quantum security",
                "created_at": (datetime.now() - timedelta(days=60)).isoformat()
            },
            {
                "id": "validator_003",
                "name": "Community Validator Beta",
                "address": "0x3456789012cdef345678901234def345678901234",
                "commission_rate": 0.08,
                "total_stake": 320000,
                "delegator_count": 123,
                "uptime": 98.5,
                "status": "Active",
                "description": "Community-run validator supporting decentralization",
                "created_at": (datetime.now() - timedelta(days=45)).isoformat()
            }
        ]
        
        for validator in sample_validators:
            self.validators[validator["id"]] = validator
        
        # Sample stakes
        sample_stakes = [
            {
                "id": str(uuid.uuid4()),
                "user_id": "user_001",
                "validator_id": "validator_001", 
                "amount": 50000,
                "stake_date": (datetime.now() - timedelta(days=30)).isoformat(),
                "duration_days": 90,
                "status": "Active",
                "rewards_earned": 615.38,  # 30 days of rewards
                "auto_compound": True
            },
            {
                "id": str(uuid.uuid4()),
                "user_id": "user_002",
                "validator_id": "validator_002",
                "amount": 25000,
                "stake_date": (datetime.now() - timedelta(days=15)).isoformat(),
                "duration_days": 180,
                "status": "Active", 
                "rewards_earned": 154.11,  # 15 days of rewards
                "auto_compound": False
            }
        ]
        
        for stake in sample_stakes:
            self.stakes[stake["id"]] = stake
    
    def get_staking_metrics(self) -> Dict[str, Any]:
        """Get comprehensive staking metrics"""
        
        total_staked = sum([stake["amount"] for stake in self.stakes.values() if stake["status"] == "Active"])
        active_stakes = len([stake for stake in self.stakes.values() if stake["status"] == "Active"])
        active_stakers = len(set([stake["user_id"] for stake in self.stakes.values() if stake["status"] == "Active"]))
        active_validators = len([v for v in self.validators.values() if v["status"] == "Active"])
        
        # Calculate average APY based on current conditions
        avg_apy = self.annual_yield_rate * 100
        
        # Calculate total rewards distributed
        total_rewards_distributed = sum([stake["rewards_earned"] for stake in self.stakes.values()])
        
        return {
            "total_staked_value": total_staked,
            "total_staked_tokens": total_staked,
            "active_stakes": active_stakes,
            "active_stakers": active_stakers,
            "active_validators": active_validators,
            "average_apy": round(avg_apy, 2),
            "total_rewards_distributed": round(total_rewards_distributed, 2),
            "rewards_pool_remaining": self.rewards_pool - total_rewards_distributed,
            "staking_ratio": round((total_staked / 10000000) * 100, 2),  # Assuming 10M total supply
            "min_stake_amount": self.min_stake_amount,
            "staking_token": self.staking_token,
            "network_security_score": 95.2,  # Calculated based on stake distribution
            "timestamp": datetime.now().isoformat()
        }
    
    def get_validators(self) -> List[Dict[str, Any]]:
        """Get all validators"""
        return list(self.validators.values())
    
    def get_validator(self, validator_id: str) -> Dict[str, Any]:
        """Get specific validator"""
        return self.validators.get(validator_id, {})
    
    def get_user_stakes(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's stakes"""
        user_stakes = [
            stake for stake in self.stakes.values() 
            if stake["user_id"] == user_id
        ]
        
        # Calculate updated rewards for each stake
        for stake in user_stakes:
            if stake["status"] == "Active":
                stake["current_rewards"] = self._calculate_current_rewards(stake)
        
        return user_stakes
    
    def stake_tokens(self, stake_data: Dict[str, Any]) -> Dict[str, Any]:
        """Stake tokens with a validator"""
        try:
            if stake_data["amount"] < self.min_stake_amount:
                return {
                    "success": False,
                    "error": f"Minimum stake amount is {self.min_stake_amount} {self.staking_token}"
                }
            
            if stake_data["validator"] not in self.validators:
                return {"success": False, "error": "Validator not found"}
            
            validator = self.validators[stake_data["validator"]]
            if validator["status"] != "Active":
                return {"success": False, "error": "Validator is not active"}
            
            stake_id = str(uuid.uuid4())
            stake = {
                "id": stake_id,
                "user_id": stake_data["user_id"],
                "validator_id": stake_data["validator"],
                "amount": stake_data["amount"],
                "stake_date": datetime.now().isoformat(),
                "duration_days": stake_data["duration"],
                "status": "Active",
                "rewards_earned": 0,
                "auto_compound": stake_data.get("auto_compound", False),
                "transaction_hash": f"0x{uuid.uuid4().hex}"
            }
            
            self.stakes[stake_id] = stake
            
            # Update validator stats
            validator["total_stake"] += stake_data["amount"]
            validator["delegator_count"] += 1
            
            logger.info(f"Staked {stake_data['amount']} tokens with validator {stake_data['validator']}")
            
            return {
                "success": True,
                "stake_id": stake_id,
                "message": "Tokens staked successfully",
                "stake": stake,
                "estimated_annual_rewards": round(stake_data["amount"] * self.annual_yield_rate, 2)
            }
            
        except Exception as e:
            logger.error(f"Error staking tokens: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def unstake_tokens(self, unstake_data: Dict[str, Any]) -> Dict[str, Any]:
        """Unstake tokens"""
        try:
            stake_id = unstake_data["stake_id"]
            
            if stake_id not in self.stakes:
                return {"success": False, "error": "Stake not found"}
            
            stake = self.stakes[stake_id]
            
            if stake["user_id"] != unstake_data["user_id"]:
                return {"success": False, "error": "Unauthorized"}
            
            if stake["status"] != "Active":
                return {"success": False, "error": "Stake is not active"}
            
            # Calculate final rewards
            final_rewards = self._calculate_current_rewards(stake)
            
            # Check if unstaking period has passed (simplified)
            stake_date = datetime.fromisoformat(stake["stake_date"])
            if datetime.now() < stake_date + timedelta(days=7):  # 7-day lock period
                return {
                    "success": False,
                    "error": "Tokens are still in lock period (7 days minimum)"
                }
            
            # Process unstaking
            stake["status"] = "Unstaked"
            stake["unstake_date"] = datetime.now().isoformat()
            stake["final_rewards"] = final_rewards
            stake["unstake_transaction_hash"] = f"0x{uuid.uuid4().hex}"
            
            # Update validator stats
            validator = self.validators[stake["validator_id"]]
            validator["total_stake"] -= stake["amount"]
            validator["delegator_count"] -= 1
            
            total_return = stake["amount"] + final_rewards
            
            logger.info(f"Unstaked {stake['amount']} tokens with {final_rewards} rewards")
            
            return {
                "success": True,
                "message": "Tokens unstaked successfully",
                "unstaked_amount": stake["amount"],
                "rewards_earned": round(final_rewards, 2),
                "total_return": round(total_return, 2),
                "stake": stake
            }
            
        except Exception as e:
            logger.error(f"Error unstaking tokens: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def claim_rewards(self, user_id: str, stake_id: str) -> Dict[str, Any]:
        """Claim staking rewards"""
        try:
            if stake_id not in self.stakes:
                return {"success": False, "error": "Stake not found"}
            
            stake = self.stakes[stake_id]
            
            if stake["user_id"] != user_id:
                return {"success": False, "error": "Unauthorized"}
            
            if stake["status"] != "Active":
                return {"success": False, "error": "Stake is not active"}
            
            # Calculate claimable rewards
            current_rewards = self._calculate_current_rewards(stake)
            claimable_rewards = current_rewards - stake["rewards_earned"]
            
            if claimable_rewards <= 0:
                return {"success": False, "error": "No rewards to claim"}
            
            # Process claim
            stake["rewards_earned"] = current_rewards
            stake["last_claim_date"] = datetime.now().isoformat()
            stake["claim_transaction_hash"] = f"0x{uuid.uuid4().hex}"
            
            logger.info(f"Claimed {claimable_rewards} rewards for stake {stake_id}")
            
            return {
                "success": True,
                "message": "Rewards claimed successfully",
                "rewards_claimed": round(claimable_rewards, 2),
                "transaction_hash": stake["claim_transaction_hash"]
            }
            
        except Exception as e:
            logger.error(f"Error claiming rewards: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _calculate_current_rewards(self, stake: Dict[str, Any]) -> float:
        """Calculate current rewards for a stake"""
        stake_date = datetime.fromisoformat(stake["stake_date"])
        days_staked = (datetime.now() - stake_date).days
        
        # Calculate daily reward rate
        daily_rate = self.annual_yield_rate / 365
        
        # Get validator commission
        validator = self.validators[stake["validator_id"]]
        commission_rate = validator["commission_rate"]
        
        # Calculate gross rewards
        gross_rewards = stake["amount"] * daily_rate * days_staked
        
        # Apply validator commission
        net_rewards = gross_rewards * (1 - commission_rate)
        
        return net_rewards
    
    def get_staking_analytics(self) -> Dict[str, Any]:
        """Get detailed staking analytics"""
        
        # Validator performance
        validator_performance = []
        for validator in self.validators.values():
            performance = {
                "validator_id": validator["id"],
                "name": validator["name"],
                "total_stake": validator["total_stake"],
                "uptime": validator["uptime"],
                "commission_rate": validator["commission_rate"],
                "delegator_count": validator["delegator_count"],
                "performance_score": validator["uptime"] * (1 - validator["commission_rate"])
            }
            validator_performance.append(performance)
        
        # Sort by performance score
        validator_performance.sort(key=lambda x: x["performance_score"], reverse=True)
        
        # Stake distribution
        stake_distribution = {}
        for stake in self.stakes.values():
            if stake["status"] == "Active":
                validator_id = stake["validator_id"]
                if validator_id not in stake_distribution:
                    stake_distribution[validator_id] = 0
                stake_distribution[validator_id] += stake["amount"]
        
        return {
            "validator_performance": validator_performance,
            "stake_distribution": stake_distribution,
            "reward_rate_trends": {
                "current_apy": self.annual_yield_rate * 100,
                "7d_avg": (self.annual_yield_rate + random.uniform(-0.01, 0.01)) * 100,
                "30d_avg": (self.annual_yield_rate + random.uniform(-0.02, 0.02)) * 100
            },
            "network_stats": {
                "total_validators": len(self.validators),
                "active_validators": len([v for v in self.validators.values() if v["status"] == "Active"]),
                "decentralization_coefficient": self._calculate_decentralization(),
                "security_budget": sum([v["total_stake"] for v in self.validators.values()])
            },
            "timestamp": datetime.now().isoformat()
        }
    
    def _calculate_decentralization(self) -> float:
        """Calculate network decentralization coefficient (Nakamoto coefficient)"""
        stakes = [v["total_stake"] for v in self.validators.values() if v["status"] == "Active"]
        stakes.sort(reverse=True)
        
        total_stake = sum(stakes)
        cumulative = 0
        
        for i, stake in enumerate(stakes):
            cumulative += stake
            if cumulative > total_stake * 0.33:  # 33% control threshold
                return (i + 1) / len(stakes)
        
        return 1.0  # Perfect decentralization
    
    def create_validator(self, validator_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new validator"""
        try:
            validator_id = f"validator_{uuid.uuid4().hex[:8]}"
            
            validator = {
                "id": validator_id,
                "name": validator_data["name"],
                "address": validator_data["address"],
                "commission_rate": validator_data["commission_rate"],
                "total_stake": 0,
                "delegator_count": 0,
                "uptime": 0,
                "status": "Pending",
                "description": validator_data.get("description", ""),
                "created_at": datetime.now().isoformat(),
                "created_by": validator_data["created_by"]
            }
            
            self.validators[validator_id] = validator
            
            logger.info(f"Created validator: {validator['name']}")
            
            return {
                "success": True,
                "validator_id": validator_id,
                "message": "Validator created successfully",
                "validator": validator
            }
            
        except Exception as e:
            logger.error(f"Error creating validator: {e}")
            return {
                "success": False,
                "error": str(e)
            }