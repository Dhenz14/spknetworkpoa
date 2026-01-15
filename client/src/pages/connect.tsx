import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { 
  Server, 
  Wifi, 
  WifiOff, 
  Globe, 
  HardDrive, 
  Loader2,
  RefreshCw,
  ExternalLink,
  Copy,
  Laptop,
  Monitor,
  Download,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Zap,
  Activity
} from "lucide-react";
import { Link } from "wouter";
import { useNodeConfig } from "@/contexts/NodeConfigContext";
import { formatBytes, testBackendIPFSConnection, type ConnectionMode } from "@/lib/node-config";

interface DesktopAgentStatusResponse {
  running: boolean;
  peerId: string | null;
  // Nested format (expected)
  stats?: {
    repoSize: number;
    numObjects: number;
    bandwidthIn: number;
    bandwidthOut: number;
  } | null;
  config?: {
    hiveUsername: string;
    autoStart: boolean;
  } | null;
  earnings?: {
    totalHbd: string;
    challengesPassed: number;
    streak: number;
  } | null;
  // Flat format (desktop agent may return these at top level)
  hiveUsername?: string;
  autoStart?: boolean;
  repoSize?: number;
  numObjects?: number;
  bandwidthIn?: number;
  bandwidthOut?: number;
  totalHbd?: string;
  challengesPassed?: number;
  streak?: number;
  version?: string;
}

const DESKTOP_AGENT_URL = "http://localhost:5111";

