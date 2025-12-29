# SPK Network 2.0 - Proof of Access Protocol

## Overview

SPK Network 2.0 is a streamlined decentralized storage validation protocol built on the Hive blockchain. This is an evolution of the original SPK Network, removing unnecessary complexity (Honeycomb, multiple tokens) while preserving the core innovation: **Proof of Access (PoA)**.

### What We Kept
- Core PoA cryptographic algorithm (FNV-1a block selection, SHA256 proofs)
- IPFS integration for decentralized storage
- Hive blockchain for payments and reputation
- Validator/Storage Node architecture

### What We Removed
- Honeycomb middleware layer
- LARYNX, BROCA, and other intermediary tokens
- Complex token economics
- Unnecessary P2P messaging layers

### The Result
A lean, efficient storage validation system where:
- **Storage Nodes** earn HBD directly for storing files
- **Validators** (Hive Witnesses) audit storage nodes
- **Users** pay HBD to store files with cryptographic proof of availability

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SPK NETWORK 2.0                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐   │
│  │   USERS         │     │   VALIDATORS    │     │  STORAGE NODES  │   │
│  │                 │     │                 │     │                 │   │
│  │  Upload files   │     │  Top 150 Hive   │     │  Run IPFS nodes │   │
│  │  Pay HBD        │     │  Witnesses      │     │  Store files    │   │
│  │  Get CIDs       │     │  Run PoA audits │     │  Earn HBD       │   │
│  └────────┬────────┘     └────────┬────────┘     └────────┬────────┘   │
│           │                       │                       │             │
│           └───────────────────────┼───────────────────────┘             │
│                                   │                                     │
│                    ┌──────────────┴──────────────┐                      │
│                    │                             │                      │
│           ┌────────▼────────┐          ┌────────▼────────┐             │
│           │      IPFS       │          │      HIVE       │             │
│           │    Network      │          │   Blockchain    │             │
│           │                 │          │                 │             │
│           │  Decentralized  │          │  HBD Payments   │             │
│           │  File Storage   │          │  Reputation     │             │
│           │  Content        │          │  Transactions   │             │
│           │  Addressing     │          │  Governance     │             │
│           └─────────────────┘          └─────────────────┘             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Proof of Access Algorithm

### Purpose

PoA solves the fundamental problem of decentralized storage: **How do you prove someone is actually storing your data without downloading it every time?**

### The Solution: Cryptographic Sampling

Instead of verifying entire files, PoA:
1. Randomly selects specific chunks using a unique salt
2. Requires the storage node to prove they have those chunks
3. Verifies the proof mathematically

This gives high confidence (99%+) with minimal bandwidth (~1MB per check instead of potentially gigabytes).

---

## Algorithm Specification

### Step 1: Challenge Generation

The validator creates a unique challenge:

```
SALT = SHA256(random_bytes(32))
     = 64-character hexadecimal string
     Example: "a7b3c9d2e1f4a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3"
```

The salt ensures:
- Every challenge is unique
- Storage nodes cannot pre-compute answers
- Challenges are unpredictable

### Step 2: Block Selection (FNV-1a Hash)

IPFS splits large files into blocks (typically 256KB). The algorithm determines which blocks to verify:

```
Algorithm: FNV-1a (Fowler-Noll-Vo)
Constants:
  - offset_basis = 2166136261
  - prime = 16777619

function GetIntFromHash(hash_string, block_count):
    if block_count <= 7:
        return 1  // Small files: always check block 1
    
    h = 2166136261
    for each character c in hash_string:
        h = h XOR ASCII(c)
        h = h * 16777619
        h = h mod 2^32  // Keep as 32-bit unsigned
    
    return h mod block_count

Example:
  - File has 100 blocks
  - FNV1a("a7b3c9d2...") = 7,392,481,023
  - Initial seed = 7,392,481,023 mod 100 = 23
  - Start verification with block #23
```

### Step 3: Proof Generation

The storage node computes a proof by iterating through selected blocks:

```
function CreateProofHash(salt, CID, block_cids):
    proof_hash = ""
    length = count(block_cids)
    seed = GetIntFromHash(salt, length)
    
    for i = 0 to length:
        if seed >= length:
            break
        
        if i == seed:
            // Fetch block from IPFS
            block_bytes = IPFS_CAT(block_cids[seed])
            
            // Append salt to block content
            combined = block_bytes + salt
            
            // Hash the combined content
            block_hash = SHA256(combined)
            
            // Accumulate proof
            proof_hash = proof_hash + block_hash
            
            // Calculate next block to check
            seed = seed + GetIntFromHash(salt + proof_hash, length)
    
    // Final hash of all accumulated proofs
    return SHA256(proof_hash)
```

