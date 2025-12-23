"""
Transaction API endpoints
"""

import logging
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

router = APIRouter()


class TransactionRequest(BaseModel):
    """Transaction request model"""
    from_address: str = Field(..., description="Sender address")
    to_address: str = Field(..., description="Recipient address")
    amount: float = Field(..., gt=0, description="Transaction amount")
    type: str = Field(default="transfer", description="Transaction type")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional metadata")
    gas_price: Optional[float] = Field(default=0.001, description="Gas price")
    gas_limit: Optional[float] = Field(default=21000, description="Gas limit")


class BatchTransactionRequest(BaseModel):
    """Batch transaction request model"""
    transactions: List[TransactionRequest] = Field(..., description="List of transactions")


class TransactionResponse(BaseModel):
    """Transaction response model"""
    success: bool
    transaction_id: str
    hash: Optional[str] = None
    message: str
    processing_time_ms: Optional[float] = None


class BatchTransactionResponse(BaseModel):
    """Batch transaction response model"""
    success: bool
    processed_count: int
    failed_count: int
    transaction_ids: List[str]
    processing_time_ms: Optional[float] = None


@router.post("/submit", response_model=TransactionResponse, summary="Submit Transaction")
async def submit_transaction(transaction: TransactionRequest, request: Request) -> TransactionResponse:
    """
    Submit a single transaction for processing
    """
    try:
        # Generate transaction ID
        tx_id = str(uuid.uuid4())
        
        # Create protobuf transaction
        from generated.aurigraph_pb2 import Transaction
        
        pb_transaction = Transaction(
            id=tx_id,
            from_address=transaction.from_address,
            to_address=transaction.to_address,
            amount=transaction.amount,
            timestamp=int(datetime.utcnow().timestamp() * 1000),
            type=transaction.type,
            nonce=0,  # Will be set by processor
            gas_price=transaction.gas_price,
            gas_limit=transaction.gas_limit,
            metadata=transaction.metadata or {}
        )
        
        # Process transaction
        if hasattr(request.app.state, 'transaction_processor'):
            result = await request.app.state.transaction_processor.process_transaction(pb_transaction)
            
            return TransactionResponse(
                success=result['success'],
                transaction_id=result['transaction_id'],
                hash=result.get('hash'),
                message="Transaction processed successfully" if result['success'] else result.get('error', 'Processing failed'),
                processing_time_ms=result.get('processing_time_ms')
            )
        else:
            # Mock response when processor not available
            import time
            processing_time = 10.0  # Mock processing time
            
            return TransactionResponse(
                success=True,
                transaction_id=tx_id,
                hash=f"tx_hash_{tx_id[:8]}",
                message="Transaction accepted (mock mode)",
                processing_time_ms=processing_time
            )
        
    except Exception as e:
        logger.error(f"Error submitting transaction: {e}")
        raise HTTPException(status_code=500, detail=f"Transaction submission failed: {str(e)}")