export default function Connect() {
  const { toast } = useToast();
  const { 
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
    stopBrowserNode
  } = useNodeConfig();

  const [desktopAgentStatus, setDesktopAgentStatus] = useState<DesktopAgentStatusResponse | null>(null);
  const [isPollingAgent, setIsPollingAgent] = useState(false);
  const isPollingRef = useRef<boolean>(false);

  const pollDesktopAgent = useCallback(async () => {
    if (isPollingRef.current) {
      return;
    }
    isPollingRef.current = true;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`${DESKTOP_AGENT_URL}/api/status`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        const status: DesktopAgentStatusResponse = await response.json();
        setDesktopAgentStatus(status);
      } else {
        setDesktopAgentStatus(null);
      }
    } catch {
      setDesktopAgentStatus(null);
    } finally {
      isPollingRef.current = false;
    }
  }, []);

  useEffect(() => {
    setIsPollingAgent(true);
    pollDesktopAgent();

    const interval = setInterval(pollDesktopAgent, 3000);

    return () => {
      clearInterval(interval);
      setIsPollingAgent(false);
    };
  }, [pollDesktopAgent]);

  const getHiveUsername = (status: DesktopAgentStatusResponse | null): string => {
    if (!status) return "";
    return status.config?.hiveUsername || status.hiveUsername || "";
  };

  const getStats = (status: DesktopAgentStatusResponse | null) => {
    if (!status) return null;
    if (status.stats) return status.stats;
    if (status.repoSize !== undefined || status.numObjects !== undefined) {
      return {
        repoSize: status.repoSize ?? 0,
        numObjects: status.numObjects ?? 0,
        bandwidthIn: status.bandwidthIn ?? 0,
        bandwidthOut: status.bandwidthOut ?? 0,
      };
    }
    return null;
  };

  const getEarnings = (status: DesktopAgentStatusResponse | null) => {
    if (!status) return null;
    if (status.earnings) return status.earnings;
    if (status.totalHbd !== undefined || status.challengesPassed !== undefined) {
      return {
        totalHbd: status.totalHbd ?? "0 HBD",
        challengesPassed: status.challengesPassed ?? 0,
        streak: status.streak ?? 0,
      };
    }
    return null;
  };

  const handleConnectToDesktopAgent = () => {
    if (desktopAgentStatus?.running && desktopAgentStatus.peerId) {
      setMode("local");
      updateConfig({
        ipfsApiUrl: `${DESKTOP_AGENT_URL}/api/ipfs`,
        ipfsGatewayUrl: `${DESKTOP_AGENT_URL}/gateway`,
        isConnected: true,
        peerId: desktopAgentStatus.peerId,
        hiveUsername: getHiveUsername(desktopAgentStatus),
      });
      toast({
        title: "Connected to Desktop Agent!",
        description: "You're now using your desktop agent's IPFS node",
      });
    }
  };

  const handleModeChange = (mode: ConnectionMode) => {
    setMode(mode);
  };

  const handleInputChange = (field: "ipfsApiUrl" | "ipfsGatewayUrl" | "hiveUsername", value: string) => {
    updateConfig({ [field]: value });
  };

  const handleTestConnection = async () => {
    const result = await testConnection();
    
    if (result.success) {
      toast({
        title: "Connected!",
        description: config.mode === "browser" 
          ? "Browser IPFS node is running" 
          : "Successfully connected to IPFS node",
      });
    } else {
      toast({
        title: "Connection Failed",
        description: result.error || "Could not connect to IPFS node",
        variant: "destructive",
      });
    }
  };

  const handleCopyPeerId = () => {
    if (config.peerId) {
      navigator.clipboard.writeText(config.peerId);
      toast({ title: "Copied!", description: "Peer ID copied to clipboard" });
    }
  };

  const handleUseBackend = async () => {
    const result = await testBackendIPFSConnection();
    
    if (result.success) {
      updateConfig({ 
        isConnected: true, 
        peerId: result.peerId || "server-ipfs",
        ipfsApiUrl: "/api/ipfs",
      });
      toast({
        title: "Connected to Server IPFS!",
        description: "Using the backend's IPFS node for development",
      });
    } else {
      toast({
        title: "Backend Connection Failed",
        description: result.error || "Could not connect to server IPFS",
        variant: "destructive",
      });
    }
  };

  const handleStartBrowserNode = async () => {
    const success = await initializeBrowserNode();
    if (success) {
      toast({
        title: "Browser Node Started!",
        description: "Your in-browser IPFS node is now running",
      });
    } else {
      toast({
        title: "Failed to Start",
        description: "Could not initialize browser IPFS node",
        variant: "destructive",
      });
    }
  };

  const handleStopBrowserNode = async () => {
    await stopBrowserNode();
    toast({
      title: "Browser Node Stopped",
      description: "Your in-browser IPFS node has been stopped",
    });
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3" data-testid="connect-title">
          <Server className="h-8 w-8 text-primary" />
          Node Connection
        </h1>
        <p className="text-muted-foreground mt-1">
          Connect to IPFS to store content and participate in the network
        </p>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Connection Status</CardTitle>
              <CardDescription>
                {config.mode === "browser" ? "Browser IPFS Node" : "Your IPFS node connection"}
              </CardDescription>
            </div>
            {isInitializing ? (
              <Badge variant="secondary" data-testid="status-initializing">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Starting...
              </Badge>
            ) : config.isConnected ? (
              <Badge variant="default" className="bg-green-500 text-white" data-testid="status-connected">
                <Wifi className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" data-testid="status-disconnected">
                <WifiOff className="w-3 h-3 mr-1" />
                Disconnected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {config.isConnected && config.peerId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Peer ID</p>
                  <p className="font-mono text-sm truncate max-w-md" data-testid="text-peer-id">{config.peerId}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleCopyPeerId} data-testid="button-copy-peer-id">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              {config.mode === "browser" && heliaStatus && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-2xl font-bold" data-testid="text-repo-size">{formatBytes(heliaStatus.repoSize)}</p>
                    <p className="text-xs text-muted-foreground">Storage Used</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-2xl font-bold" data-testid="text-num-objects">{heliaStatus.numObjects.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Objects</p>
                  </div>
                </div>
              )}

              {config.mode !== "browser" && ipfsStats && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-2xl font-bold">{formatBytes(ipfsStats.repoSize)}</p>
                    <p className="text-xs text-muted-foreground">Storage Used</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-2xl font-bold">{ipfsStats.numObjects.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Objects</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-2xl font-bold">{ipfsStats.addresses.length}</p>
                    <p className="text-xs text-muted-foreground">Addresses</p>
                  </div>
                </div>
              )}
              
              {config.mode === "browser" && config.isConnected && (
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" onClick={refreshStats} className="flex-1" data-testid="button-refresh-stats">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Stats
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleStopBrowserNode} data-testid="button-stop-node">
                    Stop Node
                  </Button>
                </div>
              )}
              
              {config.isConnected && config.mode !== "demo" && config.mode !== "browser" && (
                <Button variant="outline" size="sm" onClick={refreshStats} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Stats
                </Button>
              )}
            </div>
          )}
          
          {!config.isConnected && config.mode === "browser" && !isInitializing && (
            <div className="text-center py-8">
              <Monitor className="h-12 w-12 mx-auto mb-3 text-primary opacity-70" />
              <p className="text-muted-foreground">Browser node not running</p>
              <p className="text-sm text-muted-foreground mb-4">Click below to start your in-browser IPFS node</p>
              <Button onClick={handleStartBrowserNode} data-testid="button-start-browser-node">
                <Loader2 className={`h-4 w-4 mr-2 ${isInitializing ? "animate-spin" : "hidden"}`} />
                Start Browser Node
              </Button>
            </div>
          )}
          
          {!config.isConnected && config.mode !== "demo" && config.mode !== "browser" && (
            <div className="text-center py-8 text-muted-foreground">
              <WifiOff className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Not connected to an IPFS node</p>
              <p className="text-sm">Configure your node below and test the connection</p>
            </div>
          )}
          
          {config.mode === "demo" && (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Running in Demo Mode</p>
              <p className="text-sm">Using simulated data for demonstration purposes</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm" data-testid="card-desktop-agent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Laptop className="h-5 w-5" />
                Desktop Agent
              </CardTitle>
              <CardDescription>
                Run a 24/7 IPFS node and earn HBD rewards
              </CardDescription>
            </div>
            {desktopAgentStatus?.running ? (
              <Badge variant="default" className="bg-green-500 text-white" data-testid="badge-agent-running">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Desktop Agent Running
              </Badge>
            ) : (
              <Badge variant="secondary" data-testid="badge-agent-not-detected">
                <AlertCircle className="w-3 h-3 mr-1" />
                Not Detected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {desktopAgentStatus?.running ? (
            <div className="space-y-4">
              {desktopAgentStatus.peerId && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Peer ID</p>
                    <p className="font-mono text-sm truncate max-w-md" data-testid="text-agent-peer-id">
                      {desktopAgentStatus.peerId}
                    </p>
                  </div>
                </div>
              )}

              {(() => {
                const stats = getStats(desktopAgentStatus);
                return stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-xl font-bold" data-testid="text-agent-repo-size">
                        {formatBytes(stats.repoSize)}
                      </p>
                      <p className="text-xs text-muted-foreground">Storage Used</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-xl font-bold" data-testid="text-agent-num-objects">
                        {stats.numObjects.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Objects</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-xl font-bold" data-testid="text-agent-bandwidth-in">
                        {formatBytes(stats.bandwidthIn)}/s
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Activity className="h-3 w-3" /> In
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-xl font-bold" data-testid="text-agent-bandwidth-out">
                        {formatBytes(stats.bandwidthOut)}/s
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Activity className="h-3 w-3" /> Out
                      </p>
                    </div>
                  </div>
                );
              })()}

              {(() => {
                const earnings = getEarnings(desktopAgentStatus);
                return earnings && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Earnings</span>
                      </div>
                      <span className="font-bold text-green-600" data-testid="text-agent-total-hbd">
                        {earnings.totalHbd}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span data-testid="text-agent-challenges">
                        {earnings.challengesPassed} challenges passed
                      </span>
                      <span data-testid="text-agent-streak">
                        {earnings.streak} day streak
                      </span>
                    </div>
                  </div>
                );
              })()}

              {(() => {
                const hiveUsername = getHiveUsername(desktopAgentStatus);
                return hiveUsername && (
                  <p className="text-sm text-muted-foreground">
                    Hive Account: <span className="font-medium" data-testid="text-agent-hive-username">@{hiveUsername}</span>
                  </p>
                );
              })()}

              <Button
                onClick={handleConnectToDesktopAgent}
                className="w-full"
                data-testid="button-connect-desktop-agent"
              >
                <Laptop className="h-4 w-4 mr-2" />
                Connect to Desktop Agent
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-4">
                <Laptop className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground font-medium">Desktop Agent Not Detected</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Follow the steps below to set up your agent
                </p>
              </div>

              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Download the desktop agent</p>
                    <Link href="/download">
                      <Button variant="link" className="h-auto p-0 text-primary" data-testid="link-download-agent">
                        <Download className="h-3 w-3 mr-1" />
                        Go to download page
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Install and run the app</p>
                    <p className="text-sm text-muted-foreground">
                      Open the downloaded file and follow the installation wizard
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Wait for IPFS to initialize</p>
                    <p className="text-sm text-muted-foreground">
                      This typically takes 30-60 seconds on first launch
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">
                    4
                  </div>
                  <div>
                    <p className="font-medium">This page will automatically detect your agent</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <RefreshCw className={`h-3 w-3 ${isPollingAgent ? "animate-spin" : ""}`} />
                      Checking every 3 seconds...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Connection Mode</CardTitle>
          <CardDescription>Choose how to connect to IPFS</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={config.mode}
            onValueChange={(v) => handleModeChange(v as ConnectionMode)}
            className="space-y-4"
          >
            <div className={`flex items-start space-x-3 p-4 border rounded-lg transition-colors ${config.mode === "browser" ? "border-primary bg-primary/5" : "hover:border-primary/50"}`}>
              <RadioGroupItem value="browser" id="browser" className="mt-1" data-testid="radio-browser" />
              <div className="flex-1">
                <Label htmlFor="browser" className="flex items-center gap-2 cursor-pointer">
                  <Monitor className="h-4 w-4 text-primary" />
                  Browser Node
                  <Badge variant="secondary" className="ml-2 text-xs">Recommended</Badge>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Run IPFS directly in your browser. No setup required! Data stored in IndexedDB.
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  Note: Node stops when you close the tab. For 24/7 earning, use a desktop agent.
                </p>
              </div>
            </div>

            <div className={`flex items-start space-x-3 p-4 border rounded-lg transition-colors ${config.mode === "local" ? "border-primary bg-primary/5" : "hover:border-primary/50"}`}>
              <RadioGroupItem value="local" id="local" className="mt-1" data-testid="radio-local" />
              <div className="flex-1">
                <Label htmlFor="local" className="flex items-center gap-2 cursor-pointer">
                  <Laptop className="h-4 w-4" />
                  Local Node
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect to IPFS running on your local machine (localhost:5001)
                </p>
              </div>
            </div>
            
            <div className={`flex items-start space-x-3 p-4 border rounded-lg transition-colors ${config.mode === "remote" ? "border-primary bg-primary/5" : "hover:border-primary/50"}`}>
              <RadioGroupItem value="remote" id="remote" className="mt-1" data-testid="radio-remote" />
              <div className="flex-1">
                <Label htmlFor="remote" className="flex items-center gap-2 cursor-pointer">
                  <HardDrive className="h-4 w-4" />
                  Remote Node
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect to IPFS on your home server, VPS, or Raspberry Pi
                </p>
              </div>
            </div>
            
            <div className={`flex items-start space-x-3 p-4 border rounded-lg transition-colors ${config.mode === "demo" ? "border-primary bg-primary/5" : "hover:border-primary/50"}`}>
              <RadioGroupItem value="demo" id="demo" className="mt-1" data-testid="radio-demo" />
              <div className="flex-1">
                <Label htmlFor="demo" className="flex items-center gap-2 cursor-pointer">
                  <Globe className="h-4 w-4" />
                  Demo Mode
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Use simulated data to explore the interface (no real IPFS)
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {(config.mode === "local" || config.mode === "remote") && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Node Settings</CardTitle>
            <CardDescription>Configure your IPFS node connection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ipfs-api">IPFS API URL</Label>
                <Input
                  id="ipfs-api"
                  data-testid="input-ipfs-api"
                  placeholder="http://127.0.0.1:5001"
                  value={config.ipfsApiUrl}
                  onChange={(e) => handleInputChange("ipfsApiUrl", e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  The IPFS HTTP API endpoint (usually port 5001)
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="ipfs-gateway">IPFS Gateway URL</Label>
                <Input
                  id="ipfs-gateway"
                  data-testid="input-ipfs-gateway"
                  placeholder="http://127.0.0.1:8080"
                  value={config.ipfsGatewayUrl}
                  onChange={(e) => handleInputChange("ipfsGatewayUrl", e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  The IPFS gateway for viewing content (usually port 8080)
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="hive-username">Hive Username (Optional)</Label>
                <Input
                  id="hive-username"
                  data-testid="input-hive-username"
                  placeholder="@yourusername"
                  value={config.hiveUsername}
                  onChange={(e) => handleInputChange("hiveUsername", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Your Hive account for receiving HBD rewards
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                data-testid="button-test-connection"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="flex-1"
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : config.isConnected ? (
                  <RefreshCw className="h-4 w-4 mr-2" />
                ) : (
                  <Wifi className="h-4 w-4 mr-2" />
                )}
                {isTesting ? "Testing..." : config.isConnected ? "Reconnect" : "Test Connection"}
              </Button>
              <Button
                data-testid="button-use-backend"
                onClick={handleUseBackend}
                disabled={isTesting}
                variant="outline"
              >
                <Server className="h-4 w-4 mr-2" />
                Use Server IPFS
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              "Test Connection" connects directly from your browser. "Use Server IPFS" uses the backend's IPFS node (for development/demo).
            </p>
          </CardContent>
        </Card>
      )}

      {config.mode === "browser" ? (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Monitor className="h-5 w-5" />
              About Browser Nodes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>Your browser node runs entirely in your browser using Helia (JavaScript IPFS):</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>No installation required - works immediately</li>
              <li>Data stored locally in IndexedDB</li>
              <li>Can add, pin, and retrieve IPFS content</li>
              <li>Perfect for trying the network or light usage</li>
            </ul>
            <div className="pt-3 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-foreground font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Want 24/7 earning?
              </p>
              <p className="mt-1 text-muted-foreground">
                Browser nodes stop when you close the tab. Download our Desktop Agent for automatic 24/7 operation.
              </p>
              <Link href="/download">
                <Button variant="outline" size="sm" className="mt-3" data-testid="link-desktop-agent-browser">
                  <Download className="h-4 w-4 mr-2" />
                  Get Desktop Agent
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <HardDrive className="h-5 w-5" />
              Setting Up Your Own Node
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-4">
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-foreground font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Skip the manual setup!
              </p>
              <p className="mt-1 text-muted-foreground">
                Our Desktop Agent handles everything automatically - just download, install, and start earning HBD.
              </p>
              <Link href="/download">
                <Button variant="default" size="sm" className="mt-3" data-testid="link-desktop-agent-setup">
                  <Download className="h-4 w-4 mr-2" />
                  Download Desktop Agent
                </Button>
              </Link>
            </div>
            
            <div className="border-t pt-4">
              <p className="text-muted-foreground mb-3">Or set up manually:</p>
              <ol className="list-decimal list-inside space-y-2 ml-2 text-muted-foreground">
                <li><strong>Install Kubo</strong> - Download from <a href="https://dist.ipfs.tech/#kubo" target="_blank" rel="noopener" className="text-primary hover:underline">ipfs.tech <ExternalLink className="inline h-3 w-3" /></a></li>
                <li><strong>Initialize</strong> - Run <code className="bg-background px-1 rounded">ipfs init</code></li>
                <li><strong>Enable CORS</strong> - Required for web access</li>
                <li><strong>Start daemon</strong> - Run <code className="bg-background px-1 rounded">ipfs daemon</code></li>
                <li><strong>Connect</strong> - Enter your node's API URL above</li>
              </ol>
              <p className="pt-3 text-muted-foreground">
                For remote access, you can run IPFS on a Raspberry Pi, home server, or VPS.
                Make sure to configure port forwarding and firewall rules appropriately.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
