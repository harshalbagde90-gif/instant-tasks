import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SharedTaskView from "./pages/SharedTaskView";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner
        position="top-right"
        closeButton
        toastOptions={{
          style: {
            background: '#FACC15', // Vibrant Yellow
            color: '#1a1a1a',      // Near black/Dark brown feel
            border: '1px solid #D4AF37',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: '11px',
            fontFamily: 'sans-serif'
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/share/:token" element={<SharedTaskView />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
