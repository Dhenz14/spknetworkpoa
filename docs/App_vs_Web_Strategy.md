# Architecture Decision: Desktop App vs. Static Web App

## The Verdict: **Hybrid Approach**

To achieve a truly decentralized, censorship-resistant network, you need **both**, but they serve different roles.

### 1. The "Heavy" Roles -> Desktop App (Electron / Tauri)
**Who:** Content Creators (Uploaders), Storage Nodes, Police (Validators).
**Why:**
*   **IPFS Daemon**: Browsers cannot run a full DHT or pin massive files reliably. You need a real `go-ipfs` daemon running in the background.
*   **Transcoding**: Converting 4K raw video to 720p/480p requires CPU access (`ffmpeg`) that browsers (WASM) struggle with.
*   **Networking**: Validators need raw TCP/UDP sockets for `libp2p` to challenge nodes efficiently.

### 2. The "Light" Roles -> Static Web App (PWA)
**Who:** Viewers, Curators, Wallet Users.
**Why:**
*   **Accessibility**: Users shouldn't install an `.exe` just to watch a video.
*   **Unstoppable Hosting**: A static React app can be hosted on IPFS itself (accessed via `ipns://...` or a public gateway). It cannot be taken down.

---

## Strategy for this Prototype

Since we are building a mockup in a web environment, we will build a **Static Web App** that *simulates* the Desktop functionalities.

**The "Progressive" Path to Production:**
1.  **Build as React SPA**: (What we are doing now). Works in browser.
2.  **Wrap in Tauri/Electron**: For the "Pro" client.
    *   Bundles a `go-ipfs` binary.
    *   Bundles `ffmpeg`.
    *   React UI talks to these local binaries via localhost API.

### Recommendation
**Build it as Static Files (React)**.
*   It is the most versatile.
*   It can be served from GitHub Pages, IPFS, or Replit.
*   It allows you to "wrap" it into a Desktop App later without rewriting the UI.
