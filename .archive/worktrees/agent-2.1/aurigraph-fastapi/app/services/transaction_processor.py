"""
Transaction Processor Service
High-performance transaction processing engine for 2M+ TPS
"""

import asyncio
import logging
import time
from typing import List, Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor
from collections import deque
import uuid

from app.models.transaction import TransactionModel, TransactionStatus
from app.models.base import AsyncSessionLocal
from generated.aurigraph_pb2 import Transaction
from app.core.config import settings

logger = logging.getLogger(__name__)


class TransactionProcessor:
    """
    High-performance transaction processor
    Handles batch processing, validation, and state management
    """
    
    def __init__(self):
        self.initialized = False
        self.running = False
        self.processed_count = 0
        self.failed_count = 0
        self.pending_queue = deque()
        self.processing_queue = deque()
        self.batch_size = settings.BATCH_SIZE
        self.max_workers = settings.PARALLEL_THREADS
        
        # Performance tracking
        self.start_time = time.time()
        self.last_tps_calculation = time.time()
        self.current_tps = 0.0
        self.peak_tps = 0.0
        
        # Processing pools
        self.validation_executor = ThreadPoolExecutor(max_workers=self.max_workers // 4)
        self.processing_executor = ThreadPoolExecutor(max_workers=self.max_workers)
        
        # Memory pools for high performance
        self.transaction_cache = {}
        self.batch_cache = {}
        
        logger.info("TransactionProcessor initialized")
    
    async def initialize(self) -> None:
        """
        Initialize the transaction processor
        """
        try:
            if self.initialized:
                return
                
            logger.info("Initializing transaction processor...")
            
            # Initialize database connection
            async with AsyncSessionLocal() as session:
                # Test database connection
                await session.execute("SELECT 1")
            
            # Start background processing tasks
            asyncio.create_task(self._process_batches())
            asyncio.create_task(self._calculate_tps())
            asyncio.create_task(self._cleanup_cache())
            
            self.initialized = True
            self.running = True
            
            logger.info(f"Transaction processor initialized successfully")
            logger.info(f"Batch size: {self.batch_size}, Max workers: {self.max_workers}")
            
        except Exception as e:
            logger.error(f"Failed to initialize transaction processor: {e}")
            raise
    
    async def stop(self) -> None:
        """
        Stop the transaction processor
        """
        self.running = False
        self.validation_executor.shutdown(wait=True)
        self.processing_executor.shutdown(wait=True)
        logger.info("Transaction processor stopped")
    
    async def process_transaction(self, transaction: Transaction) -> Dict[str, Any]:
        """
        Process a single transaction
        """
        try:
            start_time = time.time()
            
            # Convert to model
            tx_model = TransactionModel.from_protobuf(transaction)
            
            # Validate transaction
            validation_result = await self._validate_transaction(tx_model)
            if not validation_result['valid']:
                self.failed_count += 1
                return {
                    'success': False,
                    'error': validation_result['error'],
                    'transaction_id': transaction.id
                }
            
            # Set processing status
            tx_model.status = TransactionStatus.PROCESSING
            tx_model.hash = tx_model.calculate_hash()
            
            # Store in database
            async with AsyncSessionLocal() as session:
                session.add(tx_model)
                await session.commit()
                await session.refresh(tx_model)
            
            # Add to processing queue
            self.pending_queue.append(tx_model)
            
            # Update metrics
            processing_time = (time.time() - start_time) * 1000
            self.processed_count += 1
            
            logger.debug(f"Transaction processed: {transaction.id} in {processing_time:.2f}ms")
            
            return {
                'success': True,
                'transaction_id': transaction.id,
                'hash': tx_model.hash,
                'processing_time_ms': processing_time,
                'block_hash': f"block_{self.processed_count // 10000}"  # Mock block assignment
            }
            
        except Exception as e:
            logger.error(f"Error processing transaction {transaction.id}: {e}")
            self.failed_count += 1
            return {
                'success': False,
                'error': str(e),
                'transaction_id': transaction.id
            }
    
    async def process_batch(self, transactions: List[Transaction]) -> Dict[str, Any]:
        """
        Process a batch of transactions for high throughput
        """
        try:
            start_time = time.time()
            batch_id = str(uuid.uuid4())
            
            logger.info(f"Processing batch {batch_id} with {len(transactions)} transactions")
            
            # Convert all transactions to models
            tx_models = []
            for tx in transactions:
                tx_model = TransactionModel.from_protobuf(tx)
                tx_model.hash = tx_model.calculate_hash()
                tx_models.append(tx_model)
            
            # Parallel validation
            validation_tasks = []
            for tx_model in tx_models:
                task = asyncio.create_task(self._validate_transaction(tx_model))
                validation_tasks.append(task)
            
            validation_results = await asyncio.gather(*validation_tasks, return_exceptions=True)
            
            # Separate valid and invalid transactions
            valid_transactions = []
            invalid_count = 0
            
            for i, result in enumerate(validation_results):
                if isinstance(result, Exception):
                    invalid_count += 1
                    continue
                    
                if result['valid']:
                    tx_models[i].status = TransactionStatus.PROCESSING
                    valid_transactions.append(tx_models[i])
                else:
                    tx_models[i].status = TransactionStatus.REJECTED
                    invalid_count += 1
            
            # Batch database operations
            if valid_transactions:
                async with AsyncSessionLocal() as session:
                    session.add_all(tx_models)
                    await session.commit()
            
            # Add to processing queue
            for tx in valid_transactions:
                self.pending_queue.append(tx)
            
            # Update metrics
            processing_time = (time.time() - start_time) * 1000
            self.processed_count += len(valid_transactions)
            self.failed_count += invalid_count
            
            logger.info(f"Batch {batch_id} processed: {len(valid_transactions)} valid, {invalid_count} invalid in {processing_time:.2f}ms")
            
            return {
                'success': True,
                'batch_id': batch_id,
                'processed_count': len(valid_transactions),
                'failed_count': invalid_count,
                'processing_time_ms': processing_time,
                'average_tx_time_ms': processing_time / len(transactions) if transactions else 0
            }
            
        except Exception as e:
            logger.error(f"Error processing batch: {e}")
            return {
                'success': False,
                'error': str(e),
                'processed_count': 0,
                'failed_count': len(transactions)
            }
    
    async def get_transaction(self, transaction_id: str) -> Optional[Transaction]:
        """
        Get transaction by ID
        """
        try:
            # Check cache first
            if transaction_id in self.transaction_cache:
                return self.transaction_cache[transaction_id]
            
            # Query database
            async with AsyncSessionLocal() as session:
                from sqlalchemy import select
                
                stmt = select(TransactionModel).where(TransactionModel.id == transaction_id)
                result = await session.execute(stmt)
                tx_model = result.scalar_one_or_none()
                
                if tx_model:
                    pb_transaction = tx_model.to_protobuf()
                    self.transaction_cache[transaction_id] = pb_transaction
                    return pb_transaction
                
                return None
                
        except Exception as e:
            logger.error(f"Error getting transaction {transaction_id}: {e}")
            return None
    
    async def get_transactions_for_block(self, block_height: int) -> List[Transaction]:
        """
        Get transactions for a specific block
        """
        try:
            async with AsyncSessionLocal() as session:
                from sqlalchemy import select
                
                stmt = select(TransactionModel).where(
                    TransactionModel.block_height == block_height
                ).order_by(TransactionModel.transaction_index)
                
                result = await session.execute(stmt)
                tx_models = result.scalars().all()
                
                return [tx.to_protobuf() for tx in tx_models]
                
        except Exception as e:
            logger.error(f"Error getting transactions for block {block_height}: {e}")
            return []
    
    async def _validate_transaction(self, transaction: TransactionModel) -> Dict[str, Any]:
        """
        Validate a transaction
        """
        try:
            # Basic validation
            if not transaction.is_valid():
                return {'valid': False, 'error': 'Invalid transaction structure'}
            
            # Check for duplicate
            if transaction.id in self.transaction_cache:
                return {'valid': False, 'error': 'Duplicate transaction'}
            
            # Balance validation (mock)
            if not await self._check_balance(transaction.from_address, transaction.amount):
                return {'valid': False, 'error': 'Insufficient balance'}
            
            # Nonce validation (mock)
            if not await self._check_nonce(transaction.from_address, transaction.nonce):
                return {'valid': False, 'error': 'Invalid nonce'}
            
            # Gas validation
            if transaction.gas_price <= 0 or transaction.gas_limit <= 0:
                return {'valid': False, 'error': 'Invalid gas parameters'}
            
            # Signature validation (mock)
            if not await self._verify_signature(transaction):
                return {'valid': False, 'error': 'Invalid signature'}
            
            return {'valid': True, 'error': None}
            
        except Exception as e:
            return {'valid': False, 'error': f'Validation error: {str(e)}'}
    
    async def _check_balance(self, address: str, amount: float) -> bool:
        """
        Check if address has sufficient balance (mock implementation)
        """
        # Mock balance check - always return True for demo
        await asyncio.sleep(0.001)  # Simulate database query
        return True
    
    async def _check_nonce(self, address: str, nonce: int) -> bool:
        """
        Check if nonce is valid (mock implementation)
        """
        # Mock nonce check - always return True for demo
        await asyncio.sleep(0.001)  # Simulate database query
        return True
    
    async def _verify_signature(self, transaction: TransactionModel) -> bool:
        """
        Verify transaction signature (mock implementation)
        """
        # Mock signature verification - always return True for demo
        await asyncio.sleep(0.001)  # Simulate cryptographic operation
        return True
    
    async def _process_batches(self):
        """
        Background task to process transaction batches
        """
        while self.running:
            try:
                if len(self.pending_queue) >= self.batch_size:
                    # Extract batch from queue
                    batch = []
                    for _ in range(min(self.batch_size, len(self.pending_queue))):
                        if self.pending_queue:
                            batch.append(self.pending_queue.popleft())
                    
                    if batch:
                        # Process batch
                        await self._finalize_transactions(batch)
                
                await asyncio.sleep(0.1)  # Small delay to prevent busy waiting
                
            except Exception as e:
                logger.error(f"Error in batch processing: {e}")
                await asyncio.sleep(1.0)
    
    async def _finalize_transactions(self, transactions: List[TransactionModel]):
        """
        Finalize a batch of transactions
        """
        try:
            # Update transaction status
            for tx in transactions:
                tx.status = TransactionStatus.CONFIRMED
                tx.confirmation_time_ms = time.time() * 1000
            
            # Batch update database
            async with AsyncSessionLocal() as session:
                for tx in transactions:
                    await session.merge(tx)
                await session.commit()
            
            logger.debug(f"Finalized batch of {len(transactions)} transactions")
            
        except Exception as e:
            logger.error(f"Error finalizing transactions: {e}")
    
    async def _calculate_tps(self):
        """
        Background task to calculate TPS
        """
        last_count = 0
        
        while self.running:
            try:
                current_time = time.time()
                time_diff = current_time - self.last_tps_calculation
                
                if time_diff >= 1.0:  # Calculate every second
                    count_diff = self.processed_count - last_count
                    self.current_tps = count_diff / time_diff
                    
                    if self.current_tps > self.peak_tps:
                        self.peak_tps = self.current_tps
                    
                    last_count = self.processed_count
                    self.last_tps_calculation = current_time
                
                await asyncio.sleep(1.0)
                
            except Exception as e:
                logger.error(f"Error calculating TPS: {e}")
                await asyncio.sleep(5.0)
    
    async def _cleanup_cache(self):
        """
        Background task to cleanup caches
        """
        while self.running:
            try:
                # Clean transaction cache if too large
                if len(self.transaction_cache) > 100000:
                    # Remove oldest 50% of entries
                    items = list(self.transaction_cache.items())
                    items_to_keep = items[len(items)//2:]
                    self.transaction_cache = dict(items_to_keep)
                    logger.info(f"Cleaned transaction cache, now {len(self.transaction_cache)} items")
                
                await asyncio.sleep(60.0)  # Cleanup every minute
                
            except Exception as e:
                logger.error(f"Error in cache cleanup: {e}")
                await asyncio.sleep(300.0)  # Wait 5 minutes on error
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get processor statistics
        """
        uptime = time.time() - self.start_time
        
        return {
            'initialized': self.initialized,
            'running': self.running,
            'processed_count': self.processed_count,
            'failed_count': self.failed_count,
            'pending_queue_size': len(self.pending_queue),
            'current_tps': self.current_tps,
            'peak_tps': self.peak_tps,
            'average_tps': self.processed_count / uptime if uptime > 0 else 0,
            'success_rate': (
                self.processed_count / (self.processed_count + self.failed_count) 
                if (self.processed_count + self.failed_count) > 0 else 1.0
            ),
            'uptime_seconds': uptime,
            'cache_size': len(self.transaction_cache),
            'batch_size': self.batch_size,
            'max_workers': self.max_workers
        }