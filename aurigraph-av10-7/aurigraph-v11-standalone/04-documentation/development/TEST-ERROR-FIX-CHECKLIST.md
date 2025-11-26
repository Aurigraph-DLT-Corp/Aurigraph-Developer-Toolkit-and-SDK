# Test Error Fix Checklist - 56 Errors

**Generated**: October 29, 2025
**Total Errors**: 56
**Files Affected**: 6 files
**Estimated Time**: 6-8 hours

---

## Overview by Category

| Category | Files | Errors | Priority | Est. Time |
|----------|-------|--------|----------|-----------|
| **Variable Assignment** | 1 | 1 | P0 | 30 min |
| **Static Class** | 1 | 5 | P0 | 1 hour |
| **Type Mismatch** | 1 | 16 | P1 | 2 hours |
| **Symbol Errors (Base)** | 1 | 7 | P1 | 2 hours |
| **Symbol Errors (Pool)** | 1 | 27 | P2 | 3 hours |
| **Symbol Errors (Builder)** | 1 | 2 | P3 | 1 hour |

---

# Category 1: Variable Assignment (1 error) ✅

## File 1: MerkleTreeBuilder.java

**Location**: `src/test/java/io/aurigraph/v11/tokenization/MerkleTreeBuilder.java`

### Error #1 (Line 46)
- **Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Complete
- **Priority**: P0 (CRITICAL)
- **Error**: `variable digest might already have been assigned`
- **Estimated Time**: 30 minutes

**Current Code** (Line 46):
```java
digest = MessageDigest.getInstance("SHA-256");
```

**Fix Required**:
```java
digest.reset(); // Reset existing instance instead of reassign
```

**Verification Command**:
```bash
./mvnw test-compile -Dtest=MerkleTreeBuilder
grep "BUILD SUCCESS" target/maven-status/maven-compiler-plugin/testCompile/default-testCompile/inputFiles.lst
```

**Notes**:
- MessageDigest already initialized earlier in method
- Need to reset instead of reassign
- Simple one-line fix

---

# Category 2: Static Class Instantiation (5 errors) ✅

## File 2: TestDataBuilder.java

**Location**: `src/test/java/io/aurigraph/v11/tokenization/TestDataBuilder.java`

### Error #2 (Line 390)
- **Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Complete
- **Priority**: P0 (CRITICAL)
- **Error**: `qualified new of static class`
- **Estimated Time**: 10 minutes

**Current Code**:
```java
return strategyType.new RebalancingStrategy(params);
```

**Fix Required**:
```java
return new RebalancingStrategy(params);
```

### Error #3 (Line 396)
- **Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Complete
- **Priority**: P0 (CRITICAL)
- **Error**: `qualified new of static class`
- **Estimated Time**: 10 minutes

**Current Code**:
```java
return strategyType.new WeightedStrategy(params);
```

**Fix Required**:
```java
return new WeightedStrategy(params);
```

### Error #4 (Line 402)
- **Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Complete
- **Priority**: P0 (CRITICAL)
- **Error**: `qualified new of static class`
- **Estimated Time**: 10 minutes

**Current Code**:
```java
return strategyType.new RiskBasedStrategy(params);
```

**Fix Required**:
```java
return new RiskBasedStrategy(params);
```

### Error #5 (Line 408)
- **Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Complete
- **Priority**: P0 (CRITICAL)
- **Error**: `qualified new of static class`
- **Estimated Time**: 10 minutes

**Current Code**:
```java
return strategyType.new VolatilityStrategy(params);
```

**Fix Required**:
```java
return new VolatilityStrategy(params);
```

### Error #6 (Line 414)
- **Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Complete
- **Priority**: P0 (CRITICAL)
- **Error**: `qualified new of static class`
- **Estimated Time**: 10 minutes

**Current Code**:
```java
return strategyType.new CustomStrategy(params);
```

**Fix Required**:
```java
return new CustomStrategy(params);
```

**Verification Command**:
```bash
./mvnw test-compile -Dtest=TestDataBuilder
./mvnw test-compile 2>&1 | grep -c "ERROR"  # Should be 51
```

**Notes**:
- Same pattern repeated 5 times
- Can use find-replace: `strategyType.new ` → `new `
- All fixes identical, just different strategy names

---

