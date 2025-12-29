# Master Architecture Specification: HivePoA

## 1. System Overview
**HivePoA** is a decentralized storage validation protocol that piggybacks on the existing Hive blockchain trust model. It allows Hive Witnesses to act as "Police" (Validators) who audit "Storage Nodes" (Users) and reward them with HBD for hosting content.

**Core Philosophy:** 
1.  **Trustless**: Verification via cryptographic Proof of Access (PoA).
2.  **Federated Trust**: Leveraging the top 150 Hive Witnesses as the consensus set.
3.  **Client-Side**: No central servers; all logic runs in the user's browser or local binary.

---

## 2. The Three Pillars (Architecture)

### A. The User (Content Creator)
*   **Role**: Initial Seeder.
*   **Action**: 
    1.  Loads web app (Oratr-like client).
    2.  Local Transcode -> Local IPFS Hash.
    3.  Broadcasts `custom_json` to Hive: `["spk_video_upload", {"cid": "Qm...", "size": "50MB"}]`.
    4.  Seeds file to swarm until replicated.
*   **Reference Doc**: `docs/Ingress_Architecture_Swarm_vs_Gateway.md`

### B. The Storage Node (Miner)
*   **Role**: Host & Replication.
*   **Action**:
    1.  Listens to Hive stream for `spk_video_upload` events.
    2.  Downloads/Pins content based on local policy (e.g., "Only #gaming videos").
    3.  Responds to challenges from Validators.
*   **Reference Doc**: `docs/Build_Order_and_Reuse_Strategy.md` (Phase 2)

### C. The Validator (Witness/Police)
*   **Role**: Auditor.
*   **Action**:
    1.  Verifies `Rank <= 150` on Hive.
    2.  Issues challenges: `Hash(RandomChunk + Salt + PeerID)`.
    3.  Verifies response.
    4.  **Valid**: Sends HBD Transfer.
    5.  **Invalid**: Broadcasts `spk_reputation_slash`.
*   **Reference Doc**: `docs/Witness_Implementation_Guide.md`, `docs/Validator_System_Deep_Dive.md`

---

## 3. The Economic Model (HBD & Reputation)
*   **Payment Rail**: HBD (Hive Backed Dollar).
*   **Funding**: Validators fund their own hot wallets (acting as gateways/patrons).
*   **Reputation Score (0-100)**:
    *   **Global Rank**: Calculated by aggregating `slash` and `reward` events from the blockchain.
    *   **Consequence**: < 50 Score = Ignored by Validators (No jobs).
*   **Reference Doc**: `docs/Validator_Ranking_and_Filters.md`

---

## 4. Implementation Strategy

### App vs. Web
*   **Strategy**: **Hybrid**.
*   **Mockup**: Static React SPA (Current State).
*   **Production**: Wrap React SPA in Tauri/Electron to bundle `go-ipfs` and `ffmpeg`.
*   **Reference Doc**: `docs/App_vs_Web_Strategy.md`

### Build Order
1.  **Phase 1**: User Client (Browser-based Transcode/Hash).
2.  **Phase 2**: Storage Swarm (Hive Listener).
3.  **Phase 3**: Police Protocol (PoA Binary).
4.  **Phase 4**: Tangle/Consensus (State View).
*   **Reference Doc**: `docs/Build_Order_and_Reuse_Strategy.md`

---

## 5. Status Checklist
- [x] **Architecture Design**: Complete (Witness Federation + Swarm Ingress).
- [x] **UI Mockups**: Complete (Storage, Validator, Node Status).
- [x] **UX Flow**: Complete (Seeding visualization, Reputation feedback).
- [x] **Documentation**: Complete (All specs written).
- [ ] **Code Implementation**: Pending (Next Phase).

**Verdict**: The system is **Ready for Build**. All theoretical problems (Consensus, Ingress, Rewards) have been solved and documented.
