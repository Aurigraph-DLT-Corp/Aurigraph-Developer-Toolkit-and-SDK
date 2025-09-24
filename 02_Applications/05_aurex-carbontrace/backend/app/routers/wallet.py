from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database import get_db
from app.models.user import User
from app.models.portfolio import Wallet, WalletBalance, Transaction, WalletType, TransactionType
from app.routers.auth import get_current_user

router = APIRouter()

@router.get("/")
async def get_user_wallets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's wallets"""
    
    wallets = db.query(Wallet).filter(Wallet.user_id == current_user.id).all()
    
    return [
        {
            "id": str(wallet.id),
            "wallet_type": wallet.wallet_type.value,
            "address": wallet.address,
            "is_active": wallet.is_active,
            "is_verified": wallet.is_verified,
            "backup_completed": wallet.backup_completed,
            "created_at": wallet.created_at,
            "last_balance_update": wallet.last_balance_update
        } for wallet in wallets
    ]

@router.post("/create")
async def create_wallet(
    wallet_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new wallet"""
    
    # Check if user already has a wallet of this type
    existing_wallet = db.query(Wallet).filter(
        Wallet.user_id == current_user.id,
        Wallet.wallet_type == wallet_data.get("wallet_type", "hot")
    ).first()
    
    if existing_wallet:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User already has a {wallet_data.get('wallet_type', 'hot')} wallet"
        )
    
    # Generate wallet address (in production, use proper crypto libraries)
    import hashlib
    import time
    wallet_address = hashlib.sha256(f"{current_user.id}{time.time()}".encode()).hexdigest()[:42]
    
    new_wallet = Wallet(
        user_id=current_user.id,
        wallet_type=WalletType(wallet_data.get("wallet_type", "hot")),
        address=f"0x{wallet_address}",
        public_key="mock_public_key",  # In production, generate proper keys
        required_signatures=wallet_data.get("required_signatures", 1),
        total_signers=wallet_data.get("total_signers", 1)
    )
    
    db.add(new_wallet)
    db.commit()
    db.refresh(new_wallet)
    
    return {
        "id": str(new_wallet.id),
        "address": new_wallet.address,
        "wallet_type": new_wallet.wallet_type.value,
        "message": "Wallet created successfully"
    }

@router.get("/{wallet_id}/balance")
async def get_wallet_balance(
    wallet_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get wallet balance"""
    
    wallet = db.query(Wallet).filter(
        Wallet.id == wallet_id,
        Wallet.user_id == current_user.id
    ).first()
    
    if not wallet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wallet not found"
        )
    
    balances = db.query(WalletBalance).filter(WalletBalance.wallet_id == wallet_id).all()
    
    return {
        "wallet_id": wallet_id,
        "balances": [
            {
                "carbon_credit_id": str(balance.carbon_credit_id),
                "carbon_credit": {
                    "symbol": balance.carbon_credit.symbol,
                    "name": balance.carbon_credit.name
                },
                "available_balance": float(balance.available_balance),
                "locked_balance": float(balance.locked_balance),
                "total_balance": float(balance.total_balance)
            } for balance in balances
        ],
        "updated_at": wallet.last_balance_update
    }

@router.get("/transactions")
async def get_wallet_transactions(
    wallet_id: Optional[str] = None,
    transaction_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get wallet transactions"""
    
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    
    if wallet_id:
        query = query.filter(Transaction.wallet_id == wallet_id)
    
    if transaction_type:
        query = query.filter(Transaction.transaction_type == transaction_type)
    
    transactions = query.order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()
    
    return [
        {
            "id": str(transaction.id),
            "wallet_id": str(transaction.wallet_id),
            "carbon_credit_id": str(transaction.carbon_credit_id),
            "carbon_credit": {
                "symbol": transaction.carbon_credit.symbol,
                "name": transaction.carbon_credit.name
            },
            "transaction_type": transaction.transaction_type.value,
            "quantity": float(transaction.quantity),
            "price": float(transaction.price) if transaction.price else None,
            "total_value": float(transaction.total_value) if transaction.total_value else None,
            "fee": float(transaction.fee),
            "transaction_hash": transaction.transaction_hash,
            "status": transaction.status,
            "created_at": transaction.created_at,
            "confirmed_at": transaction.confirmed_at
        } for transaction in transactions
    ]

@router.post("/transfer")
async def transfer_tokens(
    transfer_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Transfer carbon tokens between wallets"""
    
    # Validate source wallet ownership
    source_wallet = db.query(Wallet).filter(
        Wallet.id == transfer_data["from_wallet_id"],
        Wallet.user_id == current_user.id
    ).first()
    
    if not source_wallet:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Source wallet not found or unauthorized"
        )
    
    # Check balance
    balance = db.query(WalletBalance).filter(
        WalletBalance.wallet_id == transfer_data["from_wallet_id"],
        WalletBalance.carbon_credit_id == transfer_data["carbon_credit_id"]
    ).first()
    
    if not balance or balance.available_balance < transfer_data["quantity"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient balance"
        )
    
    # Create transaction record
    transaction = Transaction(
        user_id=current_user.id,
        wallet_id=source_wallet.id,
        carbon_credit_id=transfer_data["carbon_credit_id"],
        transaction_type=TransactionType.TRANSFER,
        quantity=transfer_data["quantity"],
        fee=transfer_data.get("fee", 0.0),
        transaction_hash=f"0x{''.join(['%02x' % b for b in range(32)])}",  # Mock hash
        status="pending"
    )
    
    db.add(transaction)
    db.commit()
    
    return {
        "transaction_id": str(transaction.id),
        "status": "pending",
        "message": "Transfer initiated successfully",
        "estimated_confirmation_time": "2-5 minutes"
    }

@router.post("/retire")
async def retire_carbon_credits(
    retirement_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retire carbon credits (permanent removal from circulation)"""
    
    # Validate wallet ownership
    wallet = db.query(Wallet).filter(
        Wallet.id == retirement_data["wallet_id"],
        Wallet.user_id == current_user.id
    ).first()
    
    if not wallet:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Wallet not found or unauthorized"
        )
    
    # Check balance
    balance = db.query(WalletBalance).filter(
        WalletBalance.wallet_id == retirement_data["wallet_id"],
        WalletBalance.carbon_credit_id == retirement_data["carbon_credit_id"]
    ).first()
    
    if not balance or balance.available_balance < retirement_data["quantity"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient balance for retirement"
        )
    
    # Create retirement transaction
    transaction = Transaction(
        user_id=current_user.id,
        wallet_id=wallet.id,
        carbon_credit_id=retirement_data["carbon_credit_id"],
        transaction_type=TransactionType.RETIREMENT,
        quantity=retirement_data["quantity"],
        fee=retirement_data.get("fee", 0.0),
        transaction_hash=f"0x{''.join(['%02x' % b for b in range(32)])}",  # Mock hash
        status="pending"
    )
    
    db.add(transaction)
    db.commit()
    
    return {
        "transaction_id": str(transaction.id),
        "retirement_certificate": f"CERT-{transaction.id}",
        "status": "pending",
        "message": "Carbon credit retirement initiated",
        "retired_quantity": retirement_data["quantity"],
        "retirement_purpose": retirement_data.get("purpose", "Voluntary offset")
    }