# P2P CDN Blueprint - Viewer-Contributed Resources

## Overview

This document outlines the implementation strategy for enabling viewers to contribute bandwidth resources when watching videos on the SPK Network. By forming peer-to-peer mesh networks, viewers share video segments with each other, reducing load on storage nodes by 50-70%.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Video Playback Flow                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────┐     ┌──────────────┐     ┌──────────────────┐   │
│   │  Viewer  │────▶│  P2P Engine  │────▶│  Video Player    │   │
│   │ Browser  │     │  (P2P Media  │     │  (HLS.js)        │   │
│   └──────────┘     │   Loader)    │     └──────────────────┘   │
│        │           └──────────────┘              ▲              │
│        │                  │                      │              │
│        ▼                  ▼                      │              │
│   ┌──────────┐     ┌──────────────┐     ┌──────────────────┐   │
│   │  Helia   │◀───▶│  WebRTC Mesh │────▶│  Video Segments  │   │
│   │  (IPFS)  │     │  (Peers)     │     │  (Chunks)        │   │
│   └──────────┘     └──────────────┘     └──────────────────┘   │
│        │                  ▲                                     │
│        │                  │                                     │
│        ▼                  │                                     │
│   ┌──────────────────────────────────────────────────────────┐ │
│   │              Signaling Server (WebSocket)                 │ │
│   │         - Peer discovery & coordination                   │ │
│   │         - Room management per video                       │ │
│   │         - Bandwidth contribution tracking                 │ │
│   └──────────────────────────────────────────────────────────┘ │
│                            │                                    │
│                            ▼                                    │
│   ┌──────────────────────────────────────────────────────────┐ │
│   │                   CDN/Storage Nodes                       │ │
│   │         - Fallback source for all segments               │ │
│   │         - First segment always from CDN                  │ │
│   │         - Geographic routing optimization                 │ │
│   └──────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Core Libraries

| Library | Purpose | Version |
|---------|---------|---------|
| p2p-media-loader-hlsjs | P2P engine for HLS streaming | ^2.0.0 |
| hls.js | HLS video player | ^1.5.0 |
| simple-peer | Low-level WebRTC wrapper | ^9.11.1 |
| ws | WebSocket signaling server | existing |

### Integration Points

1. **Existing CDN Manager** (`server/services/cdn-manager.ts`)
   - Provides fallback URLs for segments
   - Geographic routing for optimal CDN selection
   - Health monitoring for hybrid CDN/P2P quality

2. **Existing Helia Client** (`client/src/lib/helia-client.ts`)
   - IPFS node for segment caching
   - Can prefetch and seed segments to P2P mesh
   - IndexedDB persistence for offline segments

3. **Existing WebSocket Server** (`server/routes.ts`)
   - Extend for P2P signaling
   - Room-based peer coordination
   - Contribution metrics collection

## Implementation Phases

### Phase 1: Basic P2P Mesh for HLS (2-3 weeks)

**Goal**: Viewers watching the same video share segments via WebRTC

**Components**:
- P2P Media Loader integration with video player
- WebSocket-based signaling for peer discovery
- Hybrid loader: P2P first, CDN fallback

**Metrics**:
- P2P ratio (% of bytes from peers)
- Peer count per video
- Segment download latency

### Phase 2: Custom Signaling Server (1 week)

**Goal**: Secure, scalable peer coordination tied to validator infrastructure

**Components**:
- Video room management (CID-based rooms)
- Peer presence tracking
- Bandwidth contribution logging
- Geographic peer matching

**Security**:
- Rate limiting per peer
- Room access validation
- Malicious peer detection

### Phase 3: IPFS-to-P2P Bridging (2 weeks)

**Goal**: Connect Helia IPFS node with WebRTC mesh for enhanced seeding

**Components**:
- Segment prefetching via Helia
- IPFS-to-WebRTC bridge for segment sharing
- Desktop agent as super-seeder
- Contribution attestations for HBD rewards

**Incentives**:
- Lightweight proof-of-upload logs
- Batch reward calculation via existing payout system
- Viewer contribution dashboard

## Data Models

### P2P Session

```typescript
interface P2PSession {
  id: string;
  peerId: string;
  videoCid: string;
  roomId: string;
  joinedAt: Date;
  bytesUploaded: number;
  bytesDownloaded: number;
  peersConnected: number;
  status: 'active' | 'disconnected';
}
```

### Contribution Record

```typescript
interface P2PContribution {
  id: string;
  peerId: string;
  hiveUsername?: string;
  videoCid: string;
  bytesShared: number;
  segmentsShared: number;
  sessionDuration: number;
  timestamp: Date;
}
```

## API Endpoints

### Signaling

- `WS /api/p2p/signal` - WebRTC signaling channel
- `GET /api/p2p/rooms/:videoCid` - Get room info and peer count
- `GET /api/p2p/stats` - Network-wide P2P statistics

### Contribution Tracking

- `POST /api/p2p/contribution` - Report bandwidth contribution
- `GET /api/p2p/contributions/:peerId` - Get contribution history
- `GET /api/p2p/leaderboard` - Top contributors

## Configuration

```typescript
interface P2PConfig {
  enabled: boolean;
  maxPeers: number;           // Max simultaneous peer connections
  segmentTimeout: number;     // P2P segment fetch timeout (ms)
  cdnFallbackDelay: number;   // Delay before CDN fallback (ms)
  uploadLimit: number;        // Max upload bandwidth (bytes/sec)
  trackerUrls: string[];      // WebSocket tracker URLs
  stunServers: string[];      // STUN servers for NAT traversal
  turnServers?: {             // TURN servers for restricted networks
    urls: string;
    username: string;
    credential: string;
  }[];
}
```

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge | Mobile |
|---------|--------|---------|--------|------|--------|
| WebRTC Data Channels | ✅ | ✅ | ✅ | ✅ | ✅ |
| Media Source Extensions | ✅ | ✅ | ✅ | ✅ | ❌ iOS |
| IndexedDB (caching) | ✅ | ✅ | ✅ | ✅ | ✅ |

**Note**: iOS Safari lacks MSE support, so P2P CDN operates in CDN-only mode on iPhone/iPad.

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| P2P Ratio | 50-70% | Percentage of bytes from peers |
| Peer Discovery | <2s | Time to find first peer |
| Segment Latency | <500ms | P2P segment fetch time |
| CDN Fallback | <1s | Time to fallback if P2P fails |
| Bandwidth Savings | 50-70% | Reduction in CDN costs |

## Security Considerations

1. **Segment Integrity**: Verify segment hashes against HLS manifest
2. **Peer Validation**: Rate limit and ban malicious peers
3. **Privacy**: No PII shared between peers, only segment data
4. **Encryption**: WebRTC uses DTLS encryption by default

## Success Criteria

1. ✅ Viewers can watch videos with P2P enabled
2. ✅ P2P ratio exceeds 50% for popular videos
3. ✅ Seamless CDN fallback when no peers available
4. ✅ Contribution metrics tracked and displayed
5. ✅ Integration with existing payout system for rewards
