import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Storage Nodes - Users running IPFS nodes and earning HBD
export const storageNodes = pgTable("storage_nodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  peerId: text("peer_id").notNull().unique(),
  hiveUsername: text("hive_username").notNull(),
  reputation: integer("reputation").notNull().default(50), // 0-100
  status: text("status").notNull().default("active"), // active, probation, banned
  totalProofs: integer("total_proofs").notNull().default(0),
  failedProofs: integer("failed_proofs").notNull().default(0),
  lastSeen: timestamp("last_seen").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Files stored on the network
export const files = pgTable("files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cid: text("cid").notNull().unique(),
  name: text("name").notNull(),
  size: text("size").notNull(),
  uploaderUsername: text("uploader_username").notNull(),
  status: text("status").notNull().default("syncing"), // syncing, pinned, warning
  replicationCount: integer("replication_count").notNull().default(0),
  confidence: integer("confidence").notNull().default(0), // 0-100
  poaEnabled: boolean("poa_enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Storage assignments - which nodes are storing which files
export const storageAssignments = pgTable("storage_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileId: varchar("file_id").notNull().references(() => files.id),
  nodeId: varchar("node_id").notNull().references(() => storageNodes.id),
  proofCount: integer("proof_count").notNull().default(0),
  failCount: integer("fail_count").notNull().default(0),
  lastProofAt: timestamp("last_proof_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Validators (Witnesses running PoA)
export const validators = pgTable("validators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hiveUsername: text("hive_username").notNull().unique(),
  hiveRank: integer("hive_rank").notNull(),
  status: text("status").notNull().default("online"), // online, offline, syncing
  peerCount: integer("peer_count").notNull().default(0),
  performance: integer("performance").notNull().default(50), // 0-100
  jobAllocation: integer("job_allocation").notNull().default(0), // percentage
  payoutRate: real("payout_rate").notNull().default(1.0),
  version: text("version").notNull().default("v0.1.0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// PoA Challenge Log
export const poaChallenges = pgTable("poa_challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  validatorId: varchar("validator_id").notNull().references(() => validators.id),
  nodeId: varchar("node_id").notNull().references(() => storageNodes.id),
  fileId: varchar("file_id").notNull().references(() => files.id),
  challengeData: text("challenge_data").notNull(), // Salt + ByteRange
  response: text("response"),
  result: text("result"), // success, fail, timeout
  latencyMs: integer("latency_ms"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Hive Transaction Log (simulated blockchain events)
export const hiveTransactions = pgTable("hive_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // spk_video_upload, hivepoa_announce, spk_reputation_slash, hbd_transfer
  fromUser: text("from_user").notNull(),
  toUser: text("to_user"),
  payload: text("payload").notNull(), // JSON string
  blockNumber: integer("block_number").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertStorageNodeSchema = createInsertSchema(storageNodes).omit({
  id: true,
  createdAt: true,
  lastSeen: true,
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  createdAt: true,
});

export const insertValidatorSchema = createInsertSchema(validators).omit({
  id: true,
  createdAt: true,
});

export const insertPoaChallengeSchema = createInsertSchema(poaChallenges).omit({
  id: true,
  createdAt: true,
});

export const insertHiveTransactionSchema = createInsertSchema(hiveTransactions).omit({
  id: true,
  createdAt: true,
});

// Types
export type StorageNode = typeof storageNodes.$inferSelect;
export type InsertStorageNode = z.infer<typeof insertStorageNodeSchema>;

export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;

export type Validator = typeof validators.$inferSelect;
export type InsertValidator = z.infer<typeof insertValidatorSchema>;

export type PoaChallenge = typeof poaChallenges.$inferSelect;
export type InsertPoaChallenge = z.infer<typeof insertPoaChallengeSchema>;

export type HiveTransaction = typeof hiveTransactions.$inferSelect;
export type InsertHiveTransaction = z.infer<typeof insertHiveTransactionSchema>;

export type StorageAssignment = typeof storageAssignments.$inferSelect;
