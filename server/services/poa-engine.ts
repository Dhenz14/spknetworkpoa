import { storage } from "../storage";
import crypto from "crypto";

export class PoAEngine {
  private challengeInterval: NodeJS.Timeout | null = null;
  private validatorId: string | null = null;

  async start(validatorUsername: string) {
    // Find or create validator
    let validator = await storage.getValidatorByUsername(validatorUsername);
    if (!validator) {
      validator = await storage.createValidator({
        hiveUsername: validatorUsername,
        hiveRank: 42,
        status: "online",
        peerCount: 0,
        performance: 75,
        jobAllocation: 50,
        payoutRate: 1.0,
        version: "v0.1.0",
      });
    }

    this.validatorId = validator.id;
    console.log(`[PoA Engine] Started for validator: ${validatorUsername}`);

    // Run challenges every 5 seconds
    this.challengeInterval = setInterval(() => {
      this.runChallenge();
    }, 5000);
  }

  stop() {
    if (this.challengeInterval) {
      clearInterval(this.challengeInterval);
      this.challengeInterval = null;
    }
  }

  private async runChallenge() {
    if (!this.validatorId) return;

    // Get random storage node
    const nodes = await storage.getAllStorageNodes();
    if (nodes.length === 0) return;

    const randomNode = nodes[Math.floor(Math.random() * nodes.length)];

    // Get random file
    const files = await storage.getAllFiles();
    if (files.length === 0) return;

    const randomFile = files[Math.floor(Math.random() * files.length)];

    // Generate challenge
    const salt = crypto.randomBytes(16).toString("hex");
    const byteRange = `${Math.floor(Math.random() * 1000000)}-${Math.floor(Math.random() * 1000000 + 256)}`;
    const challengeData = JSON.stringify({ salt, byteRange });

    // Create challenge
    const challenge = await storage.createPoaChallenge({
      validatorId: this.validatorId,
      nodeId: randomNode.id,
      fileId: randomFile.id,
      challengeData,
      response: null,
      result: null,
      latencyMs: null,
    });

    // Simulate response (in real system this would be async via WebSocket)
    setTimeout(async () => {
      await this.processChallenge(challenge.id, randomNode.id, randomFile.id);
    }, Math.random() * 2000 + 500); // 500ms - 2.5s response time
  }

  private async processChallenge(challengeId: string, nodeId: string, fileId: string) {
    const node = await storage.getStorageNode(nodeId);
    if (!node) return;

    // Simulate validation (80% success rate for good nodes, 40% for probation)
    const successRate = node.reputation > 60 ? 0.8 : 0.4;
    const success = Math.random() < successRate;
    
    const latencyMs = Math.floor(Math.random() * 1000 + 100);
    const response = success ? crypto.randomBytes(32).toString("hex") : "TIMEOUT";
    const result = success ? "success" : "fail";

    // Update challenge
    await storage.updateChallengeResult(challengeId, response, result, latencyMs);

    // Update assignment
    await storage.updateAssignmentProof(fileId, nodeId, success);

    // Update node reputation
    const newReputation = success 
      ? Math.min(100, node.reputation + 1)
      : Math.max(0, node.reputation - 5);

    const newStatus = newReputation < 30 
      ? "probation" 
      : newReputation < 10 
      ? "banned" 
      : "active";

    await storage.updateStorageNodeReputation(node.id, newReputation, newStatus);

    // Update node stats
    const totalProofs = node.totalProofs + 1;
    const failedProofs = success ? node.failedProofs : node.failedProofs + 1;

    console.log(`[PoA] Challenge ${result}: ${node.hiveUsername} (Rep: ${node.reputation} -> ${newReputation})`);

    // Broadcast transaction if slash
    if (!success) {
      await storage.createHiveTransaction({
        type: "spk_reputation_slash",
        fromUser: "validator-police",
        toUser: node.hiveUsername,
        payload: JSON.stringify({
          reason: "Failed PoA challenge",
          oldRep: node.reputation,
          newRep: newReputation,
        }),
        blockNumber: Math.floor(Date.now() / 1000),
      });
    } else {
      // Reward transaction
      await storage.createHiveTransaction({
        type: "hbd_transfer",
        fromUser: "validator-police",
        toUser: node.hiveUsername,
        payload: JSON.stringify({
          amount: "0.001 HBD",
          memo: `PoA Reward`,
        }),
        blockNumber: Math.floor(Date.now() / 1000),
      });
    }
  }
}

export const poaEngine = new PoAEngine();