# Category 3: Type Mismatch - List to String (16 errors) ✅

## File 3: MerkleTreeServiceTest.java

**Location**: `src/test/java/io/aurigraph/v11/tokenization/aggregation/MerkleTreeServiceTest.java`

### Error #7 (Line 178)
- **Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Complete
- **Priority**: P1 (HIGH)
- **Error**: `incompatible types: List<String> cannot be converted to String`
- **Estimated Time**: 5 minutes

**Current Code**:
```java
String proof = merkleTree.generateProof(assetIds);
```

**Fix Required**:
```java
String proof = merkleTree.generateProof(assetIds.get(0));
```

### Error #8 (Line 196)
- **Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Complete
- **Priority**: P1 (HIGH)
- **Error**: `incompatible types: List<String> cannot be converted to String`
- **Estimated Time**: 5 minutes

**Current Code**:
```java
String proof1 = merkleTree.generateProof(assetIds);
```

**Fix Required**:
```java
String proof1 = merkleTree.generateProof(assetIds.get(0));
```

### Error #9 (Line 197)
- **Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Complete
- **Priority**: P1 (HIGH)
- **Error**: `incompatible types: List<String> cannot be converted to String`
- **Estimated Time**: 5 minutes

**Current Code**:
```java
String proof2 = merkleTree.generateProof(assetIds);
```

**Fix Required**:
```java
String proof2 = merkleTree.generateProof(assetIds.get(1));
```

### Error #10 (Line 211)
- **Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Complete
- **Priority**: P1 (HIGH)
- **Error**: `incompatible types: List<String> cannot be converted to String`
- **Estimated Time**: 5 minutes

**Current Code**:
```java
String proof1 = merkleTree.generateProof(assetIds);
```

**Fix Required**:
```java
String proof1 = merkleTree.generateProof(assetIds.get(0));
```

### Error #11 (Line 212)
- **Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Complete
- **Priority**: P1 (HIGH)
- **Error**: `incompatible types: List<String> cannot be converted to String`
- **Estimated Time**: 5 minutes

**Current Code**:
```java
String proof2 = merkleTree.generateProof(assetIds);
```

**Fix Required**:
```java
String proof2 = merkleTree.generateProof(assetIds.get(1));
```

### Error #12 (Line 227)
- **Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Complete
- **Priority**: P1 (HIGH)
- **Error**: `incompatible types: List<String> cannot be converted to String`
- **Estimated Time**: 5 minutes

**Current Code**:
```java
boolean valid = merkleTree.verifyProof(assetIds, proof, root);
```

**Fix Required**:
```java
boolean valid = merkleTree.verifyProof(assetIds.get(0), proof, root);
```

### Error #13 (Line 246)
- **Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Complete
- **Priority**: P1 (HIGH)
- **Error**: `incompatible types: List<String> cannot be converted to String`
- **Estimated Time**: 5 minutes

**Current Code**:
```java
String proof = merkleTree.generateProof(assetIds);
```

**Fix Required**:
```java
String proof = merkleTree.generateProof(assetIds.get(0));
```

### Error #14 (Line 283)
- **Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Complete
- **Priority**: P1 (HIGH)
- **Error**: `incompatible types: List<String> cannot be converted to String`
- **Estimated Time**: 5 minutes

**Current Code**:
```java
boolean valid = merkleTree.verifyProof(assetIds, proof, root);
```

**Fix Required**:
```java
boolean valid = merkleTree.verifyProof(assetIds.get(0), proof, root);
```

### Error #15 (Line 301)
- **Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Complete
- **Priority**: P1 (HIGH)
- **Error**: `incompatible types: List<String> cannot be converted to String`
- **Estimated Time**: 5 minutes

**Current Code**:
```java
String proof = merkleTree.generateProof(assetIds);
```

**Fix Required**:
```java
String proof = merkleTree.generateProof(assetIds.get(0));
```

### Error #16 (Line 357)
- **Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Complete
- **Priority**: P1 (HIGH)
- **Error**: `incompatible types: List<String> cannot be converted to String`
- **Estimated Time**: 5 minutes

**Current Code**:
```java
String proof = merkleTree.generateProof(assetIds);
```

**Fix Required**:
```java
String proof = merkleTree.generateProof(assetIds.get(0));
```

