import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, LogIn, LogOut, User2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export function UserProfile() {
  const { user, isLoading, signIn, signOut } = useAuth();
  const { toast } = useToast();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Debug state for development
  useEffect(() => {
    console.log("Auth state:", { user, isLoading });
  }, [user, isLoading]);

  // Handle sign in click
  const handleSignIn = async () => {
    try {
      await signIn();
      setLoginDialogOpen(false);
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "There was a problem signing in. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle sign out click
  const handleSignOut = async () => {
    try {
      setDropdownOpen(false); // Close dropdown first
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Sign out failed",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // If loading, show spinner
  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Loader2 className="h-5 w-5 animate-spin" />
      </Button>
    );
  }

  // If not logged in, show login button
  if (!user) {
    return (
      <>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setLoginDialogOpen(true)}
          title="Sign in"
          className="bg-white text-red-600 hover:bg-gray-100 rounded-full border-2 border-white flex items-center justify-center"
        >
          <User2 className="h-5 w-5" />
        </Button>
        
        <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Sign in to your account</DialogTitle>
              <DialogDescription>
                Sign in to save your word lists and track your progress across devices.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <Button 
                onClick={handleSignIn} 
                className="w-full max-w-sm"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                    <path d="M1 1h22v22H1z" fill="none" />
                  </svg>
                )}
                Sign in with Google
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Simple sign out button instead of dropdown to avoid issues
  return (
    <div className="flex items-center gap-2">
      {/* User avatar */}
      <Avatar className="h-8 w-8 bg-white border-2 border-white">
        <AvatarImage 
          src={user.firebaseUser.photoURL || undefined} 
          alt={user.backendUser.displayName || user.backendUser.username || "User"}
        />
        <AvatarFallback className="bg-white text-red-600 font-bold">
          {(user.backendUser.displayName || user.backendUser.username || "U")
            .charAt(0)
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      {/* Sign out button */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleSignOut}
        className="bg-white text-red-600 hover:bg-gray-100 border border-white"
      >
        <LogOut className="h-4 w-4 mr-1" />
        <span className="text-xs">Sign out</span>
      </Button>
    </div>
  );
}