
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, Shield, Calendar } from "lucide-react";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
  dob?: string;
}

const ProfilePage = () => {
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    phone: "",
    role: "Student",
    dob: ""
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("userData");
    if (!userData) {
      navigate("/login");
      return;
    }
    
    setIsAuthenticated(true);
    
    try {
      const parsedData = JSON.parse(userData);
      // Merge with any existing data
      setProfile(prev => ({
        ...prev,
        ...parsedData
      }));
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }, [navigate]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSaveProfile = () => {
    // Save to localStorage
    localStorage.setItem("userData", JSON.stringify(profile));
    
    // Update accounts storage with the updated profile data
    const accounts = JSON.parse(localStorage.getItem("accounts") || "[]");
    const updatedAccounts = accounts.map(acc => {
      if (acc.email === profile.email) {
        return {
          ...acc,
          name: profile.name,
          phone: profile.phone,
          dob: profile.dob
        };
      }
      return acc;
    });
    localStorage.setItem("accounts", JSON.stringify(updatedAccounts));
    
    // Update localStorage events for other components
    window.dispatchEvent(new Event("storage"));
    
    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully."
    });
    
    setIsEditing(false);
  };
  
  if (!isAuthenticated) {
    return null; // Will redirect to login page in useEffect
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
        
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3">
            <TabsTrigger value="personal">Personal Information</TabsTrigger>
            <TabsTrigger value="account">Account Settings</TabsTrigger>
            <TabsTrigger value="preferences" className="hidden md:block">Preferences</TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="name">Full Name</Label>
                    </div>
                    <Input 
                      id="name" 
                      name="name"
                      placeholder="Your full name" 
                      value={profile.name} 
                      onChange={handleChange} 
                      disabled={!isEditing} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="email">Email Address</Label>
                    </div>
                    <Input 
                      id="email" 
                      name="email"
                      type="email" 
                      placeholder="your.email@example.com" 
                      value={profile.email} 
                      onChange={handleChange} 
                      disabled={true} 
                      className="bg-muted cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">Email address cannot be changed</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="phone">Phone Number</Label>
                    </div>
                    <Input 
                      id="phone" 
                      name="phone"
                      placeholder="+1234567890" 
                      value={profile.phone} 
                      onChange={handleChange} 
                      disabled={!isEditing} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="dob">Date of Birth</Label>
                    </div>
                    <Input 
                      id="dob" 
                      name="dob"
                      type="date" 
                      value={profile.dob || ''} 
                      onChange={handleChange} 
                      disabled={!isEditing} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Shield className="mr-2 h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="role">Role</Label>
                    </div>
                    <Input 
                      id="role" 
                      name="role"
                      placeholder="Your role" 
                      value={profile.role} 
                      onChange={handleChange} 
                      disabled={true}
                      className="bg-muted cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">Roles can only be changed by administrators</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button onClick={handleSaveProfile}>Save Changes</Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email Notifications</Label>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="exam-notifications" className="rounded border-gray-300" />
                      <label htmlFor="exam-notifications" className="text-sm">Exam reminders</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="result-notifications" className="rounded border-gray-300" />
                      <label htmlFor="result-notifications" className="text-sm">Exam results</label>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button variant="destructive">Delete Account</Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      This will permanently delete your account and all associated data.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Preferences</CardTitle>
                <CardDescription>
                  Customize your experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center py-4 text-muted-foreground">
                  Preference settings coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;
