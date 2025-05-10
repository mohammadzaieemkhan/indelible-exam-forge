
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Menu, X, BookOpen, User } from "lucide-react";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Mock auth state - in a real application, this would come from your auth context
  const isAuthenticated = false;
  
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
                <Link to="/profile">
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                    <span className="sr-only">Profile</span>
                  </Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button className="rounded-full text-xs md:text-sm py-1 md:py-2 px-3 md:px-4">Sign In</Button>
                </Link>
              )}
            </div>
          </div>
          
          <div className="md:hidden flex items-center">
            <ThemeToggle />
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
            
            {!isAuthenticated && (
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
