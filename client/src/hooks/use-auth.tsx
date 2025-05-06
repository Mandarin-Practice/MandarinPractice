import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup, signOut as firebaseSignOut, User as FirebaseUser, onAuthStateChanged } from "firebase/auth";

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

// Auth context type definition
interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  saveWordToList: (wordId: number) => Promise<void>;
  removeWordFromList: (wordId: number) => Promise<void>;
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

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setFirebaseUser(user);
        setFirebaseLoading(false);
      },
      (error) => {
        setFirebaseError(error);
        setFirebaseLoading(false);
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Query to get backend user data
  const {
    data: backendUser,
    isLoading: backendLoading,
    error: backendError,
    refetch: refetchBackendUser,
  } = useQuery<BackendUser>({
    queryKey: ["/api/auth/user", firebaseUser?.uid],
    queryFn: async () => {
      if (!firebaseUser) return null;
      
      // Get Firebase ID token
      const idToken = await firebaseUser.getIdToken();
      
      // Fetch user data from backend
      const response = await fetch("/api/auth/user", {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      
      return response.json();
    },
    enabled: !!firebaseUser,
  });

  // Register or login user with backend
  const registerOrLoginWithBackend = async (firebaseUser: FirebaseUser) => {
    try {
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
      
      // Fetch the updated user data
      await refetchBackendUser();
      
      toast({
        title: "Welcome!",
        description: "You have successfully signed in.",
      });
    } catch (error) {
      console.error("Backend registration error:", error);
      toast({
        title: "Sign in failed",
        description: "There was a problem signing in. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Sign in with Google
  const signIn = async () => {
    try {
      setFirebaseLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      await registerOrLoginWithBackend(result.user);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/wordlist"] });
    } catch (error) {
      console.error("Sign in error:", error);
      toast({
        title: "Sign in failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setFirebaseLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
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
    if (!backendUser) {
      toast({
        title: "Not signed in",
        description: "You need to sign in to save words to your list.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await fetch(`/api/auth/wordlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: backendUser.id,
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
    if (!backendUser) {
      toast({
        title: "Not signed in",
        description: "You need to sign in to remove words from your list.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await fetch(`/api/auth/wordlist`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: backendUser.id,
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

  // Combine user data from Firebase and backend
  const combinedUser = firebaseUser && backendUser
    ? { firebaseUser, backendUser }
    : null;

  // Create the auth context value
  const authContextValue: AuthContextType = {
    user: combinedUser,
    isLoading: firebaseLoading || backendLoading,
    error: firebaseError || backendError || null,
    signIn,
    signOut,
    saveWordToList,
    removeWordFromList,
  };

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