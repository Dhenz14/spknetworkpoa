import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ShieldAlert, Key, Wallet, Save, AlertTriangle, Filter, Lock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";

export default function ValidatorSettings() {
  const { toast } = useToast();
  const [isSaved, setIsSaved] = useState(false);
  const [minRep, setMinRep] = useState([50]);

  const handleSave = () => {
    setIsSaved(true);
    toast({
      title: "Settings Saved",
      description: "Validator configuration updated. Hot wallet is active.",
    });
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold">Validator Configuration</h1>
        <p className="text-muted-foreground mt-1">Configure your node's payout settings and HBD treasury</p>
      </div>

      <div className="grid gap-6">
        
        {/* Audit Policy (Filtering) - NEW SECTION */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
           <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                <Filter className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Audit Policy</CardTitle>
                <CardDescription>Filter which storage nodes you are willing to audit & reward</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                  <Label>Minimum Node Reputation Score</Label>
                  <span className="font-mono font-bold text-primary">{minRep[0]}</span>
               </div>
               <Slider 
                 value={minRep} 
                 onValueChange={setMinRep} 
                 max={100} 
                 step={1} 
                 className="py-4"
               />
               <p className="text-xs text-muted-foreground">
                 Nodes with a reputation below {minRep[0]} will be ignored by your validator.
               </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="grid gap-2">
                  <Label>Required Stake (Collateral)</Label>
                  <div className="relative">
                     <Lock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                     <Input placeholder="0.00" className="pl-9 font-mono" defaultValue="10.00" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Min. HBD in node's savings</p>
               </div>
               <div className="grid gap-2">
                  <Label>Content Tag Filter</Label>
                  <Input placeholder="e.g. #hive, #threespeak" />
                  <p className="text-[10px] text-muted-foreground">Comma separated whitelist</p>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* HBD Treasury Settings */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Treasury & Payouts</CardTitle>
                <CardDescription>Configure the wallet that pays storage nodes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="account">Hive Account (Payer)</Label>
                <Input id="account" placeholder="e.g. @hive-validator" className="font-mono" />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="active-key" className="flex items-center justify-between">
                  <span>Active Private Key</span>
                  <span className="text-xs text-red-400 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    Required for transfers
                  </span>
                </Label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="active-key" type="password" placeholder="5K..." className="pl-9 font-mono" />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  This key is stored locally in your .env file and never transmitted except to sign transactions.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="grid gap-2">
                <Label>Payout Frequency</Label>
                <Select defaultValue="24h">
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">Every Hour</SelectItem>
                    <SelectItem value="24h">Every 24 Hours (Recommended)</SelectItem>
                    <SelectItem value="7d">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Minimum Payout</Label>
                <div className="relative">
                   <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">HBD</span>
                   <Input placeholder="1.00" className="pl-10 font-mono" defaultValue="0.50" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validator Logic Settings */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
           <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Validation Rules</CardTitle>
                <CardDescription>Set the strictness of your Proof of Access checks</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label className="text-base">Strict Latency Check</Label>
                <p className="text-xs text-muted-foreground">Reject proofs that take longer than 5 seconds</p>
              </div>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label className="text-base">Ban on Failure</Label>
                <p className="text-xs text-muted-foreground">Automatically ban nodes after 3 failed challenges</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label className="text-base">Consensus Mode</Label>
                <p className="text-xs text-muted-foreground">Wait for other validators (Disabled in Lite Mode)</p>
              </div>
              <Switch disabled />
            </div>
          </CardContent>
        </Card>

        {/* Warning Banner */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-yellow-500">Centralization Warning</h4>
            <p className="text-xs text-yellow-500/80 leading-relaxed">
              Running in <b>Lite Mode</b> makes you the sole authority. Ensure your node has high uptime. 
              If your node goes offline, storage providers will not be paid and may drop content.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline">Discard Changes</Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
            <Save className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
}
