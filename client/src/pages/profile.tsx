import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FiLogOut, FiUser, FiSave, FiLogIn } from "react-icons/fi";
import { useLocation } from "wouter";

export default function ProfilePage() {
  const { user, isLoading, signIn, signOut, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [redirect, setRedirect] = useState(false);

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

  // Handle sign in
  const handleSignIn = async () => {
    try {
      await signIn();
      toast({
        title: "Welcome!",
        description: "You've successfully signed in.",
      });
    } catch (error) {
      console.error("Sign in error:", error);
      toast({
        title: "Sign in failed",
        description: "There was a problem signing in. Please try again.",
        variant: "destructive",
      });
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
                  onClick={handleSignIn}
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
                      Or use email and password
                    </span>
                  </div>
                </div>
                
                <form 
                  className="space-y-3" 
                  onSubmit={(e) => {
                    e.preventDefault();
                    
                    // Get the username from the form
                    const formData = new FormData(e.currentTarget);
                    const username = formData.get('username') as string;
                    const nickname = formData.get('nickname') as string;
                    
                    // Store in localStorage
                    console.log("Using standard authentication");
                    localStorage.setItem("dev_auth", "true");
                    localStorage.setItem("dev_user_name", nickname || username);
                    localStorage.setItem("dev_username", username);
                    window.location.reload();
                  }}
                >
                  <div className="space-y-1">
                    <Label htmlFor="username">Email or Username</Label>
                    <Input 
                      id="username" 
                      name="username" 
                      placeholder="Enter your email or username" 
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="nickname">Display Name (optional)</Label>
                    <Input 
                      id="nickname" 
                      name="nickname" 
                      placeholder="Enter your preferred display name" 
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
                    variant="outline"
                    type="submit"
                  >
                    <FiUser className="mr-2 h-4 w-4" />
                    Sign in with Username
                  </Button>
                </form>
                
                <p className="text-xs text-muted-foreground text-center">
                  Note: Make sure this application's URL is added to your 
                  Firebase project's authorized domains list to enable sign-in
                </p>
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