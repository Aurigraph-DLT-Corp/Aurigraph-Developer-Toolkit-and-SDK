## Data Flow

### Transaction Processing Flow

```
┌──────────────┐
│   Client     │
│ (Enterprise  │
│   Portal)    │
└──────┬───────┘
       │ 1. Submit Transaction
       │ POST /api/v11/transactions
       ▼
┌──────────────────┐
│   API Gateway    │
│  Rate Limiting   │
│  Authentication  │
└──────┬───────────┘
       │ 2. Route to V11
       ▼
┌──────────────────┐
│ TransactionService│ ────┐
│   Validation     │      │ 3. Validate
│   Signature      │      │
└──────┬───────────┘      │
       │                   │
       │ 4. Queue          │
       ▼                   │
┌──────────────────┐      │
│ Transaction Pool │      │
│   (Priority Q)   │      │
└──────┬───────────┘      │
       │                   │
       │ 5. Consensus      │
       ▼                   │
┌──────────────────┐      │
│  HyperRAFT++     │<─────┘
│  - Leader Elect  │
│  - Log Replicate │
└──────┬───────────┘
       │ 6. Commit
       ▼
┌──────────────────┐
│  State Machine   │
│   - Execute      │
│   - Update State │
└──────┬───────────┘
       │ 7. Persist
       ▼
┌──────────────────┐
│  Storage Layer   │
│  - Block DB      │
│  - State DB      │
└──────┬───────────┘
       │ 8. Confirm
       ▼
┌──────────────────┐
│    Response      │
│  (WebSocket +    │
│   REST API)      │
└──────────────────┘
```

### Consensus Flow (HyperRAFT++)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Node 1    │     │   Node 2    │     │   Node 3    │
│  (Leader)   │     │ (Follower)  │     │ (Follower)  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ 1. Receive Tx     │                   │
       │◄──────────────────┘                   │
       │                                        │
       │ 2. Append Log Entry                   │
       │                                        │
       │ 3. Replicate                          │
       ├──────────────────────────────────────>│
       ├──────────────────>│                   │
       │                   │                   │
       │ 4. ACK            │ 4. ACK            │
       │<──────────────────┤<──────────────────┤
       │                   │                   │
       │ 5. Commit (Quorum achieved)           │
       │                                        │
       │ 6. Notify Followers                   │
       ├──────────────────>│                   │
       ├──────────────────────────────────────>│
       │                   │                   │
       │ 7. Apply to State Machine             │
       ▼                   ▼                   ▼
```
