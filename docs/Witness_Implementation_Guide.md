# Witness Implementation Guide: Running the "Police" Protocol

## 1. Difficulty Assessment: Low to Moderate
**Verdict:** Easier than running a Hive Witness node itself.

The "Validator" software is a lightweight **Go or Rust binary**. It does not require massive storage (like a Hive API node) or massive bandwidth (like a video host).

### Resource Requirements
*   **CPU:** 2 Cores (Crypto hashing for verification)
*   **RAM:** 4GB (Tracking peer states)
*   **Storage:** 50GB SSD (IPFS Cache for temporary verification)
*   **Bandwidth:** Low (Only transmits hashes and small 256KB chunks)

---

## 2. The "Police" Architecture
You are correct. The Validator is strictly the **Auditor**.

### The Workflow
1.  **Watcher**: The software listens to the Hive Blockchain for `custom_json` events (New Uploads).
2.  **Selector**: It picks a Storage Node from its peer list.
3.  **Investigator**:
    *   It effectively says: *"Hey Node A, prove you have the file `QmVideo123`."*
    *   *"Send me the hash of bytes 1024-2048 combined with salt `XYZ`."*
4.  **Judge**:
    *   Node A replies.
    *   Validator computes the hash locally.
    *   **Match?** -> Sign transaction: "Pay Node A 0.001 HBD".
    *   **Mismatch?** -> Sign transaction: "Slash Node A Reputation".

---

## 3. Client-Side & Decentralization
The software is designed to be **100% Client-Side / Standalone**.

*   **No Central Server**: The validator talks directly to Storage Nodes via `libp2p` (Encrypted P2P tunnels).
*   **No API Keys Needed**: It uses your local Hive keys (Active Key) to sign broadcast transactions.
*   **Trustless**: You don't trust the storage node. You verify the math.

### The "One-Click" Experience
For a Hive Witness, enabling this should be as simple as:

```bash
# Start the Police Service
./hive-poa-validator --witness-user=my_witness --active-key=5K...
```

The software handles the rest: discovering peers, issuing challenges, and paying rewards.
