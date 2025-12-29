# Storage Node Guide - SPK Network 2.0

## What is a Storage Node?

A storage node is a participant who provides disk space to store files for the SPK Network. In return for successfully proving they have the files (via Proof of Access challenges), storage nodes earn **HBD** (Hive Backed Dollars).

---

## How Storage Nodes Earn

```
┌─────────────────────────────────────────────────────────────────┐
│                    STORAGE NODE ECONOMICS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. USER uploads file                                           │
│     └─▶ File is pinned to your IPFS node                        │
│                                                                 │
│  2. VALIDATOR challenges you                                    │
│     └─▶ "Prove you have file QmX7... with salt abc123..."       │
│                                                                 │
│  3. YOU respond with proof                                      │
│     └─▶ Compute proof hash from your local IPFS                 │
│                                                                 │
│  4. VALIDATOR verifies                                          │
│     └─▶ Your proof matches expected? → SUCCESS                  │
│                                                                 │
│  5. YOU receive HBD                                             │
│     └─▶ 0.001 HBD per successful proof (configurable)           │
│                                                                 │
│  MONTHLY POTENTIAL:                                             │
│  ~17,000 challenges × 0.001 HBD × 80% success = ~13.6 HBD/month │
│  (per file, scales with storage capacity)                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Requirements

### Hardware

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 2GB | 8GB |
| Storage | 100GB | 1TB+ |
| Bandwidth | 50 Mbps | 1 Gbps |

### Software

- **IPFS node** (go-ipfs recommended, v0.12+)
- **SPK PoA software** (from SPK Network repo)
- **Hive account** (for receiving payments)

### Network

- Static IP or dynamic DNS
- Port 4001 open (IPFS swarm)
- Port 5001 accessible (IPFS API, can be localhost-only)
- Port 3000 for PoA API (if running validator-accessible node)

---

## Setting Up a Storage Node

### Step 1: Install IPFS

```bash
# Download IPFS
wget https://dist.ipfs.tech/kubo/v0.22.0/kubo_v0.22.0_linux-amd64.tar.gz
tar -xvzf kubo_v0.22.0_linux-amd64.tar.gz
cd kubo
sudo bash install.sh

# Initialize IPFS
ipfs init

# Configure for server use
ipfs config Addresses.API /ip4/127.0.0.1/tcp/5001
ipfs config Addresses.Gateway /ip4/0.0.0.0/tcp/8080

# Start IPFS daemon
ipfs daemon &
```

### Step 2: Install SPK PoA Software

```bash
# Clone repository
git clone https://github.com/spknetwork/proofofaccess.git
cd proofofaccess

# Build (requires Go 1.19+)
go build -o spk-poa main.go

# Or use Docker
docker-compose build
```

### Step 3: Configure

Create configuration:

```bash
# Environment variables
export HIVE_USERNAME=your-hive-account
export IPFS_API=http://127.0.0.1:5001
```

### Step 4: Start Storage Node

```bash
./spk-poa -node 1 -username your-hive-account
```

---

## Pinning Files

### Manual Pinning

```bash
# Pin a single file
ipfs pin add QmYourFileCID

# Pin a directory
ipfs pin add -r QmYourDirectoryCID

# List pinned files
ipfs pin ls --type=recursive
```

### Accepting Storage Requests

Storage nodes can accept files from users in several ways:

1. **Direct IPFS pinning** - User provides CID, you pin it
2. **Upload API** - Your node accepts file uploads
3. **Storage contracts** - Automated pinning via Hive custom_json

---

## Responding to Challenges

When a validator challenges your node, the PoA software automatically:

1. **Receives challenge** via WebSocket
   ```json
   {
     "type": "RequestProof",
     "Hash": "abc123...",
     "CID": "QmFileToProve...",
     "User": "validator-name"
   }
   ```

2. **Fetches required blocks** from local IPFS
   ```bash
   # Internally runs:
   ipfs refs QmFileToProve...
   ipfs cat QmBlock1, QmBlock2, ...
   ```

3. **Computes proof hash** using the PoA algorithm
   - FNV-1a for block selection
   - SHA256 for hashing
   - Combines salt + block data

4. **Sends response** back to validator
   ```json
   {
     "type": "ProofResponse",
     "proofHash": "f8a9b2c3...",
     "latencyMs": 234
   }
   ```

---

## Reputation System

### How Reputation Works

| Event | Reputation Change |
|-------|------------------|
| Pass challenge | +1 |
| Fail challenge | -5 |
| Maximum | 100 |
| Minimum | 0 |

### Status Tiers

| Reputation | Status | Effect |
|------------|--------|--------|
| 70-100 | **Active** | Full rewards, trusted node |
| 30-69 | **Probation** | Reduced priority, monitored |
| 10-29 | **Warning** | High audit frequency |
| 0-9 | **Banned** | No rewards, no new files |

### Maintaining Good Reputation

1. **Keep files pinned** - Don't unpin files you're assigned
2. **Maintain uptime** - 99%+ uptime recommended
3. **Fast response** - Low latency helps
4. **Reliable storage** - No disk errors

---

## Troubleshooting

### Common Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Failing all challenges | IPFS not running | `ipfs daemon` must be active |
| "File not found" errors | File not pinned | `ipfs pin add <CID>` |
| High latency | Slow disk/network | Upgrade hardware |
| Reputation dropping | Files missing | Check `ipfs pin ls` |

### Debugging

```bash
# Check IPFS status
ipfs id

