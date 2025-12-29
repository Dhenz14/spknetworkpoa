# SPK Network 2.0 - Architecture Documentation

## System Overview

SPK Network 2.0 is a decentralized storage validation system that combines:
- **IPFS** for content-addressed storage
- **Hive blockchain** for payments and reputation
- **Proof of Access (PoA)** for storage verification

## Design Philosophy

### What We Simplified

| Original SPK | SPK 2.0 | Rationale |
|--------------|---------|-----------|
| Honeycomb smart contract layer | Direct Hive integration | Reduces complexity, fewer failure points |
| LARYNX + BROCA + SPK tokens | HBD only | Simpler economics, less speculation |
| Custom consensus | Hive DPoS (witnesses) | Leverages existing trusted validator set |
| libp2p PubSub messaging | WebSocket + REST | Easier to integrate, debug, and scale |
| Heavy Go binary | Lightweight Node.js | Faster iteration, web-native |

### Core Principles

1. **Stateless Validators** - No local storage required, just IPFS access
2. **Direct Payments** - HBD flows directly to storage providers
3. **Federated Trust** - Hive Witnesses as validators (already trusted)
4. **Minimal Dependencies** - Only IPFS and Hive blockchain needed

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SPK NETWORK 2.0                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   FRONTEND (React + Vite)                                                   │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  Dashboard │ Storage │ Validators │ Wallet │ Node Status │ Settings│   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    │ HTTP/WebSocket                         │
│                                    ▼                                        │
│   BACKEND (Express.js)                                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │   │
│   │   │   Routes    │  │  WebSocket  │  │   Storage   │                │   │
│   │   │   /api/*    │  │   Server    │  │  Interface  │                │   │
│   │   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                │   │
│   │          │                │                │                        │   │
│   │          └────────────────┼────────────────┘                        │   │
│   │                           │                                         │   │
│   │   ┌───────────────────────┴───────────────────────┐                │   │
│   │   │                  SERVICES                      │                │   │
│   │   │                                                │                │   │
│   │   │  ┌──────────────┐  ┌──────────────────────┐   │                │   │
│   │   │  │  PoA Engine  │  │   Hive Simulator     │   │                │   │
│   │   │  │              │  │   (dev only)         │   │                │   │
│   │   │  └──────┬───────┘  └──────────────────────┘   │                │   │
│   │   │         │                                      │                │   │
│   │   │  ┌──────┴───────────────────────────────┐     │                │   │
│   │   │  │                                      │     │                │   │
│   │   │  ▼                ▼                ▼    │     │                │   │
│   │   │  ┌─────────┐  ┌─────────┐  ┌─────────┐  │     │                │   │
│   │   │  │  IPFS   │  │   SPK   │  │  Hive   │  │     │                │   │
│   │   │  │ Client  │  │  Client │  │ Client  │  │     │                │   │
│   │   │  └────┬────┘  └────┬────┘  └────┬────┘  │     │                │   │
│   │   │       │            │            │       │     │                │   │
│   │   └───────┼────────────┼────────────┼───────┘     │                │   │
│   │           │            │            │             │                │   │
│   └───────────┼────────────┼────────────┼─────────────┘                │   │
│               │            │            │                               │   │
└───────────────┼────────────┼────────────┼───────────────────────────────┘   │
                │            │            │                                    
    ┌───────────▼──────┐ ┌───▼────┐ ┌─────▼─────┐                             
    │      IPFS        │ │  SPK   │ │   Hive    │                             
    │     Network      │ │  PoA   │ │Blockchain │                             
    │                  │ │ Nodes  │ │           │                             
    └──────────────────┘ └────────┘ └───────────┘                             
```

---

## Service Layer

### PoA Engine (`server/services/poa-engine.ts`)

The core orchestrator that:
- Schedules validation challenges
- Coordinates with IPFS, SPK, and Hive clients
- Records results and updates reputation
- Handles both simulation and live modes

```typescript
class PoAEngine {
  // Configuration
  private config: PoAConfig;
  
  // External service clients
  private ipfsClient: IPFSClient;
  private spkClient: SPKPoAClient;
  private hiveClient: HiveClient;
  
  // Core methods
  async start(validatorUsername: string): Promise<void>;
  async runChallenge(): Promise<void>;
  async recordChallengeResult(...): Promise<void>;
}
```

### IPFS Client (`server/services/ipfs-client.ts`)

Interfaces with IPFS nodes for:
- `cat(cid)` - Fetch file/block content
- `refs(cid)` - List block CIDs for a file
- `isOnline()` - Health check

Supports both real IPFS API and mock mode for testing.

### SPK PoA Client (`server/services/spk-poa-client.ts`)

WebSocket client for SPK PoA nodes:
- Connects to `/validate` endpoint
- Sends proof requests
- Receives proof responses with timing

### Hive Client (`server/services/hive-client.ts`)

Blockchain integration via `@hiveio/dhive`:
- `broadcastPoAResult()` - Post validation results
- `broadcastReputationUpdate()` - Record reputation changes
- `transferHBD()` - Send payments to storage nodes

### PoA Crypto (`server/services/poa-crypto.ts`)

Cryptographic primitives:
- `getIntFromHash()` - FNV-1a block selection
- `hashFile()` - SHA256 hashing
- `createProofHash()` - Full proof generation
- `createRandomHash()` - Salt generation

---

## Data Layer

### Database Schema (`shared/schema.ts`)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   validators    │     │  storage_nodes  │     │     files       │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │     │ id              │
│ hiveUsername    │     │ peerId          │     │ cid             │
│ hiveRank        │     │ hiveUsername    │     │ name            │
│ status          │     │ reputation      │     │ size            │
│ peerCount       │     │ status          │     │ uploaderUsername│
│ performance     │     │ totalProofs     │     │ status          │
│ jobAllocation   │     │ failedProofs    │     │ replicationCount│
│ payoutRate      │     │ lastSeen        │     │ confidence      │
│ version         │     │ createdAt       │     │ poaEnabled      │
│ createdAt       │     └────────┬────────┘     │ createdAt       │
└────────┬────────┘              │              └────────┬────────┘
         │                       │                       │
         │              ┌────────┴────────┐              │
         │              │                 │              │
         ▼              ▼                 ▼              ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│      poa_challenges         │   │    storage_assignments      │
├─────────────────────────────┤   ├─────────────────────────────┤
│ id                          │   │ id                          │
│ validatorId ────────────────│   │ fileId ─────────────────────│
│ nodeId ─────────────────────│   │ nodeId ─────────────────────│
│ fileId ─────────────────────│   │ status                      │
│ challengeData               │   │ lastProofAt                 │
│ response                    │   │ proofCount                  │
│ result                      │   │ createdAt                   │
│ latencyMs                   │   └─────────────────────────────┘
│ createdAt                   │
└─────────────────────────────┘

┌─────────────────────────────┐
│    hive_transactions        │
├─────────────────────────────┤
│ id                          │
│ type                        │
│ fromUser                    │
│ toUser                      │
│ payload                     │
│ blockNumber                 │
│ createdAt                   │
└─────────────────────────────┘
```

### Storage Interface (`server/storage.ts`)

Abstraction layer for all database operations:
- CRUD for all entities
- Transaction support
- Type-safe with Drizzle ORM

---

## Frontend Architecture

### Pages

| Page | Purpose |
|------|---------|
| Dashboard | Overview stats, recent activity |
| Storage | File management, upload |
| Validators | Validator list, status |
| Wallet | HBD balance, transactions |
| Node Status | Storage node health |
| Settings | Configuration |

### State Management

- **React Query** for server state
- **WebSocket** for real-time updates
- **Local state** for UI-only concerns

### Component Library

- **Radix UI** primitives
- **Tailwind CSS** styling
- **shadcn/ui** component patterns

---

## Operating Modes

### Simulation Mode (Default)

```
SPK_POA_URL not set → Simulation Mode

- Mock IPFS client with in-memory storage
- Simulated challenge success/failure
- Local database logging
- No external dependencies
```

### Live Mode

```
SPK_POA_URL set → Live Mode

- Real IPFS HTTP API
- WebSocket to SPK PoA nodes
- Hive blockchain broadcasts
- Full production operation
```

---

## Deployment Architecture

### Development

```
┌─────────────────┐
│   Replit IDE    │
│                 │
│  ┌───────────┐  │
│  │  Node.js  │  │
│  │  Server   │  │
│  └─────┬─────┘  │
│        │        │
│  ┌─────▼─────┐  │
│  │ PostgreSQL│  │
│  │ (Neon)    │  │
│  └───────────┘  │
└─────────────────┘
```

### Production

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRODUCTION                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐           │
│  │   CDN       │   │  App Server │   │  Database   │           │
│  │  (Static)   │   │  (Node.js)  │   │ (PostgreSQL)│           │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘           │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                     │
│                    ┌──────▼──────┐                              │
│                    │   IPFS      │                              │
│                    │   Gateway   │                              │
│                    └──────┬──────┘                              │
│                           │                                     │
│            ┌──────────────┼──────────────┐                      │
│            │              │              │                      │
│            ▼              ▼              ▼                      │
│     ┌───────────┐  ┌───────────┐  ┌───────────┐                │
│     │ IPFS Node │  │ SPK PoA   │  │   Hive    │                │
│     │           │  │   Node    │  │   API     │                │
│     └───────────┘  └───────────┘  └───────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Considerations

### Key Management

| Key | Storage | Purpose |
|-----|---------|---------|
| HIVE_POSTING_KEY | Secrets | Sign custom_json operations |
| HIVE_ACTIVE_KEY | Secrets | Sign HBD transfers |
| DATABASE_URL | Environment | Database connection |

### Attack Mitigations

| Attack | Mitigation |
|--------|------------|
| Challenge replay | Unique salt per challenge |
| Proof forgery | SHA256 cryptographic hash |
| Sybil attack | Hive account costs (RC) |
| DoS on validators | Rate limiting, witness rotation |

---

## Performance Characteristics

### Throughput

| Metric | Value |
|--------|-------|
| Challenges per second | ~0.2 (1 every 5 seconds) |
| Database ops per challenge | ~8 |
| IPFS calls per challenge | 1-5 |
| API response time | <50ms |

### Scalability

- **Horizontal**: Multiple validators can run independently
- **Vertical**: Node.js handles thousands of concurrent connections
- **Database**: PostgreSQL scales to millions of records

---

## Future Enhancements

1. **Challenge batching** - Multiple challenges per IPFS session
2. **Geographic routing** - Validators check nearby nodes first
3. **Proof caching** - Reduce redundant verification
4. **Light client mode** - Browser-based validation
5. **Multi-chain support** - Beyond Hive blockchain
