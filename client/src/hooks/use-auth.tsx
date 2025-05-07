import { createContext, ReactNode, useContext, useEffect, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { auth, googleProvider } from "@/lib/firebase";
import { 
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut, 
  User as FirebaseUser, 
  onAuthStateChanged 
} from "firebase/auth";

// Backend user type from database
interface BackendUser {
  id: number;
  username: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
  firebaseUid: string;
}

// Combined auth user type with Firebase and backend data
export interface AuthUser {
  firebaseUser: FirebaseUser;
  backendUser: BackendUser;
}

// Profile update type
interface ProfileUpdate {
  displayName?: string;
  photoUrl?: string;
}

// Credentials interface for username/password login
interface LoginCredentials {
  username: string;
  password: string;
}

// Registration interface for creating new account
interface RegisterCredentials extends LoginCredentials {
  email?: string;
  displayName?: string;
}

// Auth context type definition
interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
  signIn: () => Promise<void>; // Google sign in
  loginWithCredentials: (credentials: LoginCredentials) => Promise<void>; // Username/password login
  registerWithCredentials: (credentials: RegisterCredentials) => Promise<void>; // Register new user
  signOut: () => Promise<void>;
  saveWordToList: (wordId: number) => Promise<void>;
  removeWordFromList: (wordId: number) => Promise<void>;
  updateUserProfile: (updates: ProfileUpdate) => Promise<void>;
}

// Create context with null default value
const AuthContext = createContext<AuthContextType | null>(null);