### Step 4: Verification

Both the validator and storage node run the same algorithm:
- Validator computes expected proof using IPFS access
- Storage node computes actual proof from local storage
- If proofs match: **PASS** (node has the file)
- If proofs differ: **FAIL** (node is missing data)

---

## Why This Works

### Security Properties

| Attack Vector | Why It Fails |
|--------------|--------------|
| **Claim without storing** | Cannot compute proof without actual file bytes |
| **Pre-compute answers** | Salt is random each challenge; proofs are unique |
| **Store partial file** | Random sampling eventually catches missing blocks |
| **Outsource to another node** | Network latency too high; timeout detection |
| **Guess the proof** | SHA256 has 2^256 possibilities; statistically impossible |

### Efficiency Properties

| Metric | Value | Benefit |
|--------|-------|---------|
| Blocks checked per challenge | 3-5 | Minimal bandwidth |
| Data transferred per challenge | ~1MB | Works on limited connections |
| Confidence per challenge | ~99% | High assurance |
| Time per challenge | <5 seconds | Fast verification cycle |

---

## Validator Operation

### Lightweight Design

Validators do NOT need to store files. They operate statelessly:

```
┌─────────────────────────────────────────────────────────────────┐
│                    VALIDATOR REQUIREMENTS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DOES NOT NEED:                    DOES NEED:                   │
│  ✗ Local file storage              ✓ IPFS network access        │
│  ✗ Large disk space                ✓ Hive account (witness)     │
│  ✗ Pre-downloaded content          ✓ Internet connection        │
│  ✗ File index copies               ✓ PoA software running       │
│                                                                 │
│  RESOURCE USAGE:                                                │
│  • CPU: Minimal (SHA256 hashing)                                │
│  • RAM: ~50MB for caching block CID lists                       │
│  • Bandwidth: ~1MB per challenge                                │
│  • Storage: None (stateless)                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Challenge Process

```
1. DISCOVER
   │
   ├── Query file registry (Hive blockchain or database)
   │   └── Returns: List of CIDs with PoA enabled
   │
   └── Query storage assignments
       └── Returns: Which nodes claim each file

2. SELECT
   │
   ├── Pick random file from registry
   │
   └── Pick random node that claims that file

3. CHALLENGE
   │
   ├── Generate unique SALT
   │
   ├── Fetch block CID list via IPFS refs (cached after first time)
   │
   └── Send challenge: {CID, SALT, validator_id}

4. VERIFY
   │
   ├── Fetch required blocks from IPFS
   │
   ├── Compute expected proof hash
   │
   └── Compare with node's response

5. RECORD
   │
   ├── On SUCCESS:
   │   ├── Increase node reputation (+1)
   │   └── Trigger HBD reward payment
   │
   └── On FAILURE:
       ├── Decrease node reputation (-5)
       └── Log slash event to Hive
```

### Caching Strategy

To minimize IPFS calls, validators cache:

```typescript
// Block CID lists are cached (they don't change for a file)
private blocksCache: Map<string, string[]> = new Map();

// First challenge: O(1) IPFS refs call
// Subsequent challenges: O(0) cache lookup
```

---

## Storage Node Operation

### Requirements

```
┌─────────────────────────────────────────────────────────────────┐
│                  STORAGE NODE REQUIREMENTS                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  REQUIRED:                                                      │
│  ✓ IPFS node (go-ipfs or js-ipfs)                              │
│  ✓ Files pinned locally                                         │
│  ✓ Hive account for receiving payments                         │
│  ✓ PoA responder software                                       │
│                                                                 │
│  RESOURCE USAGE:                                                │
│  • Storage: As much as you want to offer                        │
│  • Bandwidth: File seeding + challenge responses                │
│  • Uptime: Higher uptime = better reputation                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Challenge Response Flow

```
1. RECEIVE challenge from validator
   {CID: "QmX7...", SALT: "a7b3c9...", validator: "threespeak"}

2. LOCATE file blocks in local IPFS
   ipfs refs QmX7... → [block1, block2, block3, ...]

3. COMPUTE proof hash
   Run same algorithm as validator

4. RESPOND with proof
   {proof_hash: "f8a9b2...", latency_ms: 234}
```

