import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Video, 
  Upload, 
  Settings, 
  RefreshCw, 
  Monitor, 
  Globe, 
  Cpu,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Play,
  Server
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EncodingJob {
  id: string;
  owner: string;
  permlink: string;
  inputCid: string;
  outputCid?: string;
  status: string;
  progress: number;
  encodingMode: string;
  encoderType?: string;
  isShort: boolean;
  qualitiesEncoded?: string;
  videoUrl?: string;
  hbdCost?: string;
  errorMessage?: string;
  originalFilename?: string;
  inputSizeBytes?: number;
  outputSizeBytes?: number;
  processingTimeSec?: number;
  createdAt: string;
  completedAt?: string;
}

interface EncodingStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  queuedJobs: number;
  processingJobs: number;
  activeEncoders: number;
  communityEncoders: number;
  desktopEncoders: number;
}

interface EncoderNode {
  id: string;
  peerId: string;
  hiveUsername: string;
  endpoint?: string;
  encoderType: string;
  availability: string;
  jobsCompleted: number;
  jobsInProgress: number;
  hardwareAcceleration?: string;
  rating?: number;
}

interface UserEncodingSettings {
  preferredMode: string;
  desktopAgentEnabled: boolean;
  desktopAgentEndpoint?: string;
  browserEncodingEnabled: boolean;
  maxCommunityHbd: string;
  defaultIsShort: boolean;
  webhookUrl?: string;
}

