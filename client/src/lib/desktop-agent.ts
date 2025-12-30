/**
 * Desktop Agent Detection & Communication
 * 
 * Foundation for future Tauri desktop agent integration.
 * The desktop agent runs 24/7 and can earn HBD rewards.
 * 
 * Communication Protocol:
 * - Desktop agent exposes local HTTP API on port 5111
 * - Web app detects agent via /api/status endpoint
 * - Agent provides persistent IPFS node and wallet integration
 */

export interface DesktopAgentStatus {
  running: boolean;
  version: string | null;
  peerId: string | null;
  hiveUsername: string | null;
  ipfsRepoSize: number;
  numPinnedFiles: number;
  totalEarned: string;
  uptime: number;
}

export interface DesktopAgentConfig {
  hiveUsername: string;
  hivePostingKey: string;
  autoPin: boolean;
  maxStorageGb: number;
}

const AGENT_PORT = 5111;
const AGENT_URL = `http://127.0.0.1:${AGENT_PORT}`;

export async function detectDesktopAgent(): Promise<DesktopAgentStatus | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(`${AGENT_URL}/api/status`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    const status = await response.json();
    return {
      running: true,
      version: status.version || null,
      peerId: status.peerId || null,
      hiveUsername: status.hiveUsername || null,
      ipfsRepoSize: status.ipfsRepoSize || 0,
      numPinnedFiles: status.numPinnedFiles || 0,
      totalEarned: status.totalEarned || "0.000 HBD",
      uptime: status.uptime || 0,
    };
  } catch {
    return null;
  }
}

export async function getDesktopAgentConfig(): Promise<DesktopAgentConfig | null> {
  try {
    const response = await fetch(`${AGENT_URL}/api/config`, {
      method: "GET",
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export async function updateDesktopAgentConfig(
  config: Partial<DesktopAgentConfig>
): Promise<boolean> {
  try {
    const response = await fetch(`${AGENT_URL}/api/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function pinWithDesktopAgent(cid: string, name?: string): Promise<boolean> {
  try {
    const response = await fetch(`${AGENT_URL}/api/pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cid, name }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function unpinFromDesktopAgent(cid: string): Promise<boolean> {
  try {
    const response = await fetch(`${AGENT_URL}/api/unpin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cid }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function getDesktopAgentPins(): Promise<Array<{cid: string; name: string; size: number}>> {
  try {
    const response = await fetch(`${AGENT_URL}/api/pins`, {
      method: "GET",
    });
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function isAgentAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}
