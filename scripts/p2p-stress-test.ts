import WebSocket from 'ws';

const BASE_URL = 'ws://localhost:5000/p2p';
const HTTP_URL = 'http://localhost:5000';
const NUM_CLIENTS = 50;
const TEST_VIDEO_CID = 'QmStressTest123456789';
const TEST_DURATION_MS = 30000;

interface TestClient {
  id: number;
  ws: WebSocket;
  peerId: string;
  connected: boolean;
  roomJoined: boolean;
  messagesReceived: number;
  errors: string[];
  latencies: number[];
}

const clients: TestClient[] = [];
const stats = {
  connectionsAttempted: 0,
  connectionsSucceeded: 0,
  connectionsFailed: 0,
  roomJoinsAttempted: 0,
  roomJoinsSucceeded: 0,
  messagesReceived: 0,
  messagesSent: 0,
  errors: [] as string[],
  avgLatency: 0,
  maxLatency: 0,
  minLatency: Infinity,
};

function generatePeerId(): string {
  return `stress-peer-${Math.random().toString(36).substring(2, 15)}`;
}

function createClient(id: number): Promise<TestClient> {
  return new Promise((resolve, reject) => {
    const client: TestClient = {
      id,
      ws: new WebSocket(BASE_URL),
      peerId: generatePeerId(),
      connected: false,
      roomJoined: false,
      messagesReceived: 0,
      errors: [],
      latencies: [],
    };

    const connectStart = Date.now();
    stats.connectionsAttempted++;

    client.ws.on('open', () => {
      const latency = Date.now() - connectStart;
      client.latencies.push(latency);
      client.connected = true;
      stats.connectionsSucceeded++;
      console.log(`[Client ${id}] Connected in ${latency}ms`);
      resolve(client);
    });

    client.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        client.messagesReceived++;
        stats.messagesReceived++;

        if (message.type === 'peer-list' && message.payload?.yourPeerId) {
          client.roomJoined = true;
          stats.roomJoinsSucceeded++;
          const peerCount = message.payload?.peers?.length || 0;
          console.log(`[Client ${id}] Joined room, peers in room: ${peerCount}`);
        } else if (message.type === 'peer-list' && message.payload?.newPeer) {
          // Another peer joined
        } else if (message.type === 'error') {
          client.errors.push(message.payload?.message || 'Unknown error');
          stats.errors.push(`Client ${id}: ${message.payload?.message}`);
        }
      } catch (e) {
        client.errors.push(`Parse error: ${e}`);
      }
    });

    client.ws.on('error', (err) => {
      client.errors.push(err.message);
      stats.errors.push(`Client ${id}: ${err.message}`);
      if (!client.connected) {
        stats.connectionsFailed++;
        reject(err);
      }
    });

    client.ws.on('close', () => {
      client.connected = false;
      console.log(`[Client ${id}] Disconnected`);
    });

    setTimeout(() => {
      if (!client.connected) {
        stats.connectionsFailed++;
        reject(new Error('Connection timeout'));
      }
    }, 10000);
  });
}

function sendMessage(client: TestClient, message: any): void {
  if (client.connected && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message));
    stats.messagesSent++;
  }
}

function joinRoom(client: TestClient, videoCid: string): void {
  stats.roomJoinsAttempted++;
  sendMessage(client, {
    type: 'join',
    videoCid,
    peerId: client.peerId,
    hiveUsername: `stress_user_${client.id}`,
    isDesktopAgent: false,
  });
}

function updateStats(client: TestClient): void {
  sendMessage(client, {
    type: 'stats-update',
    payload: {
      bytesUploaded: Math.floor(Math.random() * 1000000),
      bytesDownloaded: Math.floor(Math.random() * 5000000),
      segmentsShared: Math.floor(Math.random() * 100),
      peersConnected: Math.floor(Math.random() * 10),
    },
  });
}

function leaveRoom(client: TestClient): void {
  sendMessage(client, { type: 'leave' });
}

async function testApiEndpoints(): Promise<void> {
  console.log('\n=== Testing API Endpoints Under Load ===\n');

  const endpoints = [
    '/api/p2p/stats',
    '/api/p2p/rooms',
    '/api/p2p/contributors',
    '/api/p2p/history?limit=100',
  ];

  for (const endpoint of endpoints) {
    const start = Date.now();
    try {
      const response = await fetch(`${HTTP_URL}${endpoint}`);
      const latency = Date.now() - start;
      const data = await response.json();
      console.log(`[API] ${endpoint} - ${response.status} in ${latency}ms`);
      
      if (endpoint === '/api/p2p/stats') {
        console.log(`  Active Peers: ${data.combined?.activePeers || data.realtime?.activePeers || 0}`);
        console.log(`  Active Rooms: ${data.combined?.activeRooms || data.realtime?.activeRooms || 0}`);
      } else if (endpoint === '/api/p2p/rooms') {
        console.log(`  Rooms count: ${Array.isArray(data) ? data.length : 0}`);
      }
    } catch (e: any) {
      console.log(`[API] ${endpoint} - ERROR: ${e.message}`);
    }
  }
}

