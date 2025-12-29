# SPK Network 2.0 Documentation

## Overview

SPK Network 2.0 is a streamlined decentralized storage validation protocol. This is the next evolution of the SPK Network, removing unnecessary complexity while preserving the core innovation: **Proof of Access (PoA)**.

---

## Documentation Index

### Core Documentation

| Document | Description |
|----------|-------------|
| [SPK Network 2.0 PoA Protocol](./SPK_NETWORK_2.0_POA.md) | Complete technical specification of the Proof of Access algorithm and protocol |
| [Architecture](./ARCHITECTURE.md) | System architecture, component design, and data flow |

### Guides

| Guide | Audience |
|-------|----------|
| [Validator Guide](./VALIDATOR_GUIDE.md) | Hive Witnesses who want to run PoA validators |
| [Storage Node Guide](./STORAGE_NODE_GUIDE.md) | Operators who want to provide storage and earn HBD |

---

## Quick Links

### For Developers

- [Original SPK Network PoA](https://github.com/spknetwork/proofofaccess) - The Go implementation we ported
- [Hive Blockchain](https://hive.io) - The blockchain we use for payments and reputation
- [IPFS Documentation](https://docs.ipfs.tech) - The storage layer

### Key Concepts

- **Proof of Access (PoA)**: Cryptographic verification that a node has a file without downloading the entire file
- **Validator**: A node that audits storage providers (typically Hive Witnesses)
- **Storage Node**: A node that stores files and earns HBD for passing PoA challenges
- **HBD**: Hive Backed Dollar - the stablecoin used for payments

---

## What Changed from SPK Network 1.0

### Removed

| Component | Reason |
|-----------|--------|
| Honeycomb | Unnecessary middleware layer |
| LARYNX token | Simplified to HBD only |
| BROCA token | Simplified to HBD only |
| SPK token | Simplified to HBD only |
| Complex tokenomics | Reduced speculation, increased utility |
| libp2p PubSub | Replaced with simpler WebSocket/REST |

### Kept

| Component | Why |
|-----------|-----|
| PoA Algorithm | Core innovation - works well |
| IPFS Integration | Standard for decentralized storage |
| Hive Blockchain | Proven, fast, free transactions |
| Witness-as-Validator | Already trusted infrastructure |

### Added

| Component | Benefit |
|-----------|---------|
| Direct HBD payments | Simpler economics |
| REST/WebSocket API | Easier integration |
| Web UI Dashboard | Better monitoring |
| Simulation mode | Easy development/testing |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    SPK NETWORK 2.0                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   USERS ──────▶ IPFS ◀────── STORAGE NODES                 │
│      │           │                │                         │
│      │           │                │                         │
│      ▼           ▼                ▼                         │
│   ┌─────────────────────────────────────────┐              │
│   │           VALIDATORS (PoA)              │              │
│   │     Challenge → Verify → Record         │              │
│   └─────────────────────────────────────────┘              │
│                      │                                      │
│                      ▼                                      │
│   ┌─────────────────────────────────────────┐              │
│   │         HIVE BLOCKCHAIN                 │              │
│   │   Payments • Reputation • Governance    │              │
│   └─────────────────────────────────────────┘              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Getting Started

### Run in Simulation Mode

```bash
# Clone and install
git clone <repository>
cd spk-network-2.0
npm install

# Initialize database
npm run db:push

# Start in simulation mode
npm run dev
```

### Run in Live Mode

```bash
# Set environment variables
export SPK_POA_URL=http://your-spk-node:3000
export IPFS_API_URL=http://127.0.0.1:5001
export HIVE_USERNAME=your-account
export HIVE_POSTING_KEY=5K...

# Start
npm run dev
```

---

## Contributing

This is an open-source project. Contributions welcome:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

---

## Credits

### Original SPK Network
- Steven Ettinger (@disregardfiat)
- Nathan Senn (@nathansenn)

### SPK Network 2.0
Built on the foundation of the original, streamlined for efficiency.

---

## License

Unlicense - Free for any use.