### Error #17 (Line 445)
- **Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Complete
- **Priority**: P1 (HIGH)
- **Error**: `incompatible types: List<String> cannot be converted to String`
- **Estimated Time**: 5 minutes

**Current Code**:
```java
String proof = merkleTree.generateProof(assetIds);
```

**Fix Required**:
```java
String proof = merkleTree.generateProof(assetIds.get(0));
```

### Errors #18-23 (Lines 250, 269, 286, 302, 358, 446)
- **Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Complete
- **Priority**: P1 (HIGH)
- **Error**: `cannot find symbol` (auto-resolve after type fixes)
- **Estimated Time**: 30 minutes (investigation)

**Notes**:
- These errors should auto-resolve after fixing type mismatches
- If they persist, investigate missing imports or method signatures
- Verify after completing errors #7-17

**Verification Command**:
```bash
./mvnw test-compile -Dtest=MerkleTreeServiceTest
./mvnw test-compile 2>&1 | grep -c "ERROR"  # Should be 29
```

**Find-Replace Pattern**:
```bash
# Search: generateProof\(assetIds\)
# Replace: generateProof(assetIds.get(0))

# Search: verifyProof\(assetIds,
# Replace: verifyProof(assetIds.get(0),
```

---

# Category 4: Symbol Errors - Base Class (7 errors) ✅

## File 4: TokenizationTestBase.java

**Location**: `src/test/java/io/aurigraph/v11/tokenization/TokenizationTestBase.java`

### Error #24 (Line 101)
- **Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Complete
- **Priority**: P1 (HIGH)
- **Error**: `cannot find symbol`
- **Estimated Time**: 30 minutes (investigation required)

**Investigation Steps**:
```bash
# Find actual class/method name
grep -r "PoolConfiguration" src/main/java/io/aurigraph/v11/tokenization/
# Check line 101 context
sed -n '95,105p' src/test/java/io/aurigraph/v11/tokenization/TokenizationTestBase.java
```

**Expected Fix**:
```java
// Add missing import or fix class name
import io.aurigraph.v11.tokenization.aggregation.models.PoolConfiguration;
```

### Error #25 (Line 120)
- **Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Complete
- **Priority**: P1 (HIGH)
- **Error**: `unexpected type`
- **Estimated Time**: 20 minutes

**Investigation Steps**:
```bash
# Find enum definition
grep -r "enum.*RebalancingStrategy" src/main/java/io/aurigraph/v11/tokenization/
```

**Expected Fix**:
```java
// ❌ BEFORE:
RebalancingStrategy strategy = RebalancingStrategy.MARKET_CAP;

// ✅ AFTER:
RebalancingStrategy strategy = RebalancingStrategy.MARKET_CAP_WEIGHT;
```

### Error #26 (Line 121)
- **Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Complete
- **Priority**: P1 (HIGH)
- **Error**: `unexpected type`
- **Estimated Time**: 20 minutes

**Expected Fix**:
```java
// ❌ BEFORE:
VotingMechanism voting = VotingMechanism.WEIGHTED;

// ✅ AFTER:
VotingMechanism voting = VotingMechanism.WEIGHTED_VOTING;
```

### Error #27 (Line 122)
- **Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Complete
- **Priority**: P1 (HIGH)
- **Error**: `unexpected type`
- **Estimated Time**: 20 minutes

**Expected Fix**:
```java
// ❌ BEFORE:
GovernanceType governance = GovernanceType.MULTI_TIER;

// ✅ AFTER:
GovernanceType governance = GovernanceType.SUPERMAJORITY;
// OR
GovernanceType governance = GovernanceType.WEIGHTED_VOTING;
```

### Error #28 (Line 159)
- **Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Complete
- **Priority**: P1 (HIGH)
- **Error**: `cannot find symbol`
- **Estimated Time**: 20 minutes

**Investigation Steps**:
```bash
# Check Asset model for actual method name
grep -A 20 "class Asset" src/main/java/io/aurigraph/v11/tokenization/aggregation/models/Asset.java | grep "assetClass\|assetType"
```

**Expected Fix**:
```java
// ❌ BEFORE:
String assetClass = asset.assetClass();

// ✅ AFTER:
String assetType = asset.assetType();
```

