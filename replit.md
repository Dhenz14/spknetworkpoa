# SPK Network 2.0 - Decentralized Storage Validation System

## Overview

SPK Network 2.0 (HivePoA) is a streamlined decentralized storage validation protocol that integrates with the Hive blockchain for HBD (Hive Backed Dollar) payments. This is an evolution of the original SPK Network, removing unnecessary complexity (Honeycomb, multiple tokens) while preserving the core innovation: **Proof of Access (PoA)**.

The system implements a PoA mechanism where Hive Witnesses act as validators ("Police") who audit Storage Nodes to verify they are physically storing the files they claim to hold. Storage providers earn HBD rewards for successfully passing cryptographic challenges.

The application is a full-stack web application with a React frontend and Express backend, using PostgreSQL for data persistence.

## Documentation

Comprehensive documentation is available in the `docs/` directory:

| Document | Description |
|----------|-------------|
| [SPK Network 2.0 PoA Protocol](docs/SPK_NETWORK_2.0_POA.md) | Complete technical specification of the PoA algorithm |
| [Architecture](docs/ARCHITECTURE.md) | System architecture, components, and data flow |
| [Validator Guide](docs/VALIDATOR_GUIDE.md) | How to run a PoA validator node |
| [Storage Node Guide](docs/STORAGE_NODE_GUIDE.md) | How to provide storage and earn HBD |

## What Changed from SPK Network 1.0

| Removed | Reason |
|---------|--------|
| Honeycomb | Unnecessary middleware layer |
| LARYNX/BROCA/SPK tokens | Simplified to HBD only |
| Complex tokenomics | Reduced speculation, increased utility |
| libp2p PubSub | Replaced with WebSocket/REST |

| Kept | Why |
|------|-----|
| PoA Algorithm | Core innovation - FNV-1a + SHA256 |
| IPFS Integration | Standard for decentralized storage |
| Hive Blockchain | Proven, fast, free transactions |

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state caching and synchronization
- **Styling**: Tailwind CSS v4 with shadcn/ui component library (New York style)
- **UI Components**: Radix UI primitives for accessible, composable components
- **Animations**: Framer Motion for transitions and animations
- **Charts**: Recharts for data visualization
- **Build Tool**: Vite

The frontend follows a page-based architecture with shared layout components. Key pages include Dashboard, Storage, Wallet, Node Status, Validators, and Settings.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket server (ws library) for live updates
- **API Pattern**: RESTful endpoints under `/api/*`

The backend includes these services:
1. **Hive Simulator**: Emits fake blockchain events (uploads, transfers, slashes) every 3 seconds
2. **PoA Engine**: Runs validation challenges against storage nodes every 5 seconds (supports both simulation and real SPK Network integration)

### SPK Network PoA Integration

The PoA Engine can operate in two modes:

**Simulation Mode** (default):
- Uses mock IPFS client with in-memory storage
- Simulates challenge success/failure based on node reputation
- Logs transactions to local database

**Live SPK Integration** (when configured):
- Connects to real SPK PoA nodes via WebSocket (`/validate` endpoint)
- Implements SPK's cryptographic PoA algorithm:
  - Hash-based block selection using FNV-1a
  - Byte-level proof concatenation matching Go implementation
  - SHA256 proof hash verification
- Integrates with real IPFS nodes for byte-range fetching
- Broadcasts results to Hive blockchain via `@hiveio/dhive`

**Environment Variables for Live Mode:**
- `SPK_POA_URL`: URL of SPK PoA node (e.g., `http://localhost:3000`)
- `IPFS_API_URL`: IPFS HTTP API URL (e.g., `http://127.0.0.1:5001`)
- `HIVE_USERNAME`: Hive account username for broadcasts
- `HIVE_POSTING_KEY`: Hive posting key for custom_json operations
- `HIVE_ACTIVE_KEY`: Hive active key for HBD transfers (optional)

**Key Files:**
- `server/services/poa-engine.ts`: Main PoA orchestration
- `server/services/poa-crypto.ts`: Cryptographic proof generation (matches SPK's validation.go)
- `server/services/ipfs-client.ts`: IPFS HTTP client for byte-range access
- `server/services/spk-poa-client.ts`: WebSocket client for SPK PoA nodes
- `server/services/hive-client.ts`: Hive blockchain integration via @hiveio/dhive

### Data Models
The schema (`shared/schema.ts`) defines:
- **Storage Nodes**: IPFS nodes earning HBD with reputation scores (0-100)
- **Files**: Content stored on the network with CIDs and replication status
- **Validators**: Hive Witnesses running PoA software with performance metrics
- **PoA Challenges**: Challenge-response records between validators and nodes
- **Hive Transactions**: Simulated blockchain transaction log
- **Storage Assignments**: Many-to-many relationship tracking which nodes store which files

### Key Design Decisions

**Federated Trust Model**: Rather than building custom consensus, the system piggybacks on Hive's existing DPoS by using Top 150 Hive Witnesses as trusted validators. This eliminates the need for a separate governance layer.

**HBD as Payment Rail**: Uses Hive Backed Dollars for all payments instead of custom tokens, simplifying the economic model and leveraging existing Hive infrastructure.

**Reputation-Based Filtering**: Validators can set policies to only audit nodes meeting certain reputation thresholds, creating natural quality tiers in the network.

**Client-Side First Architecture**: Designed to eventually support browser-based IPFS operations where users act as initial seeders, with the web UI wrappable into Electron/Tauri for desktop functionality.

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, configured via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries with schema defined in `shared/schema.ts`
- **Drizzle Kit**: Migration tooling (`db:push` command)

### Hive Blockchain Integration
- **@hiveio/dhive**: Hive blockchain JavaScript library (referenced in docs, used for signing transactions and reading chain state)
- **Hive Keychain**: Browser extension integration for wallet operations (UI references)

### Frontend Libraries
- **@tanstack/react-query**: Data fetching and caching
- **Radix UI**: Full suite of accessible primitives (dialog, dropdown, tabs, toast, etc.)
- **Framer Motion**: Animation library
- **Recharts**: Charting library
- **Lucide React**: Icon library

### Build & Development
- **Vite**: Frontend build tool with HMR
- **esbuild**: Server bundling for production
- **tsx**: TypeScript execution for development

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal**: Error overlay in development
- **@replit/vite-plugin-cartographer**: Development tooling
- **@replit/vite-plugin-dev-banner**: Development banner

### Session Management
- **connect-pg-simple**: PostgreSQL session store (available but may not be actively used)
- **express-session**: Session middleware