# HivePoA: Proof of Access (PoA) Architecture & Conversion Gameplan

## 1. Executive Summary
This document outlines the architecture of the **Proof of Access (PoA)** system adapted from the SPK Network for **HivePoA**. The goal is to create a simplified, single-validator storage network that uses **HBD (Hive Backed Dollars)** for all incentives, replacing the complex multi-token model (SPK, LARYNX, BROCA) and Honeycomb consensus of the original SPK Network.

## 2. The Core Mechanism: Proof of Access (PoA)

### What is it?
Proof of Access is a challenge-response protocol used to verify that a storage node is physically storing the data it claims to hold. Unlike "Proof of Storage" which often requires complex zero-knowledge proofs, PoA is lightweight and interactive.

### How it works (Original SPK Model):
1.  **Claim**: A node claims to store file `CID-123`.
2.  **Challenge**: The network (or validator) selects a random block *inside* that file and asks the node to provide it.
3.  **Response**: The node must fetch the specific byte range and return it (hashed) within a strict time limit.
4.  **Verification**: The validator compares the response against the expected hash.
5.  **Reward**: If valid, the node earns LARYNX tokens.

### How it works (HivePoA Model):
1.  **Claim**: Storage node announces `CID-123` via Hive Custom JSON.
2.  **Challenge**: The Single Validator Node (Trole) issues a challenge via Hive/Socket.
3.  **Response**: The storage node provides the data proof.
4.  **Verification**: Trole verifies the data against IPFS.
5.  **Reward**: **Trole triggers a direct HBD transfer to the storage node.**

---

## 3. Architecture Conversion Gameplan

### Component 1: The Validator (Trole Adaptation)
*   **Original**: Multi-node consensus, highly complex.
*   **HivePoA**: Single "Super Node".
    *   **Action**: Run `trole` with `BUILDVAL=false`.
    *   **Role**:
        *   Indexing CIDs from Hive.
        *   Issuing challenges to connected peers.
        *   Signing and broadcasting HBD transfer transactions.

### Component 2: The Storage Node (ProofOfAccess Adaptation)
*   **Original**: Go binary that manages IPFS and talks to SPK nodes.
*   **HivePoA**: Simplified Go binary.
    *   **Action**: Modify `Rewards.go`.
    *   **Change**: Instead of minting tokens, it listens for HBD payment confirmation on the Hive blockchain as "Proof of Reward".

### Component 3: The Payment Layer (HBD Integration)
*   **Original**: SIP (Service Infrastructure Pool) & Honeycomb sidechain.
*   **HivePoA**: Layer 1 Hive Transactions.
    *   **Mechanism**:
        *   **Validation Fee**: Users pay HBD to the Validator to "insure" their data.
        *   **Storage Reward**: Validator pays HBD to Storage Nodes upon successful PoA.
    *   **Implementation**: Use `hive-js` or `@hiveio/dhive` to listen for `transfer` operations with specific memos (e.g., `POA_REWARD: <CID>`).

---

## 4. Frontend Implementation Strategy (Mockup Phase)

Since we are building the Frontend interface for this system, we need to visualize these invisible backend processes.

### A. Dashboard Updates
*   **Visualizing the Heartbeat**: Show a countdown to the "Next PoA Challenge".
*   **Live Feed**: Show real-time "Challenge Issued" -> "Response Received" -> "HBD Sent" logs.

### B. Storage Manager Updates
*   **Proof History**: For each pinned file, show a "Last Proven" timestamp.
*   **Health Score**: Calculate a health score based on successful proofs vs. missed challenges.

### C. Wallet Integration
*   **Transaction Filtering**: Distinguish between "Standard Transfers" and "PoA Mining Rewards".
*   **Projected Earnings**: Estimate daily HBD earnings based on current storage volume and proof success rate.

---

## 5. Technical Specifications for Backend (Reference)
*   **Language**: Go
*   **Key Libraries**: `github.com/ipfs/go-ipfs-api`, `github.com/hiveio/hivego`
*   **Communication**: Websockets for real-time challenges, Hive Blockchain for immutable logging.

## 6. Next Steps
1.  **Refine UI**: Update the "Node Status" page to visually demonstrate the Challenge-Response cycle.
2.  **Simulate Logic**: Create a frontend simulation of the PoA cycle to demonstrate functionality to the user without needing the actual Go backend running.
