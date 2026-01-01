import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Users, Upload, Download, Wifi, WifiOff } from 'lucide-react';
import { P2PVideoEngine, P2PStats, createP2PEngine } from '@/lib/p2p-engine';

interface P2PVideoPlayerProps {
  manifestUrl: string;
  videoCid?: string;
  title?: string;
  poster?: string;
  autoPlay?: boolean;
  showStats?: boolean;
  p2pEnabled?: boolean;
  onP2PToggle?: (enabled: boolean) => void;
}

export function P2PVideoPlayer({
  manifestUrl,
  videoCid,
  title,
  poster,
  autoPlay = false,
  showStats = true,
  p2pEnabled = true,
  onP2PToggle,
}: P2PVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const engineRef = useRef<P2PVideoEngine | null>(null);
  const [isP2PEnabled, setIsP2PEnabled] = useState(p2pEnabled);
  const [stats, setStats] = useState<P2PStats>({
    httpDownloaded: 0,
    p2pDownloaded: 0,
    p2pUploaded: 0,
    peerCount: 0,
    p2pRatio: 0,
  });
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleStatsUpdate = useCallback((newStats: P2PStats) => {
    setStats(newStats);
  }, []);

  const handlePeerConnect = useCallback((peerId: string) => {
    setConnectedPeers(prev => [...prev, peerId]);
  }, []);

  const handlePeerDisconnect = useCallback((peerId: string) => {
    setConnectedPeers(prev => prev.filter(id => id !== peerId));
  }, []);

  useEffect(() => {
    if (!videoRef.current || !manifestUrl) return;

    const engine = createP2PEngine({
      enabled: isP2PEnabled,
      swarmId: videoCid,
      onStats: handleStatsUpdate,
      onPeerConnect: handlePeerConnect,
      onPeerDisconnect: handlePeerDisconnect,
    });

    engineRef.current = engine;

    if (!engine.isSupported()) {
      setError('HLS playback not supported in this browser');
      setIsLoading(false);
      return;
    }

    engine
      .attachToVideo(videoRef.current, manifestUrl)
      .then(() => {
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });

    return () => {
      engine.cleanup();
      engineRef.current = null;
    };
  }, [manifestUrl, videoCid, isP2PEnabled, handleStatsUpdate, handlePeerConnect, handlePeerDisconnect]);

  const handleP2PToggle = (enabled: boolean) => {
    setIsP2PEnabled(enabled);
    onP2PToggle?.(enabled);
  };

  const totalDownloaded = stats.httpDownloaded + stats.p2pDownloaded;
  const bandwidthSaved = stats.p2pDownloaded;

  return (
    <div className="space-y-4">
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <p className="text-red-500">{error}</p>
          </div>
        )}
        <video
          ref={videoRef}
          className="w-full h-full"
          controls
          autoPlay={autoPlay}
          poster={poster}
          playsInline
          data-testid="video-player"
        >
          Your browser does not support the video tag.
        </video>
        
        {isP2PEnabled && stats.peerCount > 0 && (
          <Badge 
            className="absolute top-3 right-3 bg-green-600/80 backdrop-blur-sm"
            data-testid="badge-p2p-peers"
          >
            <Users className="h-3 w-3 mr-1" />
            {stats.peerCount} peers
          </Badge>
        )}
      </div>

      {title && (
        <h2 className="text-lg font-semibold" data-testid="text-video-title">{title}</h2>
      )}

      {showStats && (
        <Card data-testid="card-p2p-stats">
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">P2P Network Stats</CardTitle>
              <div className="flex items-center space-x-2">
                <Switch
                  id="p2p-toggle"
                  checked={isP2PEnabled}
                  onCheckedChange={handleP2PToggle}
                  data-testid="switch-p2p-toggle"
                />
                <Label htmlFor="p2p-toggle" className="text-sm">
                  {isP2PEnabled ? (
                    <span className="flex items-center text-green-600">
                      <Wifi className="h-4 w-4 mr-1" /> P2P On
                    </span>
                  ) : (
                    <span className="flex items-center text-muted-foreground">
                      <WifiOff className="h-4 w-4 mr-1" /> CDN Only
                    </span>
                  )}
                </Label>
              </div>
            </div>
          </CardHeader>
          <CardContent className="py-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center text-muted-foreground">
                  <Download className="h-4 w-4 mr-1" />
                  CDN Downloaded
                </div>
                <p className="font-medium" data-testid="text-cdn-downloaded">
                  {P2PVideoEngine.formatBytes(stats.httpDownloaded)}
                </p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center text-green-600">
                  <Download className="h-4 w-4 mr-1" />
                  P2P Downloaded
                </div>
                <p className="font-medium text-green-600" data-testid="text-p2p-downloaded">
                  {P2PVideoEngine.formatBytes(stats.p2pDownloaded)}
                </p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center text-blue-600">
                  <Upload className="h-4 w-4 mr-1" />
                  P2P Uploaded
                </div>
                <p className="font-medium text-blue-600" data-testid="text-p2p-uploaded">
                  {P2PVideoEngine.formatBytes(stats.p2pUploaded)}
                </p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center text-muted-foreground">
                  <Users className="h-4 w-4 mr-1" />
                  Connected Peers
                </div>
                <p className="font-medium" data-testid="text-peer-count">
                  {connectedPeers.length}
                </p>
              </div>
            </div>

            {totalDownloaded > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">P2P Ratio</span>
                  <span className="font-medium" data-testid="text-p2p-ratio">
                    {P2PVideoEngine.formatRatio(stats.p2pRatio)}
                  </span>
                </div>
                <Progress 
                  value={stats.p2pRatio * 100} 
                  className="h-2"
                  data-testid="progress-p2p-ratio"
                />
                <p className="text-xs text-muted-foreground">
                  Bandwidth saved: {P2PVideoEngine.formatBytes(bandwidthSaved)} 
                  (shared from other viewers)
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