export default function EncodingPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newJobForm, setNewJobForm] = useState({
    owner: "",
    permlink: "",
    inputCid: "",
    isShort: false,
  });
  const [testEndpoint, setTestEndpoint] = useState("http://localhost:3002");
  const [settingsUsername, setSettingsUsername] = useState("");

  const { data: stats } = useQuery<EncodingStats>({
    queryKey: ["/api/encoding/stats"],
    refetchInterval: 5000,
  });

  const { data: jobs = [] } = useQuery<EncodingJob[]>({
    queryKey: ["/api/encoding/jobs"],
    refetchInterval: 3000,
  });

  const { data: encoders = [] } = useQuery<EncoderNode[]>({
    queryKey: ["/api/encoding/encoders"],
    refetchInterval: 10000,
  });

  const submitJobMutation = useMutation({
    mutationFn: async (job: typeof newJobForm) => {
      const res = await fetch("/api/encoding/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(job),
      });
      if (!res.ok) throw new Error("Failed to submit job");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Job Submitted", description: "Encoding job added to queue" });
      queryClient.invalidateQueries({ queryKey: ["/api/encoding/jobs"] });
      setNewJobForm({ owner: "", permlink: "", inputCid: "", isShort: false });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const checkDesktopAgentMutation = useMutation({
    mutationFn: async (endpoint: string) => {
      const res = await fetch("/api/encoding/check-desktop-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.available) {
        toast({ 
          title: "Desktop Agent Found", 
          description: `Hardware: ${data.hardwareAcceleration || "Software"}` 
        });
      } else {
        toast({ 
          title: "Desktop Agent Not Found", 
          description: "Make sure the agent is running locally",
          variant: "destructive"
        });
      }
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "queued":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "downloading":
      case "encoding":
      case "uploading":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEncoderTypeIcon = (type?: string) => {
    switch (type) {
      case "desktop":
        return <Monitor className="h-4 w-4" />;
      case "browser":
        return <Globe className="h-4 w-4" />;
      case "community":
        return <Server className="h-4 w-4" />;
      default:
        return <Cpu className="h-4 w-4" />;
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDuration = (sec?: number) => {
    if (!sec) return "—";
    if (sec < 60) return `${sec}s`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ${sec % 60}s`;
    return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Video className="h-8 w-8 text-red-500" />
            Hybrid Encoding
          </h1>
          <p className="text-muted-foreground">
            Self-encode with desktop agent or use community encoders
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => queryClient.invalidateQueries()}
          data-testid="button-refresh-encoding"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold" data-testid="text-total-jobs">{stats?.totalJobs || 0}</div>
            <p className="text-sm text-muted-foreground">Total Jobs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500" data-testid="text-completed-jobs">
              {stats?.completedJobs || 0}
            </div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-500" data-testid="text-processing-jobs">
              {stats?.processingJobs || 0}
            </div>
            <p className="text-sm text-muted-foreground">Processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-500" data-testid="text-active-encoders">
              {stats?.activeEncoders || 0}
            </div>
            <p className="text-sm text-muted-foreground">Active Encoders</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs" data-testid="tab-jobs">Jobs Queue</TabsTrigger>
          <TabsTrigger value="submit" data-testid="tab-submit">Submit Job</TabsTrigger>
          <TabsTrigger value="encoders" data-testid="tab-encoders">Encoders</TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Encoding Jobs</CardTitle>
              <CardDescription>Recent encoding job history and status</CardDescription>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No encoding jobs yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="border rounded-lg p-4 space-y-2"
                      data-testid={`card-job-${job.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          <span className="font-medium">{job.owner}/{job.permlink}</span>
                          {job.isShort && <Badge variant="secondary">Short</Badge>}
                        </div>
                        <div className="flex items-center gap-2">
                          {job.encoderType && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              {getEncoderTypeIcon(job.encoderType)}
                              {job.encoderType}
                            </Badge>
                          )}
                          <Badge 
                            variant={
                              job.status === "completed" ? "default" :
                              job.status === "failed" ? "destructive" :
                              "secondary"
                            }
                          >
                            {job.status}
                          </Badge>
                        </div>
                      </div>

                      {(job.status === "downloading" || job.status === "encoding" || job.status === "uploading") && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{job.status}</span>
                            <span>{job.progress}%</span>
                          </div>
                          <Progress value={job.progress} />
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Input: {job.inputCid.substring(0, 12)}...</span>
                        {job.outputCid && (
                          <span>Output: {job.outputCid.substring(0, 12)}...</span>
                        )}
                        {job.qualitiesEncoded && (
                          <span>Qualities: {job.qualitiesEncoded}</span>
                        )}
                        {job.processingTimeSec && (
                          <span>Time: {formatDuration(job.processingTimeSec)}</span>
                        )}
                      </div>

                      {job.errorMessage && (
                        <div className="text-sm text-red-500 bg-red-500/10 p-2 rounded">
                          {job.errorMessage}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Submit Encoding Job</CardTitle>
              <CardDescription>
                Submit a video for encoding. Uses desktop agent if available, otherwise falls back to community encoders.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="owner">Hive Username</Label>
                  <Input
                    id="owner"
                    placeholder="your-hive-username"
                    value={newJobForm.owner}
                    onChange={(e) => setNewJobForm({ ...newJobForm, owner: e.target.value })}
                    data-testid="input-owner"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="permlink">Permlink</Label>
                  <Input
                    id="permlink"
                    placeholder="my-video-post"
                    value={newJobForm.permlink}
                    onChange={(e) => setNewJobForm({ ...newJobForm, permlink: e.target.value })}
                    data-testid="input-permlink"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="inputCid">Input CID</Label>
                <Input
                  id="inputCid"
                  placeholder="Qm... or bafy..."
                  value={newJobForm.inputCid}
                  onChange={(e) => setNewJobForm({ ...newJobForm, inputCid: e.target.value })}
                  data-testid="input-cid"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isShort"
                  checked={newJobForm.isShort}
                  onCheckedChange={(checked) => setNewJobForm({ ...newJobForm, isShort: checked })}
                  data-testid="switch-is-short"
                />
                <Label htmlFor="isShort">Short video (480p only)</Label>
              </div>

              <Button 
                onClick={() => submitJobMutation.mutate(newJobForm)}
                disabled={!newJobForm.owner || !newJobForm.permlink || !newJobForm.inputCid || submitJobMutation.isPending}
                className="w-full"
                data-testid="button-submit-job"
              >
                {submitJobMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Submit Encoding Job
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="encoders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Encoders</CardTitle>
              <CardDescription>
                Desktop agents, browser encoders, and community nodes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Input
                  placeholder="http://localhost:3002"
                  value={testEndpoint}
                  onChange={(e) => setTestEndpoint(e.target.value)}
                  className="max-w-sm"
                  data-testid="input-test-endpoint"
                />
                <Button
                  variant="outline"
                  onClick={() => checkDesktopAgentMutation.mutate(testEndpoint)}
                  disabled={checkDesktopAgentMutation.isPending}
                  data-testid="button-test-agent"
                >
                  {checkDesktopAgentMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Monitor className="h-4 w-4 mr-2" />
                  )}
                  Test Desktop Agent
                </Button>
              </div>

              {encoders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No encoders registered yet</p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {encoders.map((encoder) => (
                    <div
                      key={encoder.id}
                      className="border rounded-lg p-4 space-y-2"
                      data-testid={`card-encoder-${encoder.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getEncoderTypeIcon(encoder.encoderType)}
                          <span className="font-medium">{encoder.hiveUsername}</span>
                        </div>
                        <Badge variant={encoder.availability === "available" ? "default" : "secondary"}>
                          {encoder.availability}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Type: {encoder.encoderType}</div>
                        {encoder.hardwareAcceleration && (
                          <div>Hardware: {encoder.hardwareAcceleration}</div>
                        )}
                        <div>Jobs: {encoder.jobsCompleted} completed, {encoder.jobsInProgress} active</div>
                        {encoder.rating && <div>Rating: {encoder.rating.toFixed(1)}/5.0</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Encoding Preferences
              </CardTitle>
              <CardDescription>
                Configure your default encoding settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Encoding Priority</Label>
                  <p className="text-sm text-muted-foreground">
                    Videos are encoded using this priority order:
                  </p>
                  <ol className="list-decimal list-inside text-sm space-y-1 ml-2">
                    <li><strong>Desktop Agent (FFmpeg)</strong> - Fastest, uses your GPU, free</li>
                    <li><strong>Browser (WebCodecs)</strong> - Slower, limited to short videos</li>
                    <li><strong>Community Encoders</strong> - Reliable, costs HBD</li>
                  </ol>
                </div>

                <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Desktop Agent Auto-Detection</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically use local encoding when agent is running
                      </p>
                    </div>
                    <Switch defaultChecked data-testid="switch-auto-detect" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Browser Encoding Fallback</Label>
                      <p className="text-sm text-muted-foreground">
                        Use browser-based encoding for short videos if agent unavailable
                      </p>
                    </div>
                    <Switch defaultChecked data-testid="switch-browser-fallback" />
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-blue-500" />
                    Desktop Agent Benefits
                  </h4>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    <li>• Free encoding (no HBD cost)</li>
                    <li>• GPU acceleration (NVENC, VAAPI, QSV)</li>
                    <li>• Multi-quality HLS output (1080p/720p/480p)</li>
                    <li>• Direct IPFS upload to your node</li>
                    <li>• Earnings shift to storage/CDN</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
