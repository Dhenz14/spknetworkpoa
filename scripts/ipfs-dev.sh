#!/bin/bash
set -e

IPFS_REPO="${IPFS_PATH:-.replit/ipfs}"
IPFS_PORT="${IPFS_API_PORT:-5001}"
IPFS_GATEWAY_PORT="${IPFS_GATEWAY_PORT:-8081}"
IPFS_SWARM_PORT="${IPFS_SWARM_PORT:-4001}"

echo "================================================"
echo "  SPK Network 2.0 - IPFS Node Bootstrap"
echo "================================================"
echo ""

export IPFS_PATH="$IPFS_REPO"

if [ ! -d "$IPFS_REPO" ]; then
    echo "[IPFS] First-time setup - initializing repository..."
    mkdir -p "$IPFS_REPO"
    
    ipfs init --profile=server
    
    echo "[IPFS] Configuring CORS for web access..."
    ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
    ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST", "GET"]'
    ipfs config --json API.HTTPHeaders.Access-Control-Allow-Headers '["Authorization", "X-Requested-With", "Range", "Content-Range"]'
    ipfs config --json API.HTTPHeaders.Access-Control-Expose-Headers '["Location", "Ipfs-Hash", "X-Ipfs-Path", "X-Stream-Output"]'
    
    echo "[IPFS] Setting storage limits..."
    ipfs config Datastore.StorageMax "5GB"
    ipfs config --json Datastore.StorageGCWatermark 90
    
    echo "[IPFS] Configuring ports..."
    ipfs config Addresses.API "/ip4/0.0.0.0/tcp/$IPFS_PORT"
    ipfs config Addresses.Gateway "/ip4/0.0.0.0/tcp/$IPFS_GATEWAY_PORT"
    
    echo "[IPFS] Repository initialized at $IPFS_REPO"
else
    echo "[IPFS] Using existing repository at $IPFS_REPO"
fi

echo ""
echo "[IPFS] Starting daemon..."
echo "  - API:     http://0.0.0.0:$IPFS_PORT"
echo "  - Gateway: http://0.0.0.0:$IPFS_GATEWAY_PORT"
echo "  - Swarm:   port $IPFS_SWARM_PORT"
echo ""
echo "  Connect your app with: IPFS_API_URL=http://localhost:$IPFS_PORT"
echo ""
echo "================================================"

if [ "${IPFS_OFFLINE:-false}" = "true" ]; then
    echo "[IPFS] Running in OFFLINE mode (no network peers)"
    exec ipfs daemon --offline
else
    echo "[IPFS] Running in ONLINE mode (connecting to IPFS network)"
    exec ipfs daemon
fi
