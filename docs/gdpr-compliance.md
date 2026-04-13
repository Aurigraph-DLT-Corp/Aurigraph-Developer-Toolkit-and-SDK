# GDPR Compliance

The SDK provides first-class support for GDPR rights: data portability (Article 20), right to erasure (Article 17), and transparent processing (Article 12).

## The DLT Erasure Problem

Blockchain's defining property — immutability — directly conflicts with GDPR's right to erasure. Traditional blockchains cannot legally store EU personal data because they cannot delete it.

Aurigraph solves this with a **patented encrypted-tombstone approach** (PCT-AUR-011):

1. Personal data is stored encrypted with a per-subject key
2. Erasure requests delete the key, not the ciphertext
3. Without the key, the ciphertext is cryptographically unreadable
4. An audit trail of the erasure (subject ID + timestamp + tracking ID) remains on-chain for compliance evidence
5. The subject's actual data is effectively deleted even though the block containing it is immutable

This satisfies GDPR's erasure requirement while preserving blockchain integrity.

## Export User Data (Article 20)

Returns all data held about a subject in a portable JSON format:

```java
GdprExportPayload payload = client.gdpr().exportUserData("user-123");
System.out.println("Exported at: " + payload.exportedAt());
for (DataSection section : payload.sections()) {
    System.out.println(section.category() + ": " + section.data().size() + " records");
}
```

```typescript
const payload = await client.gdpr.exportUserData('user-123');
console.log('Exported at:', payload.exportedAt);
payload.sections.forEach(s => console.log(`${s.category}: ${s.data.length} records`));
```

```python
payload = client.gdpr.export_user_data("user-123")
print(f"Exported at: {payload.exported_at}")
for section in payload.sections:
    print(f"{section.category}: {len(section.data)} records")
```

The export includes data from 5 subsystems:

| Category | Contents |
|----------|----------|
| `identity` | Profile, KYC records |
| `applications` | SDK apps registered by the user |
| `assets` | RWA assets owned |
| `transactions` | Transaction history (summary) |
| `contracts` | Smart contracts the user is party to |

## Download User Data

For large exports, use the download endpoint (returns a file stream with `Content-Disposition: attachment`):

```java
byte[] blob = client.gdpr().downloadUserData("user-123");
Files.write(Paths.get("/tmp/user-123-export.json"), blob);
```

```typescript
const blob = await client.gdpr.downloadUserData('user-123');
const url = URL.createObjectURL(blob);
// Trigger browser download
```

## Request Erasure (Article 17)

Initiates asynchronous erasure. Returns a tracking ID immediately; actual deletion completes within 30 days (GDPR deadline).

```java
ErasureReceipt receipt = client.gdpr().requestErasure("user-123");
System.out.println("Tracking ID: " + receipt.trackingId());
System.out.println("Status: " + receipt.status());  // "ACCEPTED"
```

## The Erasure Process

```
Request received
    │
    ▼
┌──────────────────────────────────────────┐
│ 1. Verify identity (authenticated user)   │
└──────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────┐
│ 2. Generate tracking ID, return 202       │ ← Immediate response
└──────────────────────────────────────────┘
    │
    ▼ (async)
┌──────────────────────────────────────────┐
│ 3. Destroy per-subject encryption key     │ ← Ciphertext now unreadable
└──────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────┐
│ 4. Emit on-chain erasure attestation      │ ← Compliance evidence
│    (subject ID hash + timestamp only —    │
│     no personal data in attestation)      │
└──────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────┐
│ 5. Redact external system records         │ ← PostgreSQL, Redis, logs
└──────────────────────────────────────────┘
    │
    ▼
  Erasure complete (target: <7 days)
```

## What Remains After Erasure

Per GDPR Art. 17(3), certain data may be retained:

- **Anonymized transaction records** — for consensus integrity (subject ID replaced with opaque hash)
- **Audit trail of the erasure itself** — for compliance evidence
- **Aggregated statistics** — where individual records cannot be reconstructed

Data subject to Article 17(3) exemptions (legal obligation, public interest, legal claims) is retained. The system flags these in the erasure receipt.

## Legal Basis

The platform operates under:
- **GDPR** (EU Regulation 2016/679) — EU/EEA data subjects
- **UK GDPR** (post-Brexit) — UK data subjects
- **CCPA/CPRA** (California) — California residents (right to delete, Article 1798.105)
- **PIPEDA** (Canada) — under review
- **LGPD** (Brazil) — under review

Our Data Processing Agreement (DPA) covering Article 28 processor obligations is available at `dlt.aurigraph.io/dpa`.

## Testing Erasure

In SANDBOX tier, erasure executes in under a minute (vs 7 days in production). Use this to test your compliance workflows.

```python
# Create a test user, then erase immediately
receipt = client.gdpr.request_erasure("test-user-" + uuid.uuid4())
assert receipt.status == "ACCEPTED"

# In SANDBOX, the second export will fail
time.sleep(60)
try:
    client.gdpr.export_user_data("test-user-...")
except AurigraphClientError as e:
    assert e.status_code == 404  # ERR_GDPR_002: No data found
```

## See Also

- [Authentication](authentication.md) — identity verification for erasure requests
- [Error Handling](error-handling.md) — ERR_GDPR_* error codes
- [api-reference/gdpr.md](api-reference/gdpr.md) — full API reference
