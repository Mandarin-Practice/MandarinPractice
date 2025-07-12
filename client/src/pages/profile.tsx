import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FiLogOut, FiUser, FiSave, FiLogIn, FiUserPlus } from "react-icons/fi";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProfilePage() {
  const { user, isLoading, signIn, signOut, updateUserProfile, loginWithCredentials, registerWithCredentials } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Debug user state
  useEffect(() => {
    console.log("Profile page - Auth state:", { user, isLoading });
  }, [user, isLoading]);

  // Load user display name when user data changes
  useEffect(() => {
    if (user?.backendUser?.displayName) {
      setDisplayName(user.backendUser.displayName);
    }
  }, [user]);

  // Google sign in is handled directly by the signIn function from useAuth

  // Handle username/password sign in
  const handleCredentialSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const username = formData.get('username') as string;
      const password = formData.get('password') as string;
      
      await loginWithCredentials({ username, password });
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "Invalid username or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle new user registration
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const username = formData.get('reg_username') as string;
      const password = formData.get('reg_password') as string;
      const email = formData.get('reg_email') as string || undefined;
      const displayName = formData.get('reg_display_name') as string || undefined;
      
      await registerWithCredentials({ 
        username, 
        password,
        email,
        displayName
      });
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: "This username may already be taken. Please try another.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You've been signed out successfully.",
      });
      // Redirect to home page after sign out
      setRedirect(true);
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Sign out failed",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle updating display name
  const handleUpdateDisplayName = async () => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      await updateUserProfile({ displayName });
      toast({
        title: "Profile updated",
        description: "Your display name has been updated successfully.",
      });
    } catch (error) {
      console.error("Update profile error:", error);
      toast({
        title: "Update failed",
        description: "There was a problem updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Use the useLocation hook for navigation
  const [, setLocation] = useLocation();
  
  // If redirecting, go to home page
  useEffect(() => {
    if (redirect) {
      setLocation("/");
    }
  }, [redirect, setLocation]);

  return (
    <div className="container max-w-md py-10">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Profile</CardTitle>
          {user ? (
            <CardDescription>
              Manage your account settings
            </CardDescription>
          ) : (
            <CardDescription>
              Sign in to save your progress
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : user ? (
            // Signed in user view
            <div className="space-y-6">
              {/* Email display */}
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="rounded-md border px-3 py-2 text-sm bg-muted">
                  {user.backendUser.email}
                </div>
              </div>
              
              {/* Display name input */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <div className="flex space-x-2">
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                  />
                  <Button 
                    onClick={handleUpdateDisplayName} 
                    disabled={isUpdating || !displayName}
                    size="icon"
                    title="Save display name"
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FiSave />}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Not signed in view
            <div className="space-y-4 py-4">
              <div className="text-center text-sm text-muted-foreground">
                Sign in to keep your word lists and progress synchronized across devices.
              </div>
              <div className="space-y-4">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={signIn}
                >
                  <FiLogIn className="mr-2 h-4 w-4" />
                  Sign in with Google
                </Button>
                
                {/* Standard username/password login */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or use username and password
                    </span>
                  </div>
                </div>
                
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login" className="mt-4">
                    <form className="space-y-3" onSubmit={handleCredentialSignIn}>
                      <div className="space-y-1">
                        <Label htmlFor="username">Username</Label>
                        <Input 
                          id="username" 
                          name="username" 
                          placeholder="Enter your username" 
                          required 
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="password">Password</Label>
                        <Input 
                          id="password" 
                          name="password" 
                          type="password" 
                          placeholder="Enter your password" 
                          required 
                        />
                      </div>
                      <Button 
                        className="w-full" 
                        type="submit"
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <FiUser className="mr-2 h-4 w-4" />
                        )}
                        Sign in
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="register" className="mt-4">
                    <form className="space-y-3" onSubmit={handleRegister}>
                      <div className="space-y-1">
                        <Label htmlFor="reg_username">Username</Label>
                        <Input 
                          id="reg_username" 
                          name="reg_username" 
                          placeholder="Choose a username" 
                          required 
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="reg_email">Email (optional)</Label>
                        <Input 
                          id="reg_email" 
                          name="reg_email" 
                          type="email"
                          placeholder="Enter your email" 
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="reg_display_name">Display Name</Label>
                        <Input 
                          id="reg_display_name" 
                          name="reg_display_name" 
                          placeholder="How others will see you" 
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="reg_password">Password</Label>
                        <Input 
                          id="reg_password" 
                          name="reg_password" 
                          type="password" 
                          placeholder="Choose a secure password" 
                          required 
                        />
                      </div>
                      <Button 
                        className="w-full" 
                        type="submit"
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <FiUserPlus className="mr-2 h-4 w-4" />
                        )}
                        Create Account
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </CardContent>
        
        {user && (
          <CardFooter>
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={handleSignOut}
            >
              <FiLogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}