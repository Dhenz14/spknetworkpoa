# Validator Ranking & Filtering Logic

## 1. Validator Ranking System (The "Watcher of Watchers")

Since Storage Nodes choose which Validator to peer with, we need a public reputation system for Validators.

### Ranking Metrics (0-100 Score)
The score is calculated based on on-chain data and peer feedback:
1.  **Payout Reliability (40%)**: Does this Validator actually send HBD when a proof is valid?
    *   *Measured by:* Ratio of `Valid_Proofs` to `HBD_Transfers`.
2.  **Uptime / Availability (30%)**: Is the Validator online to issue challenges?
    *   *Measured by:* Successful WebSocket handshakes.
3.  **Hive Witness Rank (20%)**: Higher rank = more community trust.
4.  **Fee Competitiveness (10%)**: Do they take a reasonable cut? (Lower fee = higher score, to a point).

### Consequences
*   **Top 50**: "Verified" Badge. Recommended default for new nodes.
*   **Bottom 25**: "Warning" Badge. Nodes are advised to disconnect.
*   **Malicious (0 Score)**: Blacklisted by the client software.

---

## 2. Validator Filtering Policies (The "Gatekeeper")

Validators (Witnesses) spend their own money (HBD) to reward nodes. They should have the right to choose *who* they audit.

### Configurable Filters (Policy Engine)
Validators can set these rules in their `config.yaml` or UI:

1.  **Minimum Reputation Score**: "I will only audit nodes with Reputation > 50."
    *   *Effect:* Filters out unreliable or new nodes.
2.  **Stake/Collateral**: "Node must have > 10 HBD in Savings." (Sybil resistance).
3.  **Content Whitelist/Blacklist**:
    *   "Only audit content with tag #hive."
    *   "Ignore content flagged as spam."
4.  **Network Topology**: "Max 5 nodes per IP subnet." (Anti-centralization).

### The "Job Negotiation" Protocol
1.  Storage Node announces availability to Validator.
2.  Validator checks Policy:
    *   `If (Node.Reputation < Config.MinRep)` -> **REJECT** ("Reputation too low").
3.  If Accepted, Validator adds Node to the "Challenge Pool".