### Error #29 (Line 169)
- **Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Complete
- **Priority**: P1 (HIGH)
- **Error**: `cannot find symbol`
- **Estimated Time**: 20 minutes

**Investigation Steps**:
```bash
# Check Pool model for actual method name
grep -A 20 "class.*Pool" src/main/java/io/aurigraph/v11/tokenization/aggregation/models/*.java | grep "getPoolToken\|getToken"
```

**Expected Fix**:
```java
// ❌ BEFORE:
Token poolToken = pool.getPoolToken();

// ✅ AFTER:
Token token = pool.getToken();
```

**Verification Command**:
```bash
./mvnw test-compile -Dtest=TokenizationTestBase
./mvnw test-compile 2>&1 | grep -c "ERROR"  # Should be 22
```

**Notes**:
- Requires investigation of actual model classes
- Enum values may have changed during refactoring
- Method names likely renamed for consistency

---

# Category 5: Symbol Errors - Pool Service (27 errors) ✅

## File 5: AggregationPoolServiceTest.java

**Location**: `src/test/java/io/aurigraph/v11/tokenization/aggregation/AggregationPoolServiceTest.java`

### Errors #30-31 (Lines 66, 233) - Mock Return Type
- **Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Complete
- **Priority**: P2 (MEDIUM)
- **Error**: `no suitable method found for thenReturn(AssetValidationResult)`
- **Estimated Time**: 30 minutes

**Current Code**:
```java
when(validator.validate(any())).thenReturn(new AssetValidationResult(true));
```

**Fix Required**:
```java
when(validator.validate(any())).thenReturn(ValidationResult.success());
```

**Investigation**:
```bash
# Find actual ValidationResult class
grep -r "class.*ValidationResult" src/main/java/io/aurigraph/v11/tokenization/
```

### Errors #32-44 (Lines 116, 117, 144, 177, 354, 368, 389, 414, 415, 445, 473, 475, 501) - assetClass() → assetType()
- **Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Complete
- **Priority**: P2 (MEDIUM)
- **Error**: `cannot find symbol` (method assetClass())
- **Estimated Time**: 60 minutes

**Pattern**:
```java
// ❌ BEFORE:
assertEquals("EQUITY", asset.assetClass());

// ✅ AFTER:
assertEquals("EQUITY", asset.assetType());
```

**Find-Replace**:
```bash
# In AggregationPoolServiceTest.java
# Search: \.assetClass\(\)
# Replace: .assetType()
```

### Errors #45-52 (Lines 68, 198, 281, 376, 397, 409, 430, 486) - getPoolToken() → getToken()
- **Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Complete
- **Priority**: P2 (MEDIUM)
- **Error**: `cannot find symbol` (method getPoolToken())
- **Estimated Time**: 40 minutes

**Pattern**:
```java
// ❌ BEFORE:
Token token = pool.getPoolToken();

// ✅ AFTER:
Token token = pool.getToken();
```

**Find-Replace**:
```bash
# Search: \.getPoolToken\(\)
# Replace: .getToken()
```

### Error #53 (Line 289) - Enum Value
- **Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Complete
- **Priority**: P2 (MEDIUM)
- **Error**: `cannot find symbol` (MARKET_CAP)
- **Estimated Time**: 10 minutes

**Pattern**:
```java
// ❌ BEFORE:
RebalancingStrategy.MARKET_CAP

// ✅ AFTER:
RebalancingStrategy.MARKET_CAP_WEIGHT
```

**Verification Command**:
```bash
./mvnw test-compile -Dtest=AggregationPoolServiceTest
./mvnw test-compile 2>&1 | grep -c "ERROR"  # Should be 2
```

**Notes**:
- Many errors have same pattern (method rename)
- Use find-replace for efficiency
- Test incrementally after each batch of fixes

---

# Category 6: Symbol Errors - Builder Test (2 errors) ✅

## File 6: MerkleTreeBuilderTest.java

**Location**: `src/test/java/io/aurigraph/v11/tokenization/MerkleTreeBuilderTest.java`

### Error #55 (Line 232)
- **Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Complete
- **Priority**: P3 (LOW)
- **Error**: `cannot find symbol`
- **Estimated Time**: 30 minutes

