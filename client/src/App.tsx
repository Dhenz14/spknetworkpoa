import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NodeConfigProvider } from "@/contexts/NodeConfigContext";
import { AlertsProvider } from "@/components/AlertsProvider";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout/Layout";
import Dashboard from "@/pages/dashboard";
import Storage from "@/pages/storage";
import Browse from "@/pages/browse";
import Connect from "@/pages/connect";
import Wallet from "@/pages/wallet";
import NodeStatus from "@/pages/node";
import ValidatorSettings from "@/pages/settings";
import Validators from "@/pages/validators";
import Download from "@/pages/download";
import Earnings from "@/pages/earnings";
import Marketplace from "@/pages/marketplace";
import Analytics from "@/pages/analytics";
import ValidatorDashboard from "@/pages/validator-dashboard";
import NodeMonitoring from "@/pages/node-monitoring";
import ChallengeQueue from "@/pages/challenge-queue";
import FraudDetection from "@/pages/fraud-detection";
import generatedImage from '@assets/generated_images/a_dark,_futuristic_abstract_mesh_background_with_red_accents..png';

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/storage" component={Storage} />
        <Route path="/browse" component={Browse} />
        <Route path="/connect" component={Connect} />
        <Route path="/wallet" component={Wallet} />
        <Route path="/node" component={NodeStatus} />
        <Route path="/settings" component={ValidatorSettings} />
        <Route path="/validators" component={Validators} />
        <Route path="/download" component={Download} />
        <Route path="/earnings" component={Earnings} />
        <Route path="/marketplace" component={Marketplace} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/validator-dashboard" component={ValidatorDashboard} />
        <Route path="/node-monitoring" component={NodeMonitoring} />
        <Route path="/challenge-queue" component={ChallengeQueue} />
        <Route path="/fraud-detection" component={FraudDetection} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NodeConfigProvider>
        <TooltipProvider>
          <AlertsProvider>
            {/* Background Image Layer */}
            <div className="fixed inset-0 z-[-1] opacity-20 pointer-events-none">
               <img src={generatedImage} alt="" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-background/90 mix-blend-multiply" />
            </div>
            
            <Toaster />
            <Router />
          </AlertsProvider>
        </TooltipProvider>
      </NodeConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
