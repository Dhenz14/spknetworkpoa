import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, HardDrive, Server, Shield, CheckCircle2, Clock, Zap, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

// Types for our PoA simulation
type ChallengeStage = 'idle' | 'challenging' | 'verifying' | 'rewarding';

export default function NodeStatus() {
  const [stage, setStage] = useState<ChallengeStage>('idle');
  const [lastProof, setLastProof] = useState<Date>(new Date());
  const [challengeCount, setChallengeCount] = useState(1240);
  const [logs, setLogs] = useState<string[]>([
    "[INFO] Node initialized. Listening for challenges...",
  ]);

  // Simulate the PoA Cycle
  useEffect(() => {
    const cycle = async () => {
      // 1. Idle -> Challenging
      await wait(4000);
      setStage('challenging');
      addLog("[INFO] Incoming Challenge: Block #849201 from Validator");

      // 2. Challenging -> Verifying (Node fetching data)
      await wait(2000);
      setStage('verifying');
      addLog("[INFO] Retrieving chunk QmX7...9jK from IPFS Store...");
      
      // 3. Verifying -> Rewarding
      await wait(1500);
      setStage('rewarding');
      addLog("[SUCCESS] Proof Submitted. Hash: 0x8f...2a");
      addLog("[PAYMENT] HBD Reward Incoming: 0.050 HBD");
      setChallengeCount(p => p + 1);
      setLastProof(new Date());

      // 4. Back to Idle
      await wait(2000);
      setStage('idle');
      addLog("[INFO] Waiting for next challenge...");
    };

    const interval = setInterval(() => {
      if (stage === 'idle') cycle();
    }, 10000); // Run cycle every 10 seconds for demo purposes

    return () => clearInterval(interval);
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 10));
  };

  const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto flex flex-col h-[calc(100vh-64px)]">
      <div>
        <h1 className="text-3xl font-display font-bold">Proof of Access Protocol</h1>
        <p className="text-muted-foreground mt-1">Real-time visualization of storage validation and HBD rewards</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Visualizer */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 bg-black/40 backdrop-blur-xl h-[400px] relative overflow-hidden flex flex-col items-center justify-center">
             {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)] pointer-events-none" />
            
            <div className="relative z-10 w-full max-w-2xl px-12 flex justify-between items-center">
              
              {/* Validator Node */}
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-2xl bg-primary/10 border-2 border-primary/50 flex items-center justify-center relative shadow-[0_0_30px_rgba(227,19,55,0.2)]">
                  <Shield className="w-10 h-10 text-primary" />
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
                </div>
                <div className="text-center">
                  <h3 className="font-display font-bold text-lg">Trole Validator</h3>
                  <p className="text-xs text-muted-foreground font-mono">192.168.1.1</p>
                </div>
              </div>

              {/* Connection Line */}
              <div className="flex-1 h-[2px] bg-white/10 relative mx-8">
                <AnimatePresence>
                  {stage !== 'idle' && (
                    <motion.div 
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full shadow-[0_0_15px_currentColor]",
                        stage === 'challenging' ? "bg-yellow-500 text-yellow-500" : 
                        stage === 'verifying' ? "bg-blue-500 text-blue-500" : "bg-green-500 text-green-500"
                      )}
                      initial={{ left: "0%" }}
                      animate={{ 
                        left: stage === 'challenging' ? "100%" : 
                              stage === 'verifying' ? "0%" : "100%" 
                      }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Your Node */}
              <div className="flex flex-col items-center gap-4">
                <div className={cn(
                  "w-24 h-24 rounded-2xl border-2 flex items-center justify-center relative transition-all duration-500",
                  stage === 'verifying' ? "bg-blue-500/20 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]" : "bg-card border-border"
                )}>
                  <Database className={cn(
                    "w-10 h-10 transition-colors",
                    stage === 'verifying' ? "text-blue-500" : "text-muted-foreground"
                  )} />
                </div>
                <div className="text-center">
                  <h3 className="font-display font-bold text-lg">Your Node</h3>
                  <p className="text-xs text-muted-foreground font-mono">12D3...8kL</p>
                </div>
              </div>

            </div>

            {/* Status Text */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
              <Badge variant="outline" className={cn(
                "px-4 py-1.5 text-sm font-mono border",
                stage === 'idle' && "border-white/20 text-muted-foreground",
                stage === 'challenging' && "border-yellow-500/50 text-yellow-500 bg-yellow-500/10",
                stage === 'verifying' && "border-blue-500/50 text-blue-500 bg-blue-500/10",
                stage === 'rewarding' && "border-green-500/50 text-green-500 bg-green-500/10",
              )}>
                STATUS: {stage.toUpperCase()}
              </Badge>
            </div>
          </Card>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <MetricCard 
              label="Total Proofs" 
              value={challengeCount.toLocaleString()} 
              icon={CheckCircle2} 
              color="text-green-500" 
            />
            <MetricCard 
              label="Success Rate" 
              value="99.8%" 
              icon={Activity} 
              color="text-blue-500" 
            />
            <MetricCard 
              label="Last Proof" 
              value="Just now" 
              icon={Clock} 
              color="text-orange-500" 
            />
          </div>
        </div>

        {/* Right Column: Technical Logs */}
        <Card className="border-border/50 bg-black/80 backdrop-blur-md flex flex-col h-full font-mono text-xs">
          <CardHeader className="py-3 px-4 border-b border-white/10 bg-white/5">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-3 h-3 text-yellow-500" />
              PoA Protocol Stream
            </CardTitle>
          </CardHeader>
          <div className="flex-1 p-4 overflow-hidden relative">
            <div className="absolute inset-0 p-4 space-y-3 overflow-y-auto">
              {logs.map((log, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-2"
                >
                  <span className="text-muted-foreground opacity-50">
                    {new Date().toLocaleTimeString()}
                  </span>
                  <span className={cn(
                    log.includes("[SUCCESS]") ? "text-green-400" : 
                    log.includes("[PAYMENT]") ? "text-yellow-400 font-bold" :
                    log.includes("[INFO]") ? "text-blue-300" : "text-gray-300"
                  )}>
                    {log}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color }: any) {
  return (
    <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={cn("p-2 rounded-lg bg-white/5", color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
          <p className="text-xl font-bold font-display">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