---

## Reputation System

### Score Mechanics

| Event | Reputation Change |
|-------|------------------|
| Pass PoA challenge | +1 |
| Fail PoA challenge | -5 |
| Maximum score | 100 |
| Minimum score | 0 |

### Status Tiers

| Reputation | Status | Effects |
|------------|--------|---------|
| 70-100 | Active | Full rewards, priority challenges |
| 30-69 | Probation | Reduced rewards, more frequent audits |
| 10-29 | Warning | Minimal rewards, high audit frequency |
| 0-9 | Banned | No rewards, excluded from new assignments |

### Recovery Path

Banned nodes can recover by:
1. Ensuring files are properly pinned
2. Passing consecutive challenges
3. Gradually rebuilding reputation

---

## Payment Flow

### Direct HBD Payments

Unlike the original SPK Network's multi-token system, 2.0 uses HBD directly:

```
┌──────────────┐    Upload + HBD    ┌──────────────┐
│    USER      │ ─────────────────▶ │   ESCROW     │
└──────────────┘                    └──────┬───────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                    ▼                      ▼                      ▼
            ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
            │ Storage Node │       │ Storage Node │       │ Storage Node │
            │   0.001 HBD  │       │   0.001 HBD  │       │   0.001 HBD  │
            │  per proof   │       │  per proof   │       │  per proof   │
            └──────────────┘       └──────────────┘       └──────────────┘
```

### Simplified Economics

| Old SPK Network | SPK Network 2.0 |
|-----------------|-----------------|
| LARYNX governance token | Hive witness voting |
| BROCA bandwidth token | Direct HBD payments |
| SPK rewards token | HBD only |
| Honeycomb layer | Removed |
| Complex tokenomics | Simple: Store → Prove → Earn HBD |

---

## API Reference

### Validator API

#### Start Challenge
```http
POST /api/challenges
Content-Type: application/json

{
  "nodeId": "uuid",
  "fileId": "uuid"
}
```

#### Get Challenge Results
```http
GET /api/challenges?validatorId={id}&limit=100
```

### Storage Node API

#### Register Node
```http
POST /api/nodes
Content-Type: application/json

{
  "peerId": "QmPeer...",
  "hiveUsername": "mynode"
}
```

#### Get Node Status
```http
GET /api/nodes/{id}
```

### WebSocket Events

Connect to `/ws` for real-time updates:

```javascript
// Incoming events
{
  "type": "challenge_result",
  "nodeId": "uuid",
  "result": "success",
  "reputation": 85
}

{
  "type": "hbd_transfer",
  "to": "storage-node",
  "amount": "0.001 HBD"
}
```

---

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SPK_POA_URL` | No | URL of SPK PoA node for live mode |
| `IPFS_API_URL` | No | IPFS HTTP API endpoint |
| `HIVE_USERNAME` | No | Hive account for broadcasts |
| `HIVE_POSTING_KEY` | No | Posting key for custom_json |
| `HIVE_ACTIVE_KEY` | No | Active key for HBD transfers |

### Operating Modes

| Mode | Condition | Behavior |
|------|-----------|----------|
| Simulation | No `SPK_POA_URL` set | Mock challenges, local testing |
| Live | `SPK_POA_URL` configured | Real IPFS/Hive integration |

---

## Implementation Files

| File | Purpose |
|------|---------|
| `server/services/poa-engine.ts` | Main PoA orchestration |
| `server/services/poa-crypto.ts` | Cryptographic functions (FNV-1a, SHA256) |
| `server/services/ipfs-client.ts` | IPFS HTTP API client |
| `server/services/spk-poa-client.ts` | WebSocket client for SPK nodes |
| `server/services/hive-client.ts` | Hive blockchain integration |
| `shared/schema.ts` | Database models |
| `server/storage.ts` | Storage layer interface |

---

## Credits

### Original SPK Network
- Steven Ettinger (@disregardfiat)
- Nathan Senn (@nathansenn)
- https://github.com/spknetwork/proofofaccess

### SPK Network 2.0
Built on the foundation of the original, streamlined for efficiency.

---

## License

This implementation follows the original SPK Network's Unlicense, making it freely available for any use.
