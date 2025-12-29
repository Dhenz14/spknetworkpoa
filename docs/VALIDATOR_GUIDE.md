# Validator Guide - SPK Network 2.0

## What is a Validator?

A validator (also called "PoA Police") is a node that audits storage providers to verify they're actually storing the files they claim to have. In SPK Network 2.0, validators are **Hive Witnesses** - already trusted members of the Hive blockchain ecosystem.

## Why Hive Witnesses?

| Benefit | Explanation |
|---------|-------------|
| **Already trusted** | Witnesses are elected by Hive stakeholders |
| **Infrastructure ready** | Already run 24/7 servers |
| **Economic alignment** | Witnesses earn from securing the network |
| **No new governance** | Leverages existing DPoS voting |

---

## Validator Requirements

### Hardware (Minimal)

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 1 core | 2+ cores |
| RAM | 512MB | 2GB |
| Storage | 1GB | 10GB (for logs) |
| Bandwidth | 10 Mbps | 100 Mbps |

Validators are **stateless** - they don't store files, only verify them.

### Software

- Node.js 18+ OR Docker
- Access to IPFS gateway/node
- Hive account with posting key

### Network

- Stable internet connection
- Ability to reach IPFS network
- Ability to broadcast to Hive blockchain

---

## Setting Up a Validator

### Step 1: Clone the Repository

```bash
git clone https://github.com/spknetwork/spk-network-2.0.git
cd spk-network-2.0
npm install
```

### Step 2: Configure Environment

Create a `.env` file:

```bash
# Required
DATABASE_URL=postgresql://user:pass@host:5432/dbname
HIVE_USERNAME=your-witness-account
HIVE_POSTING_KEY=5K...your-posting-key

# Optional (for live mode)
SPK_POA_URL=http://spk-node:3000
IPFS_API_URL=http://localhost:5001

# Optional (for HBD payments)
HIVE_ACTIVE_KEY=5K...your-active-key
```

### Step 3: Initialize Database

```bash
npm run db:push
```

### Step 4: Start Validator

```bash
npm run start
```

---

## Operating Modes

### Simulation Mode

When `SPK_POA_URL` is not set, the validator runs in simulation mode:
- Uses mock IPFS client
- Simulates storage node responses
- Good for testing and development

### Live Mode

When `SPK_POA_URL` is set:
- Connects to real SPK PoA nodes
- Fetches real data from IPFS
- Broadcasts to Hive blockchain

---

## How Validation Works

### The Challenge Cycle

```
Every 5 seconds:

1. SELECT random file from registry
2. SELECT random storage node claiming that file
3. GENERATE unique challenge salt
4. COMPUTE expected proof hash
5. SEND challenge to storage node
6. COMPARE response with expected
7. RECORD result (success/fail)
8. UPDATE reputation
9. TRIGGER payment (if successful)
```

### What the Validator Does

