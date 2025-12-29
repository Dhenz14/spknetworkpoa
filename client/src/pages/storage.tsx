import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Upload, File, Search, Copy, CheckCircle2, Clock, ShieldCheck, AlertCircle, Users, Coins } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function Storage() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState([
    { id: 1, name: "project_specs_v2.pdf", cid: "QmX7...9jK", size: "2.4 MB", status: "Pinned", date: "2025-05-20", proofs: 142, lastProof: "2m ago", replication: 12, confidence: 98, poaEnabled: true },
    { id: 2, name: "assets_bundle.zip", cid: "QmY8...2mL", size: "156 MB", status: "Pinned", date: "2025-05-19", proofs: 89, lastProof: "15m ago", replication: 8, confidence: 92, poaEnabled: true },
    { id: 3, name: "intro_video.mp4", cid: "QmZ9...4nPx", size: "45 MB", status: "Syncing", date: "2025-05-19", proofs: 0, lastProof: "N/A", replication: 1, confidence: 0, poaEnabled: false },
    { id: 4, name: "dataset_01.json", cid: "QmA1...5oQ", size: "12 KB", status: "Pinned", date: "2025-05-18", proofs: 450, lastProof: "5m ago", replication: 45, confidence: 99, poaEnabled: true },
    { id: 5, name: "backup_log.txt", cid: "QmB2...6pR", size: "1.1 MB", status: "Pinned", date: "2025-05-18", proofs: 12, lastProof: "1h ago", replication: 4, confidence: 75, poaEnabled: false },
  ]);

  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      toast({
        title: "File Uploaded",
        description: "Content successfully pinned to IPFS and broadcasted to Hive.",
      });
    }, 1500);
  };

  const togglePoa = (id: number) => {
    setFiles(files.map(f => {
      if (f.id === id) {
        const newState = !f.poaEnabled;
        toast({
          title: newState ? "Rewards Enabled" : "Rewards Disabled",
          description: `PoA challenges ${newState ? "enabled" : "disabled"} for ${f.name}`,
        });
        return { ...f, poaEnabled: newState };
      }
      return f;
    }));
  };

  const toggleAll = (enabled: boolean) => {
    setFiles(files.map(f => ({ ...f, poaEnabled: enabled })));
    toast({
      title: enabled ? "All Rewards Enabled" : "All Rewards Paused",
      description: `PoA challenges ${enabled ? "enabled" : "paused"} for all files.`,
    });
  };

  const allEnabled = files.every(f => f.poaEnabled);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold">Storage Management</h1>
          <p className="text-muted-foreground mt-1">Manage your IPFS pins and content proofs</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border/50 rounded-lg">
            <Label htmlFor="all-rewards" className="text-sm font-medium cursor-pointer">Enable All Rewards</Label>
            <Switch 
              id="all-rewards" 
              checked={allEnabled}
              onCheckedChange={toggleAll}
            />
          </div>
          <Button onClick={handleUpload} disabled={isUploading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {isUploading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"/>
                Pinning...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Content
              </>
            )}
          </Button>
        </div>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="font-display text-lg">Pinned Content & Proofs</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search CID or name..." className="pl-8 bg-background/50" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead>Name</TableHead>
                <TableHead>CID</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Network Health</TableHead>
                <TableHead>Reward Status</TableHead>
                <TableHead>Proof Stats</TableHead>
                <TableHead className="text-right">Last Verified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id} className="hover:bg-primary/5 border-border/50 group transition-colors">
                  <TableCell className="font-medium flex items-center gap-2">
                    <File className="w-4 h-4 text-primary" />
                    {file.name}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      {file.cid}
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>{file.size}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                             <Users className="w-3 h-3" />
                             {file.replication} Nodes
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Replication Count</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger>
                           <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                             <ShieldCheck className="w-3 h-3" />
                             {file.confidence}% Trust
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Validator Confidence Score</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={file.poaEnabled} 
                        onCheckedChange={() => togglePoa(file.id)}
                        className="scale-75 data-[state=checked]:bg-green-500"
                      />
                      <span className={cn(
                        "text-xs font-medium",
                        file.poaEnabled ? "text-green-500" : "text-muted-foreground"
                      )}>
                        {file.poaEnabled ? "Earning" : "Paused"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {file.status === "Pinned" ? (
                      <div className={cn("flex items-center gap-2 text-xs", !file.poaEnabled && "opacity-50")}>
                        <Coins className={cn("w-4 h-4", file.poaEnabled ? "text-yellow-500" : "text-muted-foreground")} />
                        <span className="font-mono">{file.proofs} Proofs</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                         <AlertCircle className="w-4 h-4" />
                         <span>Pending Sync</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground font-mono text-xs">{file.lastProof}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
