import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Globe, Shield, Activity, Signal, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Validators() {
  const { toast } = useToast();

  const validators = [
    { rank: 5, name: "threespeak", hiveRank: 5, status: "Online", peers: 124, payout: "1.00 HBD", version: "v0.1.0" },
    { rank: 12, name: "hive-kings", hiveRank: 12, status: "Online", peers: 89, payout: "0.95 HBD", version: "v0.1.0" },
    { rank: 45, name: "arcange", hiveRank: 45, status: "Online", peers: 256, payout: "1.00 HBD", version: "v0.1.0" },
    { rank: 88, name: "pizza-witness", hiveRank: 88, status: "Syncing", peers: 12, payout: "0.90 HBD", version: "v0.0.9" },
    { rank: 142, name: "smaller-guy", hiveRank: 142, status: "Offline", peers: 0, payout: "1.00 HBD", version: "v0.1.0" },
  ];

  const handleConnect = (name: string) => {
    toast({
      title: "Connection Request Sent",
      description: `Attempting to peer with validator @${name}...`,
    });
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Network Validators</h1>
          <p className="text-muted-foreground mt-1">
            Top 150 Hive Witnesses running the HivePoA protocol. 
            Connect to a validator to start earning HBD.
          </p>
        </div>
        
        <div className="flex gap-2">
           <Badge variant="outline" className="px-3 py-1 border-green-500/30 bg-green-500/10 text-green-500 flex gap-2">
             <Signal className="w-3 h-3" />
             Network Healthy
           </Badge>
           <Badge variant="outline" className="px-3 py-1 border-primary/30 bg-primary/10 text-primary flex gap-2">
             <Activity className="w-3 h-3" />
             14 Active Validators
           </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Validator List */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Active Witness Gateways</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search witness..." className="pl-8" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {validators.map((val) => (
                  <div key={val.rank} className="flex items-center justify-between p-4 rounded-lg bg-card border border-border/50 hover:border-primary/30 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="font-mono text-xs text-muted-foreground w-12 text-center bg-muted/50 rounded py-1">
                        #{val.hiveRank}
                      </div>
                      <Avatar>
                        <AvatarImage src={`https://images.hive.blog/u/${val.name}/avatar`} />
                        <AvatarFallback>{val.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-bold flex items-center gap-2">
                          @{val.name}
                          {val.status === "Offline" ? 
                            <Badge variant="secondary" className="h-5 text-[10px] text-muted-foreground">Offline</Badge> : 
                            <Badge variant="outline" className="h-5 text-[10px] border-green-500/50 text-green-500">Active</Badge>
                          }
                        </h4>
                        <div className="flex gap-4 text-xs text-muted-foreground mt-1 font-mono">
                          <span className="flex items-center gap-1">v{val.version}</span>
                          <span className="flex items-center gap-1">• {val.peers} Peers</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                         <div className="text-xs text-muted-foreground mb-1">Avg. Payout</div>
                         <div className="font-mono font-medium text-green-500">{val.payout}</div>
                      </div>
                      <Button size="sm" variant={val.status === "Offline" ? "ghost" : "default"} disabled={val.status === "Offline"} onClick={() => handleConnect(val.name)}>
                        {val.status === "Offline" ? "Unavailable" : "Connect"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="border-border/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Trusted Federation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                HivePoA leverages the security of the <b>Hive Witness</b> system.
              </p>
              <ul className="space-y-3 list-disc pl-4">
                <li>
                  <span className="text-foreground font-medium">Only Top 150 Witnesses</span> can run Validator Nodes.
                </li>
                <li>
                  Storage nodes can choose to connect to any active Witness Gateway.
                </li>
                <li>
                  Witnesses compete to provide the best connectivity and reliable HBD payouts.
                </li>
              </ul>
            </CardContent>
          </Card>

           <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Global Network Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Active Witnesses</span>
                  <span className="font-bold">14 / 150</span>
                </div>
                <Progress value={9} className="h-2" />
              </div>
              <div className="space-y-2">
                 <div className="flex justify-between text-xs">
                  <span>Total Storage Payouts (24h)</span>
                  <span className="font-bold text-green-500">4,250 HBD</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