# Verify file is pinned
ipfs pin ls | grep QmYourCID

# Test file retrieval
ipfs cat QmYourCID > /dev/null && echo "OK"

# Check block availability
ipfs refs QmYourCID
```

### Log Analysis

Look for these patterns in logs:

```
# Good
[PoA] Challenge success: your-node (Rep: 85 -> 86)

# Bad - file missing
[PoA] Challenge fail: your-node - File not found

# Bad - timeout
[PoA] Challenge fail: your-node - TIMEOUT
```

---

## Best Practices

### Storage Management

1. **Monitor disk usage** - Don't run out of space
2. **Regular garbage collection** - `ipfs repo gc` (careful with pinned files)
3. **Backup important metadata** - Keep list of pinned CIDs
4. **RAID or redundant storage** - Protect against disk failure

### Network Optimization

1. **Use local IPFS node** - Don't rely on public gateways
2. **Enable IPFS clustering** (for large operations)
3. **Monitor bandwidth** - Ensure adequate capacity
4. **Geographic distribution** - Closer to users = faster

### Security

1. **Secure IPFS API** - Don't expose port 5001 publicly
2. **Firewall configuration** - Only open necessary ports
3. **Regular updates** - Keep IPFS and PoA software updated
4. **Protect Hive keys** - Never expose private keys

---

## Economics Calculator

### Revenue Estimation

```
Variables:
- Files stored: N
- Challenges per file per day: ~17,000 / total_network_files
- Success rate: S (aim for 95%+)
- Reward per proof: R (currently 0.001 HBD)

Daily Revenue = N × (challenges_per_file) × S × R

Example:
- 100 files stored
- 10 challenges per file per day
- 95% success rate
- 0.001 HBD per proof

Daily = 100 × 10 × 0.95 × 0.001 = 0.95 HBD
Monthly = 0.95 × 30 = 28.5 HBD
```

### Cost Analysis

| Expense | Monthly Cost |
|---------|--------------|
| VPS (1TB storage) | $20-50 |
| Bandwidth (1TB) | $0-20 |
| Electricity (if self-hosted) | $5-20 |
| **Total** | **$25-90** |

### Break-Even

To break even at $50/month with HBD at $1:
- Need ~50 HBD/month
- Need ~1,650 successful proofs/day
- Need ~165 files with 10 challenges/day each

---

## Scaling Up

### Adding More Storage

```bash
# Add new disk to IPFS
ipfs config Datastore.StorageMax 2TB

# Restart IPFS
ipfs shutdown && ipfs daemon &
```

### Running Multiple Nodes

For large operators:
- Use IPFS Cluster for coordination
- Load balance across nodes
- Geographic distribution for redundancy

### Enterprise Setup

```
┌─────────────────────────────────────────────────────────────┐
│                   ENTERPRISE STORAGE                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Node 1  │  │ Node 2  │  │ Node 3  │  │ Node N  │        │
│  │ (1TB)   │  │ (1TB)   │  │ (1TB)   │  │ (1TB)   │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │            │              │
│       └────────────┼────────────┼────────────┘              │
│                    │                                        │
│              ┌─────▼─────┐                                  │
│              │   IPFS    │                                  │
│              │  Cluster  │                                  │
│              └─────┬─────┘                                  │
│                    │                                        │
│              ┌─────▼─────┐                                  │
│              │    PoA    │                                  │
│              │  Gateway  │                                  │
│              └───────────┘                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## FAQ

**Q: How much can I earn?**
A: Depends on files stored and success rate. See Economics Calculator above.

**Q: What happens if I go offline?**
A: You'll fail challenges and lose reputation. Prolonged downtime = banned status.

**Q: Can I choose what files to store?**
A: Yes. You control what you pin. Only pinned files are challenged.

**Q: What if a file is deleted from IPFS?**
A: Unpin it to stop receiving challenges. Update storage assignments.

**Q: How do I get files to store?**
A: Join storage marketplaces, accept direct requests, or partner with content creators.

**Q: Is there a minimum storage requirement?**
A: No minimum. Start small and scale up.
