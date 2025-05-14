
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Menu, X, BookOpen, User, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<{name?: string; email?: string} | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      // First check with Supabase
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        // Get user details from Supabase
        const { user } = data.session;
        setIsAuthenticated(true);
        setUserProfile({
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          email: user.email
        });
        return;
      }
      
      // Fallback to localStorage for backward compatibility
      const userJson = localStorage.getItem('userData');
      if (userJson) {
        try {
          const userData = JSON.parse(userJson);
          setIsAuthenticated(true);
          setUserProfile(userData);
        } catch (e) {
          setIsAuthenticated(false);
          setUserProfile(null);
        }
      } else {
        setIsAuthenticated(false);
        setUserProfile(null);
      }
    };
    
    checkAuth();
    
    // Listen for auth changes
    const authListener = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
        setUserProfile({
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email
        });
        
        // Store in localStorage for other components
        const userData = {
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email,
          phone: session.user.phone || "",
          role: session.user.user_metadata?.role || "Student"
        };
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // Dispatch storage event for other components
        window.dispatchEvent(new Event('storage'));
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUserProfile(null);
        localStorage.removeItem('userData');
        window.dispatchEvent(new Event('storage'));
      }
    });
    
    // Listen for storage changes
    const storageChangeHandler = () => {
      const userJson = localStorage.getItem('userData');
      if (userJson) {
        try {
          const userData = JSON.parse(userJson);
          setIsAuthenticated(true);
          setUserProfile(userData);
        } catch (e) {
          setIsAuthenticated(false);
          setUserProfile(null);
        }
      } else {
        setIsAuthenticated(false);
        setUserProfile(null);
      }
    };
    
    window.addEventListener('storage', storageChangeHandler);
    
    return () => {
      // Clean up listeners
      authListener.data.subscription.unsubscribe();
      window.removeEventListener('storage', storageChangeHandler);
    };
  }, []);
  
  // Handle logout
  const handleLogout = async () => {
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        title: "Logout Failed",
        description: error.message,
        variant: "destructive"
      });
      return;
    }
    
    // Clear local storage
    localStorage.removeItem('userData');
    
    // Update state
    setIsAuthenticated(false);
    setUserProfile(null);
    
    // Show toast
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully"
    });
    
    // Navigate to home
    navigate('/');
  };
  
  const navItems = [
    { name: "Home", path: "/" },
    { name: "Dashboard", path: "/dashboard" },
    { name: "About", path: "/about" },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full backdrop-blur-lg bg-background/80 border-b border-border">
      <div className="container mx-auto px-3 sm:px-4 md:px-6">
        <div className="flex justify-between items-center h-14 md:h-16">
          <div className="flex items-center">
            <Link to="/" className="flex gap-1.5 md:gap-2 items-center">
              <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              <span className="text-lg md:text-xl font-semibold">Indelible AI</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4 md:space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="nav-link px-2 md:px-3 py-2 text-sm font-medium"
              >
                {item.name}
              </Link>
            ))}
            
            <div className="ml-4 md:ml-6 flex items-center gap-3 md:gap-4">
              <ThemeToggle />
              
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <User className="h-5 w-5" />
                      <span className="sr-only">Profile</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      {userProfile?.name || 'User'}
                      {userProfile?.email && <p className="text-xs text-muted-foreground">{userProfile.email}</p>}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-500" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/login">
                  <Button className="rounded-full text-xs md:text-sm py-1 md:py-2 px-3 md:px-4">Sign In</Button>
                </Link>
              )}
            </div>
          </div>
          
          <div className="md:hidden flex items-center">
            <ThemeToggle />
            {isAuthenticated && (
              <Button variant="ghost" size="icon" className="ml-1">
                <User className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              className="ml-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border animate-fade-in">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-accent"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-accent">
                  Profile
                </Link>
                <button 
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-500 hover:bg-accent mt-2"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full mt-4">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