@router.post("/batch", response_model=BatchTransactionResponse, summary="Submit Batch Transactions")
async def submit_batch_transactions(batch: BatchTransactionRequest, request: Request) -> BatchTransactionResponse:
    """
    Submit multiple transactions in a batch for high-throughput processing
    """
    try:
        if len(batch.transactions) == 0:
            raise HTTPException(status_code=400, detail="No transactions provided")
        
        if len(batch.transactions) > 10000:
            raise HTTPException(status_code=400, detail="Batch size too large (max 10,000)")
        
        # Create protobuf transactions
        from generated.aurigraph_pb2 import Transaction
        
        pb_transactions = []
        for tx_req in batch.transactions:
            tx_id = str(uuid.uuid4())
            pb_transaction = Transaction(
                id=tx_id,
                from_address=tx_req.from_address,
                to_address=tx_req.to_address,
                amount=tx_req.amount,
                timestamp=int(datetime.utcnow().timestamp() * 1000),
                type=tx_req.type,
                nonce=0,  # Will be set by processor
                gas_price=tx_req.gas_price,
                gas_limit=tx_req.gas_limit,
                metadata=tx_req.metadata or {}
            )
            pb_transactions.append(pb_transaction)
        
        # Process batch
        if hasattr(request.app.state, 'transaction_processor'):
            result = await request.app.state.transaction_processor.process_batch(pb_transactions)
            
            return BatchTransactionResponse(
                success=result['success'],
                processed_count=result.get('processed_count', 0),
                failed_count=result.get('failed_count', 0),
                transaction_ids=[tx.id for tx in pb_transactions],
                processing_time_ms=result.get('processing_time_ms')
            )
        else:
            # Mock response when processor not available
            import time
            processing_time = len(batch.transactions) * 0.1  # Mock processing time
            
            return BatchTransactionResponse(
                success=True,
                processed_count=len(batch.transactions),
                failed_count=0,
                transaction_ids=[f"tx_{i}_{uuid.uuid4()}" for i in range(len(batch.transactions))],
                processing_time_ms=processing_time
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting batch transactions: {e}")
        raise HTTPException(status_code=500, detail=f"Batch submission failed: {str(e)}")


@router.get("/{transaction_id}", summary="Get Transaction")
async def get_transaction(transaction_id: str, request: Request) -> Dict[str, Any]:
    """
    Get transaction details by ID
    """
    try:
        if hasattr(request.app.state, 'transaction_processor'):
            transaction = await request.app.state.transaction_processor.get_transaction(transaction_id)
            
            if not transaction:
                raise HTTPException(status_code=404, detail="Transaction not found")
            
            return {
                "id": transaction.id,
                "from_address": transaction.from_address,
                "to_address": transaction.to_address,
                "amount": transaction.amount,
                "timestamp": transaction.timestamp,
                "type": transaction.type,
                "nonce": transaction.nonce,
                "gas_price": transaction.gas_price,
                "gas_limit": transaction.gas_limit,
                "metadata": dict(transaction.metadata) if transaction.metadata else {}
            }
        else:
            # Mock response
            return {
                "id": transaction_id,
                "from_address": "0x123...",
                "to_address": "0x456...",
                "amount": 100.0,
                "timestamp": int(datetime.utcnow().timestamp() * 1000),
                "type": "transfer",
                "nonce": 1,
                "gas_price": 0.001,
                "gas_limit": 21000,
                "metadata": {},
                "status": "mock"
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting transaction {transaction_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get transaction: {str(e)}")


@router.get("/", summary="List Transactions")
async def list_transactions(
    request: Request,
    limit: int = Query(default=100, ge=1, le=1000, description="Number of transactions to return"),
    offset: int = Query(default=0, ge=0, description="Number of transactions to skip"),
    from_address: Optional[str] = Query(default=None, description="Filter by sender address"),
    to_address: Optional[str] = Query(default=None, description="Filter by recipient address"),
    transaction_type: Optional[str] = Query(default=None, description="Filter by transaction type")
) -> Dict[str, Any]:
    """
    List transactions with filtering and pagination
    """
    try:
        # Mock response for now
        # In real implementation, this would query the database
        
        transactions = []
        for i in range(min(limit, 50)):  # Mock up to 50 transactions
            tx = {
                "id": f"tx_{i}_{uuid.uuid4()}",
                "from_address": from_address or f"0x{i:04x}1234",
                "to_address": to_address or f"0x{i:04x}5678",
                "amount": 100.0 + i,
                "timestamp": int(datetime.utcnow().timestamp() * 1000) - (i * 1000),
                "type": transaction_type or "transfer",
                "status": "confirmed"
            }
            transactions.append(tx)
        
        return {
            "transactions": transactions,
            "total": len(transactions),
            "limit": limit,
            "offset": offset,
            "has_more": False  # Mock - no more pages
        }
        
    except Exception as e:
        logger.error(f"Error listing transactions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list transactions: {str(e)}")


@router.get("/stats/summary", summary="Transaction Statistics")
async def transaction_stats(request: Request) -> Dict[str, Any]:
    """
    Get transaction processing statistics
    """
    try:
        if hasattr(request.app.state, 'transaction_processor'):
            stats = request.app.state.transaction_processor.get_stats()
            
            return {
                "total_processed": stats.get('processed_count', 0),
                "total_failed": stats.get('failed_count', 0),
                "current_tps": stats.get('current_tps', 0.0),
                "peak_tps": stats.get('peak_tps', 0.0),
                "average_tps": stats.get('average_tps', 0.0),
                "success_rate": stats.get('success_rate', 1.0),
                "pending_queue_size": stats.get('pending_queue_size', 0),
                "uptime_seconds": stats.get('uptime_seconds', 0),
                "batch_size": stats.get('batch_size', 0),
                "max_workers": stats.get('max_workers', 0)
            }
        else:
            # Mock stats
            return {
                "total_processed": 1500000,
                "total_failed": 50,
                "current_tps": 776000.0,
                "peak_tps": 850000.0,
                "average_tps": 720000.0,
                "success_rate": 0.9999,
                "pending_queue_size": 15,
                "uptime_seconds": 3600,
                "batch_size": 10000,
                "max_workers": 256,
                "mock": True
            }
        
    except Exception as e:
        logger.error(f"Error getting transaction stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")