**Investigation Steps**:
```bash
# View line 232 context
sed -n '228,238p' src/test/java/io/aurigraph/v11/tokenization/MerkleTreeBuilderTest.java

# Find MerkleTreeBuilder methods
grep -A 5 "public.*add" src/test/java/io/aurigraph/v11/tokenization/MerkleTreeBuilder.java
```

**Expected Fix**:
```java
// ❌ BEFORE:
builder.addLeaf(assetId);

// ✅ AFTER:
builder.addAsset(assetId);
```

### Error #56 (Line 235)
- **Status**: ⬜ Not Started / ⬜ In Progress / ⬜ Complete
- **Priority**: P3 (LOW)
- **Error**: `cannot find symbol`
- **Estimated Time**: 30 minutes

**Investigation Steps**:
```bash
# View line 235 context
sed -n '230,240p' src/test/java/io/aurigraph/v11/tokenization/MerkleTreeBuilderTest.java

# Find hash method
grep -A 5 "public.*hash" src/test/java/io/aurigraph/v11/tokenization/MerkleTreeBuilder.java
```

**Expected Fix**:
```java
// ❌ BEFORE:
builder.computeHash(data);

// ✅ AFTER:
builder.hashData(data);
```

**Verification Command**:
```bash
./mvnw test-compile -Dtest=MerkleTreeBuilderTest
./mvnw test-compile 2>&1 | grep -c "ERROR"  # Should be 0
```

**Notes**:
- Final 2 errors
- Require investigation of actual method signatures
- Low priority (can be done last)

---

# Progress Summary Checklist

## By File

- [ ] **MerkleTreeBuilder.java** (1 error)
  - [ ] Line 46: Variable digest reassignment

- [ ] **TestDataBuilder.java** (5 errors)
  - [ ] Line 390: RebalancingStrategy static class
  - [ ] Line 396: WeightedStrategy static class
  - [ ] Line 402: RiskBasedStrategy static class
  - [ ] Line 408: VolatilityStrategy static class
  - [ ] Line 414: CustomStrategy static class

- [ ] **MerkleTreeServiceTest.java** (16 errors)
  - [ ] Lines 178, 196, 197, 211, 212, 227, 246, 283, 301, 357, 445: List → String
  - [ ] Lines 250, 269, 286, 302, 358, 446: Symbol errors (auto-resolve)

- [ ] **TokenizationTestBase.java** (7 errors)
  - [ ] Line 101: Cannot find symbol
  - [ ] Line 120: Enum MARKET_CAP → MARKET_CAP_WEIGHT
  - [ ] Line 121: Enum WEIGHTED → WEIGHTED_VOTING
  - [ ] Line 122: Enum MULTI_TIER → SUPERMAJORITY
  - [ ] Line 159: assetClass() → assetType()
  - [ ] Line 169: getPoolToken() → getToken()

- [ ] **AggregationPoolServiceTest.java** (27 errors)
  - [ ] Lines 66, 233: Mock return type
  - [ ] 13 instances: assetClass() → assetType()
  - [ ] 8 instances: getPoolToken() → getToken()
  - [ ] Line 289: MARKET_CAP → MARKET_CAP_WEIGHT

- [ ] **MerkleTreeBuilderTest.java** (2 errors)
  - [ ] Line 232: Method name fix
  - [ ] Line 235: Method name fix

## By Priority

### P0 - CRITICAL (6 errors) - Day 1
- [ ] MerkleTreeBuilder.java (1 error)
- [ ] TestDataBuilder.java (5 errors)

### P1 - HIGH (23 errors) - Day 2
- [ ] MerkleTreeServiceTest.java (16 errors)
- [ ] TokenizationTestBase.java (7 errors)

### P2 - MEDIUM (27 errors) - Day 3
- [ ] AggregationPoolServiceTest.java (27 errors)

### P3 - LOW (2 errors) - Day 3
- [ ] MerkleTreeBuilderTest.java (2 errors)

## Validation Steps

- [ ] After P0 fixes: 50 errors remaining
- [ ] After P1 fixes: 27 errors remaining
- [ ] After P2 fixes: 0 errors remaining
- [ ] Full test-compile: 0 errors
- [ ] Full test run: All passing
- [ ] Native build: Success

---

**Total Errors**: 56
**Errors Fixed**: _____ / 56
**Completion**: _____ %

**Last Updated**: _________
**Completed By**: _________
