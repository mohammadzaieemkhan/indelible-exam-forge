
import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AboutPage from "./pages/AboutPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import { supabase } from "./integrations/supabase/client";

// Create a new QueryClient instance
const queryClient = new QueryClient();

// Remove mock login setup as we're using real authentication now
// const setupMockLogin = () => {
//   // Check if we already have mock user data
//   if (typeof window !== 'undefined' && !localStorage.getItem("userData")) {
//     // Create default user data for demo
//     const mockUserData = {
//       name: "Test User",
//       email: "user@example.com",
//       phone: "+1234567890",
//       role: "Student"
//     };
//     localStorage.setItem("userData", JSON.stringify(mockUserData));
//   }
// };
// setupMockLogin();

const App = () => {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Check for active session on load
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (data.session?.user) {
          const userData = {
            name: data.session.user.user_metadata?.name || data.session.user.email?.split('@')[0] || 'User',
            email: data.session.user.email,
            phone: data.session.user.phone || "",
            role: data.session.user.user_metadata?.role || "Student"
          };
          
          localStorage.setItem("userData", JSON.stringify(userData));
          window.dispatchEvent(new Event("storage"));
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setInitializing(false);
      }
    };
    
    checkSession();
  }, []);

  if (initializing) {
    return <div className="h-screen w-screen flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
    </div>;
  }

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="indelible-theme">
          <BrowserRouter>
            <TooltipProvider>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
              <Sonner />
            </TooltipProvider>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