async function runStressTest(): Promise<void> {
  console.log('=== P2P CDN Stress Test ===\n');
  console.log(`Clients: ${NUM_CLIENTS}`);
  console.log(`Video CID: ${TEST_VIDEO_CID}`);
  console.log(`Duration: ${TEST_DURATION_MS / 1000}s\n`);

  console.log('Phase 1: Connecting clients...\n');
  
  const connectionPromises: Promise<TestClient | null>[] = [];
  for (let i = 0; i < NUM_CLIENTS; i++) {
    connectionPromises.push(
      createClient(i).catch((e) => {
        console.log(`[Client ${i}] Failed to connect: ${e.message}`);
        return null;
      })
    );
    await new Promise((r) => setTimeout(r, 50));
  }

  const results = await Promise.all(connectionPromises);
  const connectedClients = results.filter((c): c is TestClient => c !== null);
  clients.push(...connectedClients);

  console.log(`\nPhase 1 Complete: ${clients.length}/${NUM_CLIENTS} clients connected\n`);

  console.log('Phase 2: Joining rooms...\n');
  
  for (const client of clients) {
    joinRoom(client, TEST_VIDEO_CID);
    await new Promise((r) => setTimeout(r, 20));
  }

  await new Promise((r) => setTimeout(r, 2000));
  console.log(`\nPhase 2 Complete: ${stats.roomJoinsSucceeded}/${stats.roomJoinsAttempted} room joins\n`);

  await testApiEndpoints();

  console.log('\nPhase 3: Simulating activity...\n');
  
  const activityInterval = setInterval(() => {
    for (const client of clients) {
      if (client.connected && client.roomJoined) {
        updateStats(client);
      }
    }
  }, 2000);

  await new Promise((r) => setTimeout(r, 10000));
  clearInterval(activityInterval);

  console.log('\nPhase 3 Complete: Activity simulation done\n');

  await testApiEndpoints();

  console.log('\nPhase 4: Cleanup...\n');
  
  for (const client of clients) {
    if (client.connected) {
      leaveRoom(client);
      client.ws.close();
    }
  }

  await new Promise((r) => setTimeout(r, 2000));

  console.log('\n=== Stress Test Results ===\n');
  console.log(`Connections: ${stats.connectionsSucceeded}/${stats.connectionsAttempted} succeeded`);
  console.log(`Connection failures: ${stats.connectionsFailed}`);
  console.log(`Room joins: ${stats.roomJoinsSucceeded}/${stats.roomJoinsAttempted} succeeded`);
  console.log(`Messages sent: ${stats.messagesSent}`);
  console.log(`Messages received: ${stats.messagesReceived}`);
  console.log(`Errors: ${stats.errors.length}`);
  
  if (stats.errors.length > 0) {
    console.log('\nErrors encountered:');
    const uniqueErrors = [...new Set(stats.errors)];
    uniqueErrors.slice(0, 10).forEach((e) => console.log(`  - ${e}`));
    if (uniqueErrors.length > 10) {
      console.log(`  ... and ${uniqueErrors.length - 10} more`);
    }
  }

  const allLatencies = clients.flatMap((c) => c.latencies);
  if (allLatencies.length > 0) {
    const avg = allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length;
    const max = Math.max(...allLatencies);
    const min = Math.min(...allLatencies);
    console.log(`\nConnection latency: avg=${avg.toFixed(0)}ms, min=${min}ms, max=${max}ms`);
  }

  console.log('\n=== Optimization Recommendations ===\n');
  
  if (stats.connectionsFailed > 0) {
    console.log('- CONNECTION ISSUES: Some clients failed to connect');
    console.log('  Recommendation: Add connection pooling or rate limiting');
  }
  
  if (stats.roomJoinsSucceeded < stats.roomJoinsAttempted) {
    console.log('- ROOM JOIN ISSUES: Some room joins failed');
    console.log('  Recommendation: Add retry logic for room joins');
  }
  
  if (stats.errors.length > NUM_CLIENTS * 0.1) {
    console.log('- HIGH ERROR RATE: More than 10% of operations had errors');
    console.log('  Recommendation: Review error handling and add circuit breakers');
  }

  const roomJoinClients = clients.filter((c) => c.roomJoined).length;
  if (roomJoinClients === clients.length && stats.errors.length === 0) {
    console.log('All tests passed! The P2P CDN is handling load well.');
  }

  process.exit(0);
}

runStressTest().catch((e) => {
  console.error('Stress test failed:', e);
  process.exit(1);
});
