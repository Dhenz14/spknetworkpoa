# Validator Ranking & Filtering Logic

## 1. The "Free Market" Ranking System
Unlike centralized systems where a master node assigns ranks, HivePoA uses a **Client-Side Reputation Model**.

### How it works:
1.  **Storage Nodes Vote with their Feet**: Storage nodes choose which Validator to connect to.
2.  **The Feedback Loop**:
    *   If a Validator verifies quickly and pays on time -> Storage Nodes stay connected.
    *   If a Validator is slow, offline, or misses payments -> Storage Nodes disconnect and switch to a competitor.
3.  **The "Rank"**: The Global Rank shown in the UI is a calculated aggregate of:
    *   **Peer Count** (How many nodes trust this validator).
    *   **Payout Reliability** (Percentage of successful payments vs. successful proofs).
    *   **Uptime** (Hive Witness missed blocks).

### Consequence of Low Rank:
*   **Less Peers**: Fewer storage nodes connect.
*   **Less Fees**: Validators earn a small fee (in HBD) from the network or users for providing the validation service. Low rank = Low income.

---

## 2. Validator Filtering (Admission Control)
Validators are not forced to audit everyone. They can set **Policies** to manage their workload and risk.

### Policy Options:
1.  **Minimum Reputation Score**: "I will only audit nodes with a Reputation > 50."
    *   *Why?* prevents wasting compute on flaky nodes.
2.  **Minimum Stake**: "I will only audit nodes holding > 10 HIVE Power."
    *   *Why?* Anti-sybil mechanism.
3.  **Content Whitelists**: "I will only audit content tagged `#family-friendly`."
4.  **Max Peers**: "I can only handle 500 connections."

### User Experience
*   If a Storage Node has a low reputation (e.g., 20), they will be rejected by top-tier Validators.
*   They must connect to "Lower Tier" validators (who might charge higher fees or pay less) to rebuild their reputation before moving up.