// Auth provider props type
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [firebaseLoading, setFirebaseLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState<Error | null>(null);
  
  // Development mode authentication
  const [devMode, setDevMode] = useState(false);
  const [devUser, setDevUser] = useState<BackendUser | null>(null);

  // Query to get backend user data
  const {
    data: backendUser,
    isLoading: backendLoading,
    error: backendError,
    refetch: refetchBackendUser,
  } = useQuery<BackendUser | null>({
    queryKey: ["/api/auth/user", firebaseUser?.uid],
    queryFn: async () => {
      if (!firebaseUser) return null;
      
      try {
        // Get Firebase ID token
        const idToken = await firebaseUser.getIdToken();
        
        // Fetch user data from backend
        const response = await fetch("/api/auth/user", {
          headers: {
            Authorization: `Bearer ${idToken}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            return null; // Not authenticated with backend yet
          }
          throw new Error("Failed to fetch user data");
        }
        
        return response.json();
      } catch (error) {
        console.error("Error fetching backend user:", error);
        return null;
      }
    },
    enabled: !!firebaseUser,
  });

  // Register or login user with backend
  const registerOrLoginWithBackend = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      console.log("Registering user with backend:", firebaseUser.email);
      // Get user token
      const idToken = await firebaseUser.getIdToken();
      
      // Register/login with backend
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
          username: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || `user${Date.now()}`,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoUrl: firebaseUser.photoURL,
          firebaseUid: firebaseUser.uid
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to register user with backend");
      }
      
      console.log("Successfully registered with backend, refreshing data");
      
      // Fetch the updated user data
      await refetchBackendUser();
      
      toast({
        title: "Welcome!",
        description: "You have successfully signed in.",
      });
      
      return true;
    } catch (error) {
      console.error("Backend registration error:", error);
      toast({
        title: "Sign in failed",
        description: "There was a problem signing in. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  }, [refetchBackendUser, toast]);

  // Listen for Firebase auth state changes
  useEffect(() => {
    console.log("Setting up Firebase auth state listener");
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        console.log("Firebase auth state changed:", user ? "User authenticated" : "No user");
        setFirebaseUser(user);
        setFirebaseLoading(false);
        
        // If user is authenticated, immediately refetch backend data
        if (user) {
          console.log("User authenticated, refreshing data");
          setTimeout(() => {
            refetchBackendUser();
            queryClient.invalidateQueries({ queryKey: ["/api/auth/wordlist"] });
          }, 500); // Small delay to ensure Firebase auth is fully processed
        }
      },
      (error) => {
        console.error("Firebase auth error:", error);
        setFirebaseError(error);
        setFirebaseLoading(false);
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, [queryClient, refetchBackendUser]);

  // Check for redirect result on component mount
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        console.log("Checking redirect result...");
        // Create a periodic check for redirect result
        let checkCount = 0;
        const maxChecks = 5;
        
        // First immediate check
        const result = await getRedirectResult(auth);
        console.log("Redirect result:", result);
        
        if (result && result.user) {
          console.log("Got user from redirect:", result.user);
          await registerOrLoginWithBackend(result.user);
          queryClient.invalidateQueries({ queryKey: ["/api/auth/wordlist"] });
          // Force refresh user data
          await refetchBackendUser();
          console.log("User data refreshed after redirect");
          return; // Successfully handled redirect
        }
        
        // If no result on first try, set up periodic checks
        // This helps when redirect completes but result isn't immediately available
        const checkInterval = setInterval(async () => {
          checkCount++;
          console.log(`Checking redirect result (attempt ${checkCount})...`);
          
          try {
            const retryResult = await getRedirectResult(auth);
            if (retryResult && retryResult.user) {
              console.log("Got user from redirect (retry):", retryResult.user);
              clearInterval(checkInterval);
              
              await registerOrLoginWithBackend(retryResult.user);
              queryClient.invalidateQueries({ queryKey: ["/api/auth/wordlist"] });
              await refetchBackendUser();
              console.log("User data refreshed after redirect");
            } else if (checkCount >= maxChecks) {
              console.log("Max redirect checks reached, giving up");
              clearInterval(checkInterval);
            }
          } catch (err) {
            console.error("Error in redirect check:", err);
            clearInterval(checkInterval);
          }
        }, 1000);
        
        // Clean up the interval if component unmounts
        return () => clearInterval(checkInterval);
      } catch (error) {
        console.error("Redirect sign in error:", error);
      }
    };
    
    checkRedirectResult();
  }, [queryClient, refetchBackendUser, registerOrLoginWithBackend]);
  
  // Sign in with Google
  const signIn = async () => {
    try {
      console.log("Starting Google sign in with redirect");
      setFirebaseLoading(true);
      
      // Add URL to authorized domains message
      const currentUrl = window.location.origin;
      console.log(`Important: Make sure ${currentUrl} is added to authorized domains in Firebase console`);
      
      // Add debug log for Firebase config
      console.log("Firebase config check:", {
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? "✓" : "✗",
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? "✓" : "✗", 
        appId: import.meta.env.VITE_FIREBASE_APP_ID ? "✓" : "✗"
      });
      
      // Use redirect method directly as it's more reliable
      googleProvider.setCustomParameters({
        prompt: "select_account",
        login_hint: "user@example.com"
      });
      
      await signInWithRedirect(auth, googleProvider);
      // Note: The redirect will take the user away from the page,
      // and they'll be redirected back after authentication
    } catch (error) {
      console.error("Sign in error:", error);
      toast({
        title: "Sign in failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      setFirebaseLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      console.log("Signing out...");
      await firebaseSignOut(auth);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/wordlist"] });
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Sign out failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Save word to user's list
  const saveWordToList = async (wordId: number) => {
    const effectiveBackendUser = devMode ? devUser : backendUser;
    
    if (!effectiveBackendUser) {
      toast({
        title: "Not signed in",
        description: "You need to sign in to save words to your list.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // In dev mode, just simulate API success and store word in local storage
      if (devMode) {
        console.log(`[Dev mode] Saving word ${wordId} to user's list`);
        
        // Get current saved words from localStorage
        const savedWordsStr = localStorage.getItem('dev_saved_words') || '[]';
        const savedWords = JSON.parse(savedWordsStr);
        
        // Add new word if not already saved
        if (!savedWords.includes(wordId)) {
          savedWords.push(wordId);
          localStorage.setItem('dev_saved_words', JSON.stringify(savedWords));
        }
        
        // Invalidate queries to refresh the UI
        queryClient.invalidateQueries({ queryKey: ["/api/auth/wordlist"] });
        
        toast({
          title: "Word saved",
          description: "Word has been added to your list (dev mode).",
        });
        
        return;
      }
      
      // Regular API call for non-dev mode
      const response = await fetch(`/api/auth/wordlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: effectiveBackendUser.id,
          wordId,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to save word to list");
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/auth/wordlist"] });
      
      toast({
        title: "Word saved",
        description: "Word has been added to your list.",
      });
    } catch (error) {
      console.error("Save word error:", error);
      toast({
        title: "Failed to save word",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Remove word from user's list
  const removeWordFromList = async (wordId: number) => {
    const effectiveBackendUser = devMode ? devUser : backendUser;
    
    if (!effectiveBackendUser) {
      toast({
        title: "Not signed in",
        description: "You need to sign in to remove words from your list.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // In dev mode, just simulate API success and update localStorage
      if (devMode) {
        console.log(`[Dev mode] Removing word ${wordId} from user's list`);
        
        // Get current saved words from localStorage
        const savedWordsStr = localStorage.getItem('dev_saved_words') || '[]';
        let savedWords = JSON.parse(savedWordsStr);
        
        // Remove word if it exists
        savedWords = savedWords.filter((id: number) => id !== wordId);
        localStorage.setItem('dev_saved_words', JSON.stringify(savedWords));
        
        // Invalidate queries to refresh the UI
        queryClient.invalidateQueries({ queryKey: ["/api/auth/wordlist"] });
        
        toast({
          title: "Word removed",
          description: "Word has been removed from your list (dev mode).",
        });
        
        return;
      }
      
      // Regular API call for non-dev mode
      const response = await fetch(`/api/auth/wordlist`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: effectiveBackendUser.id,
          wordId,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to remove word from list");
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/auth/wordlist"] });
      
      toast({
        title: "Word removed",
        description: "Word has been removed from your list.",
      });
    } catch (error) {
      console.error("Remove word error:", error);
      toast({
        title: "Failed to remove word",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Update user profile
  const updateUserProfile = async (updates: ProfileUpdate) => {
    const effectiveFirebaseUser = firebaseUser;
    const effectiveBackendUser = devMode ? devUser : backendUser;
    
    if ((!effectiveFirebaseUser && !devMode) || !effectiveBackendUser) {
      toast({
        title: "Not signed in",
        description: "You need to sign in to update your profile.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Handle dev mode profile updates
      if (devMode && devUser) {
        console.log("[Dev mode] Updating profile:", updates);
        
        // Update the dev user state with the new display name
        const updatedDevUser = {
          ...devUser,
          displayName: updates.displayName || devUser.displayName,
          photoUrl: updates.photoUrl || devUser.photoUrl
        };
        
        // Save to localStorage for persistence
        localStorage.setItem('dev_user_name', updatedDevUser.displayName || 'Dev User');
        
        // Update state
        setDevUser(updatedDevUser);
        
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully (dev mode).",
        });
        
        return;
      }
      
      // Normal flow for Firebase users
      // Get Firebase ID token
      const idToken = await effectiveFirebaseUser!.getIdToken();
      
      // Update user profile in backend
      const response = await fetch("/api/auth/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update profile");
      }
      
      // Refetch user data
      await refetchBackendUser();
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Update profile error:", error);
      toast({
        title: "Failed to update profile",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Combine user data from Firebase and backend
  const combinedUser = firebaseUser && backendUser
    ? { firebaseUser, backendUser }
    : null;

  // Check for development auth mode
  useEffect(() => {
    const isDevAuth = localStorage.getItem('dev_auth') === 'true';
    const devUserName = localStorage.getItem('dev_user_name') || 'Dev User';
    const devUsername = localStorage.getItem('dev_username') || 'dev_user';
    
    if (isDevAuth && !devUser) {
      console.log("Using development authentication mode");
      setDevMode(true);
      
      // Create a mock development user
      const mockUser: BackendUser = {
        id: 9999,
        username: devUsername,
        email: devUsername.includes('@') ? devUsername : `${devUsername}@example.com`,
        displayName: devUserName,
        photoUrl: null,
        firebaseUid: "dev-firebase-uid",
      };
      
      setDevUser(mockUser);
      
      toast({
        title: "Development Mode Active",
        description: "Using development authentication for testing.",
      });
    }
  }, [devUser, toast]);
  
  // Development mode is now handled by the async devSignOut function
  
  // Create the combined user for dev mode
  const effectiveUser = devMode && devUser 
    ? { 
        backendUser: devUser,
        firebaseUser: null as any // Type workaround for dev mode
      } 
    : (combinedUser || null);
    
  // Dev mode alternative functions
  const devSignIn = async (): Promise<void> => {
    console.log("Dev mode sign in - no action needed");
    return Promise.resolve();
  };
  
  const devSignOut = async (): Promise<void> => {
    console.log("Dev mode sign out");
    localStorage.removeItem('dev_auth');
    localStorage.removeItem('dev_user_name');
    localStorage.removeItem('dev_username');
    localStorage.removeItem('dev_saved_words');
    setDevMode(false);
    setDevUser(null);
    
    // Clear any data
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    queryClient.invalidateQueries({ queryKey: ["/api/auth/wordlist"] });
    
    toast({
      title: "Signed out",
      description: "Development mode deactivated.",
    });
    
    window.location.reload();
    return Promise.resolve();
  };
  
  // Create the auth context value with dev mode support
  const authContextValue: AuthContextType = {
    user: effectiveUser,
    isLoading: !devMode && (firebaseLoading || backendLoading),
    error: firebaseError || backendError || null,
    signIn: devMode ? devSignIn : signIn,
    signOut: devMode ? devSignOut : signOut,
    saveWordToList,
    removeWordFromList,
    updateUserProfile,
  };

  // Log auth state for debugging
  useEffect(() => {
    console.log("Auth context updated:", {
      user: effectiveUser ? "authenticated" : "unauthenticated",
      firebaseUser: firebaseUser ? "authenticated" : "unauthenticated",
      backendUser: backendUser ? "found" : "not found",
      devMode: devMode ? "active" : "inactive",
      devUser: devUser ? "active" : "inactive",
      isLoading: !devMode && (firebaseLoading || backendLoading),
    });
  }, [effectiveUser, firebaseUser, backendUser, devMode, devUser, firebaseLoading, backendLoading]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}