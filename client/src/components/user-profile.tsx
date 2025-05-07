import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export function UserProfile() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Debug state for development
  useEffect(() => {
    console.log("Auth state:", { user, isLoading });
  }, [user, isLoading]);

  // Navigate to profile page
  const navigateToProfile = () => {
    setLocation("/profile");
  };

  // If loading, show spinner
  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Loader2 className="h-5 w-5 animate-spin" />
      </Button>
    );
  }

  // If user is logged in, show their avatar
  if (user) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={navigateToProfile}
        title="View profile"
        className="rounded-full bg-white text-red-600 hover:bg-gray-100 border-2 border-white p-0 overflow-hidden"
      >
        <Avatar className="h-8 w-8">
          <AvatarImage 
            src={user.firebaseUser?.photoURL || undefined} 
            alt={user.backendUser.displayName || user.backendUser.username || "User"}
          />
          <AvatarFallback className="bg-white text-red-600 font-bold">
            {(user.backendUser.displayName || user.backendUser.username || "U")
              .charAt(0)
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Button>
    );
  }

  // If not logged in, show profile icon that navigates to profile page
  return (
    <Button 
      variant="ghost" 
      size="icon"
      onClick={navigateToProfile}
      title="Sign in"
      className="bg-white text-red-600 hover:bg-gray-100 rounded-full border-2 border-white flex items-center justify-center"
    >
      <User2 className="h-5 w-5" />
    </Button>
  );
}