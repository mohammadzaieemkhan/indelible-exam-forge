
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import GoogleIcon from "@/components/icons/GoogleIcon";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    // Check if already logged in
    if (localStorage.getItem("userData")) {
      navigate("/dashboard");
    }

    // Check if we need to create a default account for testing
    const accounts = JSON.parse(localStorage.getItem("accounts") || "[]");
    if (accounts.length === 0) {
      // Create a default test account
      const defaultAccount = {
        name: "Test User",
        email: "test@example.com",
        password: "password",
        role: "Student"
      };
      
      localStorage.setItem("accounts", JSON.stringify([defaultAccount]));
      toast({
        title: "Test Account Created",
        description: "Email: test@example.com, Password: password"
      });
    }
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!email || !password) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all fields.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real app, this would be an API call
      // For now, we'll just simulate a login
      // Retrieve existing accounts to check
      const accounts = JSON.parse(localStorage.getItem("accounts") || "[]");
      const account = accounts.find((acc) => acc.email === email);
      
      if (!account || account.password !== password) {
        toast({
          title: "Login Failed",
          description: "Invalid email or password. Please try again.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      // Successful login
      const userData = {
        name: account.name,
        email: account.email,
        phone: account.phone || "+1234567890", 
        role: account.role || "Student"
      };
      
      // Save to localStorage
      localStorage.setItem("userData", JSON.stringify(userData));
      
      // Trigger storage event for other components
      window.dispatchEvent(new Event("storage"));
      
      toast({
        title: "Login Successful",
        description: "Welcome back! You have successfully logged in."
      });
      
      // Navigate to dashboard
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    toast({
      title: "Google Login",
      description: "Google login functionality will be implemented soon."
    });
  };

  return (
    <div className="container flex items-center justify-center min-h-[80vh] px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Enter your credentials to sign in to your account
          </p>
          <p className="text-sm text-muted-foreground">
            Use email: <strong>test@example.com</strong> and password: <strong>password</strong>
          </p>
        </div>
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                placeholder="your.email@example.com" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link 
                  to="#"
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input 
                id="password" 
                placeholder="••••••••" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            type="button" 
            className="w-full" 
            onClick={handleGoogleLogin}
          >
            <GoogleIcon className="mr-2 h-4 w-4" />
            Google
          </Button>
          
          <div className="text-center text-sm">
            Don't have an account?{" "}
            <Link 
              to="/signup"
              className="text-primary underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
