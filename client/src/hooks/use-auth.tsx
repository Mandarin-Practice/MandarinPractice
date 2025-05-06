import { 
  createContext, 
  ReactNode, 
  useContext, 
  useState, 
  useEffect 
} from "react";
import { 
  User as FirebaseUser, 
  onAuthStateChanged 
} from "firebase/auth";
import { auth, signInWithGoogle, logOut } from "@/lib/firebase";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define the user type from our backend
interface BackendUser {
  id: number;
  username: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
  firebaseUid: string;
}

// Combined user type with Firebase and backend data
export interface AuthUser {
  firebaseUser: FirebaseUser;
  backendUser: BackendUser;
}

// Auth context interface
interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  saveWordToList: (wordId: number) => Promise<void>;
  removeWordFromList: (wordId: number) => Promise<void>;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | null>(null);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Register or login the user with our backend
  const registerOrLoginWithBackend = async (firebaseUser: FirebaseUser) => {
    try {
      const { uid, email, displayName, photoURL } = firebaseUser;
      
      const response = await apiRequest("POST", "/api/auth/firebase", {
        firebaseUid: uid,
        email: email || undefined,
        displayName: displayName || undefined,
        photoUrl: photoURL || undefined
      });
      
      const data = await response.json();
      
      if (data.user) {
        setUser({
          firebaseUser,
          backendUser: data.user
        });
        
        // If new user, show welcome toast
        if (data.isNewUser) {
          toast({
            title: "Welcome!",
            description: "Your account has been created. You can now save words to your list.",
            variant: "default"
          });
        } else {
          // Show welcome back toast
          toast({
            title: "Welcome back!",
            description: "You're now signed in.",
            variant: "default"
          });
        }
      }
    } catch (err) {
      console.error("Error registering/logging in with backend:", err);
      setError(err instanceof Error ? err : new Error("Failed to authenticate with backend"));
      
      toast({
        title: "Authentication Error",
        description: "There was a problem logging in. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle sign in
  const signIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signInWithGoogle();
      // Auth state listener will handle the rest
    } catch (err) {
      console.error("Sign in error:", err);
      setError(err instanceof Error ? err : new Error("Failed to sign in"));
      setIsLoading(false);
      
      toast({
        title: "Sign In Failed",
        description: "There was a problem signing in with Google. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle sign out
  const signOut = async () => {
    try {
      setIsLoading(true);
      await logOut();
      setUser(null);
      
      // Clear any user-specific queries
      queryClient.invalidateQueries({ queryKey: ["/api/auth/wordlist"] });
      
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully.",
        variant: "default"
      });
    } catch (err) {
      console.error("Sign out error:", err);
      setError(err instanceof Error ? err : new Error("Failed to sign out"));
      
      toast({
        title: "Sign Out Failed",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save word to user's list
  const saveWordToList = async (wordId: number) => {
    if (!user) {
      toast({
        title: "Not Signed In",
        description: "Please sign in to save words to your list.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await apiRequest("POST", "/api/auth/wordlist/save", {
        userId: user.backendUser.id,
        wordId
      });
      
      // Invalidate word list cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/auth/wordlist"] });
      
      toast({
        title: "Word Saved",
        description: "The word has been added to your list.",
        variant: "default"
      });
    } catch (err) {
      console.error("Error saving word:", err);
      
      toast({
        title: "Save Failed",
        description: "There was a problem saving the word. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Remove word from user's list
  const removeWordFromList = async (wordId: number) => {
    if (!user) {
      return;
    }
    
    try {
      await apiRequest("POST", "/api/auth/wordlist/remove", {
        userId: user.backendUser.id,
        wordId
      });
      
      // Invalidate word list cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/auth/wordlist"] });
      
      toast({
        title: "Word Removed",
        description: "The word has been removed from your list.",
        variant: "default"
      });
    } catch (err) {
      console.error("Error removing word:", err);
      
      toast({
        title: "Remove Failed",
        description: "There was a problem removing the word. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (firebaseUser) {
          // User is signed in, register/login with backend
          await registerOrLoginWithBackend(firebaseUser);
        } else {
          // User is signed out
          setUser(null);
        }
      } catch (err) {
        console.error("Auth state change error:", err);
        setError(err instanceof Error ? err : new Error("Authentication error"));
      } finally {
        setIsLoading(false);
      }
    });
    
    // Clean up subscription
    return () => unsubscribe();
  }, []);

  // Auth context value
  const authContextValue: AuthContextType = {
    user,
    isLoading,
    error,
    signIn,
    signOut,
    saveWordToList,
    removeWordFromList
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