```
┌─────────────────────────────────────────────────────────────┐
│                     VALIDATOR WORKFLOW                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Get file list from registry                             │
│     └─▶ Database query (no file downloads)                  │
│                                                             │
│  2. Get storage assignments                                 │
│     └─▶ Database query (who claims what)                    │
│                                                             │
│  3. Pick random file + node                                 │
│     └─▶ Random selection (fair auditing)                    │
│                                                             │
│  4. Generate unique salt                                    │
│     └─▶ crypto.randomBytes(32) → SHA256                     │
│                                                             │
│  5. Fetch block CIDs (cached after first time)              │
│     └─▶ IPFS refs QmFile... → [QmBlock1, QmBlock2, ...]     │
│                                                             │
│  6. Compute expected proof                                  │
│     └─▶ FNV-1a block selection + SHA256 proof chain         │
│                                                             │
│  7. Challenge storage node                                  │
│     └─▶ WebSocket: "Prove you have this file with salt X"   │
│                                                             │
│  8. Compare proofs                                          │
│     └─▶ Expected == Received? → Success/Fail                │
│                                                             │
│  9. Record on Hive                                          │
│     └─▶ custom_json broadcast                               │
│                                                             │
│ 10. Update reputation + payment                             │
│     └─▶ Database update + HBD transfer                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Resource Usage

### Per Challenge

| Resource | Usage |
|----------|-------|
| IPFS refs call | 1 (cached after first) |
| IPFS cat calls | 3-5 blocks (~256KB each) |
| Database queries | ~8 operations |
| Hive broadcast | 1 custom_json |
| Network transfer | ~1MB total |

### Daily Operation (1 challenge/5 seconds)

| Metric | Value |
|--------|-------|
| Challenges per day | ~17,280 |
| IPFS data transferred | ~17 GB |
| Hive transactions | ~17,280 |
| HBD distributed | ~17 HBD (0.001 per success) |

---

## Monitoring

### Logs

The validator logs all activity:

```
[PoA Engine] Started for validator: your-witness
[PoA Engine] Mode: LIVE SPK INTEGRATION
[PoA Engine] IPFS status: ONLINE
[PoA] Challenge success: storage-node-1 (Rep: 85 -> 86)
[PoA] Challenge fail: storage-node-2 (Rep: 45 -> 40)
```

### API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/validators` | List all validators |
| `GET /api/challenges` | Recent challenge history |
| `GET /api/stats` | Overall statistics |

### WebSocket Events

Connect to `/ws` for real-time updates:

```javascript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // { type: "challenge_result", nodeId: "...", result: "success" }
};
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "IPFS status: OFFLINE" | Can't reach IPFS API | Check IPFS_API_URL |
| "Failed to broadcast" | Invalid Hive key | Verify HIVE_POSTING_KEY |
| "SPK client disconnected" | Network issue | Check SPK_POA_URL |
| All challenges failing | Nodes offline | Check storage node status |

### Health Checks

```bash
# Check IPFS connectivity
curl http://localhost:5001/api/v0/id

# Check Hive API
curl https://api.hive.blog

# Check validator status
curl http://localhost:5000/api/validators
```

---

## Best Practices

### Security

1. **Never share your posting/active keys**
2. **Use environment variables, not hardcoded keys**
3. **Run validator on secure, dedicated server**
4. **Keep software updated**

### Performance

1. **Use local IPFS node** for fastest block fetching
2. **Enable block CID caching** (on by default)
3. **Monitor bandwidth usage**
4. **Set appropriate challenge intervals**

### Reliability

1. **Use process manager** (PM2, systemd) for auto-restart
2. **Monitor logs for errors**
3. **Set up alerts for extended downtime**
4. **Maintain high uptime** (affects validator reputation)

---

## Economics

### Validator Costs

| Item | Estimated Cost |
|------|----------------|
| VPS hosting | $5-20/month |
| Bandwidth | Included or ~$10/month |
| IPFS pinning (optional) | $0 if self-hosted |

### Validator Revenue

Validators in SPK Network 2.0 earn through:
1. **Hive Witness rewards** (existing)
2. **Potential PoA fees** (future implementation)
3. **Network health incentives** (future implementation)

Currently, validation is a community service that enhances the value of the Hive ecosystem.

---

## Joining the Network

### Requirements to Become a Validator

1. **Hive Witness account** (existing or new)
2. **Technical capability** to run 24/7 infrastructure
3. **Commitment** to network health and uptime

### Registration Process

1. Set up validator node following this guide
2. Register validator in the network registry
3. Begin processing challenges
4. Build reputation through consistent uptime

---

## FAQ

**Q: Do I need to store files to be a validator?**
A: No. Validators only verify, they don't store. Stateless operation.

**Q: How much bandwidth do I need?**
A: ~17GB/day at default rate. Adjustable via challenge interval.

**Q: Can I run multiple validators?**
A: Yes, but each needs a unique Hive account.

**Q: What happens if my validator goes offline?**
A: Other validators continue. Your reputation may decrease.

**Q: Is there a minimum stake requirement?**
A: No stake required. Being a Hive Witness is the requirement.
