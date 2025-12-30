import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { 
  getNodeConfig, 
  saveNodeConfig, 
  testIPFSConnection,
  getIPFSStats,
  type NodeConfig, 
  type ConnectionMode 
} from "@/lib/node-config";
import { getHeliaClient, initializeHeliaNode, stopHeliaNode, type HeliaNodeStatus } from "@/lib/helia-client";

interface NodeConfigContextValue {
  config: NodeConfig;
  setMode: (mode: ConnectionMode) => void;
  updateConfig: (updates: Partial<NodeConfig>) => void;
  testConnection: () => Promise<{ success: boolean; error?: string }>;
  ipfsStats: {
    repoSize: number;
    numObjects: number;
    peerId: string;
    addresses: string[];
  } | null;
  heliaStatus: HeliaNodeStatus | null;
  isTesting: boolean;
  isInitializing: boolean;
  refreshStats: () => Promise<void>;
  initializeBrowserNode: () => Promise<boolean>;
  stopBrowserNode: () => Promise<void>;
}

const NodeConfigContext = createContext<NodeConfigContextValue | null>(null);

export function NodeConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<NodeConfig>(getNodeConfig);
  const [isTesting, setIsTesting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [heliaStatus, setHeliaStatus] = useState<HeliaNodeStatus | null>(null);
  const [ipfsStats, setIpfsStats] = useState<{
    repoSize: number;
    numObjects: number;
    peerId: string;
    addresses: string[];
  } | null>(null);

  const refreshHeliaStatus = useCallback(async () => {
    if (config.mode === "browser") {
      const client = getHeliaClient();
      const status = await client.getStatus();
      setHeliaStatus(status);
      return status;
    }
    return null;
  }, [config.mode]);

  const initializeBrowserNode = useCallback(async (): Promise<boolean> => {
    setIsInitializing(true);
    try {
      const success = await initializeHeliaNode();
      if (success) {
        const currentConfig = getNodeConfig();
        if (currentConfig.mode !== "browser") {
          console.log("[NodeConfig] Mode changed during init, aborting browser node update");
          await stopHeliaNode();
          return false;
        }
        
        const client = getHeliaClient();
        const peerId = client.getPeerId();
        const updated = saveNodeConfig({
          isConnected: true,
          peerId,
          lastConnected: new Date().toISOString(),
        });
        setConfig(updated);
        await refreshHeliaStatus();
      }
      return success;
    } catch (err) {
      console.error("[NodeConfig] Failed to initialize browser node:", err);
      return false;
    } finally {
      setIsInitializing(false);
    }
  }, [refreshHeliaStatus]);

  const stopBrowserNode = useCallback(async (): Promise<void> => {
    await stopHeliaNode();
    setHeliaStatus(null);
    const updated = saveNodeConfig({
      isConnected: false,
      peerId: null,
    });
    setConfig(updated);
  }, []);

  const refreshStats = async () => {
    if (config.mode === "browser") {
      await refreshHeliaStatus();
    } else if (config.mode !== "demo" && config.isConnected) {
      const stats = await getIPFSStats(config.ipfsApiUrl);
      setIpfsStats(stats);
    }
  };

  useEffect(() => {
    if (config.mode === "browser" && !config.isConnected && !isInitializing) {
      initializeBrowserNode();
    }
  }, [config.mode, config.isConnected, isInitializing, initializeBrowserNode]);

  useEffect(() => {
    refreshStats();
  }, [config.isConnected, config.mode]);

  const setMode = async (mode: ConnectionMode) => {
    if (config.mode === "browser" && mode !== "browser") {
      await stopBrowserNode();
    }

    const updated = saveNodeConfig({ 
      mode, 
      isConnected: mode === "demo",
      peerId: mode === "demo" ? "demo-mode" : null,
    });
    setConfig(updated);
    setIpfsStats(null);
    setHeliaStatus(null);

    if (mode === "browser") {
      initializeBrowserNode();
    }
  };

  const updateConfig = (updates: Partial<NodeConfig>) => {
    const updated = saveNodeConfig({ ...updates, isConnected: false });
    setConfig(updated);
  };

  const testConnection = async () => {
    if (config.mode === "browser") {
      setIsTesting(true);
      const success = await initializeBrowserNode();
      setIsTesting(false);
      return { success, error: success ? undefined : "Failed to start browser node" };
    }

    setIsTesting(true);
    
    const result = await testIPFSConnection(config.ipfsApiUrl);
    
    if (result.success) {
      const updated = saveNodeConfig({
        isConnected: true,
        peerId: result.peerId || null,
        lastConnected: new Date().toISOString(),
      });
      setConfig(updated);
      refreshStats();
    } else {
      const updated = saveNodeConfig({ isConnected: false, peerId: null });
      setConfig(updated);
    }
    
    setIsTesting(false);
    return result;
  };

  return (
    <NodeConfigContext.Provider value={{
      config,
      setMode,
      updateConfig,
      testConnection,
      ipfsStats,
      heliaStatus,
      isTesting,
      isInitializing,
      refreshStats,
      initializeBrowserNode,
      stopBrowserNode,
    }}>
      {children}
    </NodeConfigContext.Provider>
  );
}

export function useNodeConfig() {
  const context = useContext(NodeConfigContext);
  if (!context) {
    throw new Error("useNodeConfig must be used within a NodeConfigProvider");
  }
  return context;
}
