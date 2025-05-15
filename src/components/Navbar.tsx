
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Menu, X, BookOpen, User, LogOut } from "lucide-react";
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
  
  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = () => {
      // For now we'll use localStorage until we have a real auth system
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
      }
    };
    
    checkAuth();
    
    // Listen for auth changes
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);
  
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('userData');
    setIsAuthenticated(false);
    setUserProfile(null);
    navigate('/');
    
    // Show a temporary toast (using alert for now)
    alert("You have been logged out successfully");
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
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
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
