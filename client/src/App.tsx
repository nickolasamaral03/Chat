import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import ChatConfig from "@/pages/ChatConfig";
import QRCodeGenerator from "@/pages/QRCodeGenerator";
import ChatInstance from "@/pages/ChatInstance";
import ResponsesManager from "@/pages/ResponsesManager";
import Support from "@/pages/Support";
import Login from "@/pages/Login";
import { AuthProvider } from "@/context/AuthContext";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={Dashboard} />
      <Route path="/config/:id" component={ChatConfig} />
      <Route path="/responses/:id" component={ResponsesManager} />
      <Route path="/qrcode/:id" component={QRCodeGenerator} />
      <Route path="/chat/:token" component={ChatInstance} />
      <Route path="/support" component={Support} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
