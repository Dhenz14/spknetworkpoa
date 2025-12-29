# Architecture Decision: Ingress Strategy (Gateway vs. Swarm)

## 1. The Dilemma
In the original SPK Network design, Validators often acted as "Gateways"—they were the first server to receive a file from a user. They would accept the upload, pin it, and then offer it to the rest of the network.

**The Question:** Should Validators be the bottleneck for file uploads, or can we decentralized this?

---

## 2. Option A: Validator as Gateway (The "Middleman" Model)
*   **Flow:** User -> Uploads to Validator (HTTP) -> Validator Pins -> Network Downloads from Validator.
*   **Pros:**
    *   **Simple for Users:** They just POST a file to an endpoint. No IPFS node needed in the browser.
    *   **Immediate Availability:** The Validator has a high-speed connection, ensuring the file is online immediately.
*   **Cons:**
    *   **Bottleneck:** Validators get crushed by bandwidth costs.
    *   **Centralization:** Users rely on specific gateways.
    *   **Cost:** Witnesses (Validators) have to pay for massive ingress bandwidth.

## 3. Option B: Direct Swarm Ingress (The "BitTorrent" Model) - **RECOMMENDED**
*   **Flow:**
    1.  User adds file to their **Local IPFS Node** (in-browser or desktop app).
    2.  User broadcasts `custom_json` to Hive: "I have file `Qm...`".
    3.  Storage Nodes (who opted in) see the transaction.
    4.  Storage Nodes **swarm** the user and download directly from them (P2P).
    5.  Validator just watches. It never touches the file until it needs to verify a proof.

*   **Pros:**
    *   **Zero Validator Load:** Validators only process 32-byte hashes, not 4GB video files.
    *   **True P2P:** Data moves directly from Creator to Host.
    *   **Scalability:** Infinite horizontal scaling. 10,000 users can upload simultaneously without crashing the Validators.

---

## 4. The "Opt-In" Mechanism
Storage nodes should definitely have an **Opt-In Policy** engine. They shouldn't just download *everything*.

### Proposed Policy Config for Storage Nodes:
*   `Auto-Download: TRUE/FALSE`
*   `Filter by Tag`: Only download `#gaming` or `#crypto`.
*   `Filter by Reputation`: Only download from users with Hive Reputation > 50.
*   `Max Size`: Don't auto-download files > 2GB.

## 5. Implementation in HivePoA
We will proceed with **Option B (Swarm Ingress)**.

### Changes to System:
1.  **Validator Role:** strictly "Auditor", not "Courier".
2.  **User Client:** Must act as the "Initial Seeder". The user must keep their tab/app open until at least 1 Storage Node has replicated the file.
3.  **UI Update:** We need to show a "Seeding" phase in the Upload UI.

---

## 6. Conclusion
By removing the Validator from the data path, we drastically lower the barrier to entry for Witnesses (they don't need expensive bandwidth) and make the network more resilient. Storage Nodes become the true backbone of content distribution.
