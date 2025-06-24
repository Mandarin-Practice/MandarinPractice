import { createContext, ReactNode, useContext, useEffect, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { auth, googleProvider } from "@/lib/firebase";
import {
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  onAuthStateChanged,
} from "firebase/auth";

// Backend user type from database
interface BackendUser {
  id: number;
  username: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
  firebaseUid: string;
  currentStreak?: number;
  highestStreak?: number;
  currentScore?: number;
  highestScore?: number;
  lastPracticeDate?: string;
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

  // Local authentication state
  const [localUser, setLocalUser] = useState<BackendUser | null>(null);
  const [localUserLoading, setLocalUserLoading] = useState(false);

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
            Authorization: `Bearer ${idToken}`,
          },
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
  const registerOrLoginWithBackend = useCallback(
    async (firebaseUser: FirebaseUser) => {
      try {
        console.log("Registering user with backend:", firebaseUser.email);
        // Get user token
        const idToken = await firebaseUser.getIdToken();

        // Register/login with backend
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            username: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || `user${Date.now()}`,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoUrl: firebaseUser.photoURL,
            firebaseUid: firebaseUser.uid,
          }),
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
    },
    [refetchBackendUser, toast],
  );

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
      },
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

  // Login with username and password (local auth)
  const loginWithCredentials = async (credentials: LoginCredentials) => {
    try {
      setLocalUserLoading(true);
      console.log("Logging in with username and password");

      const response = await fetch("/api/auth/login/local", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Login failed");
      }

      // Save user data
      const userData = await response.json();
      setLocalUser(userData);

      // Store user authentication token
      localStorage.setItem("auth_type", "local");
      localStorage.setItem("auth_user_id", userData.id.toString());

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/wordlist"] });

      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.displayName || userData.username}!`,
      });

      return userData;
    } catch (error) {
      console.error("Login failed:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid username or password",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLocalUserLoading(false);
    }
  };

  // Register a new user with username and password
  const registerWithCredentials = async (credentials: RegisterCredentials) => {
    try {
      setLocalUserLoading(true);
      console.log("Registering new user with username and password");

      const response = await fetch("/api/auth/register/local", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
          email: credentials.email,
          displayName: credentials.displayName || credentials.username,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Registration failed");
      }

      // Save user data
      const userData = await response.json();
      setLocalUser(userData);

      // Store user authentication info
      localStorage.setItem("auth_type", "local");
      localStorage.setItem("auth_user_id", userData.id.toString());

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/wordlist"] });

      toast({
        title: "Registration successful",
        description: `Welcome, ${userData.displayName || userData.username}!`,
      });

      return userData;
    } catch (error) {
      console.error("Registration failed:", error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Registration error",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLocalUserLoading(false);
    }
  };

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
        appId: import.meta.env.VITE_FIREBASE_APP_ID ? "✓" : "✗",
      });

      // Use redirect method directly as it's more reliable
      googleProvider.setCustomParameters({
        prompt: "select_account",
        login_hint: "user@example.com",
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
    // Get user ID from either Firebase or local auth
    const effectiveBackendUser = localUser || backendUser;

    if (!effectiveBackendUser) {
      toast({
        title: "Not signed in",
        description: "You need to sign in to save words to your list.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Regular API call to save word
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
    // Get user ID from either Firebase or local auth
    const effectiveBackendUser = localUser || backendUser;

    if (!effectiveBackendUser) {
      toast({
        title: "Not signed in",
        description: "You need to sign in to remove words from your list.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Regular API call to remove word
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
    // Check if we have a local or Firebase user
    const isLocalAuth = !!localUser;
    const effectiveUser = localUser || backendUser;

    if (!effectiveUser) {
      toast({
        title: "Not signed in",
        description: "You need to sign in to update your profile.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Handle local authentication
      if (isLocalAuth) {
        console.log("Updating local user profile:", updates);

        // Update user profile in backend with local auth
        const response = await fetch(`/api/auth/user/${effectiveUser.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error("Failed to update profile");
        }

        // Get updated user data
        const userData = await response.json();
        setLocalUser(userData);

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });

        return;
      }

      // If we're here, it's a Firebase user
      // Get Firebase ID token
      const idToken = await firebaseUser!.getIdToken();

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
  const combinedUser = firebaseUser && backendUser ? { firebaseUser, backendUser } : null;

  // Check for local authentication persistence
  useEffect(() => {
    const authType = localStorage.getItem("auth_type");
    const userId = localStorage.getItem("auth_user_id");

    if (authType === "local" && userId && !localUser) {
      console.log("Restoring local authentication session");

      // Fetch user data based on stored ID
      const fetchLocalUser = async () => {
        try {
          setLocalUserLoading(true);

          const response = await fetch(`/api/auth/user/${userId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setLocalUser(userData);
            console.log("Local user session restored", userData);
          } else {
            console.log("Failed to restore local user session, clearing stored data");
            localStorage.removeItem("auth_type");
            localStorage.removeItem("auth_user_id");
          }
        } catch (error) {
          console.error("Error restoring local user session:", error);
          localStorage.removeItem("auth_type");
          localStorage.removeItem("auth_user_id");
        } finally {
          setLocalUserLoading(false);
        }
      };

      fetchLocalUser();
    }
  }, [localUser, setLocalUserLoading]);

  // Handle both local and Firebase authentication

  // Create the combined user
  const effectiveUser = localUser
    ? {
        // Local authentication user
        backendUser: localUser,
        firebaseUser: null as any, // Local auth doesn't have Firebase user
      }
    : combinedUser || null; // Fall back to Firebase auth if available

  // Update signOut to handle local authentication
  const effectiveSignOut = async (): Promise<void> => {
    // Check if we're using local authentication
    if (localStorage.getItem("auth_type") === "local") {
      console.log("Signing out local user");
      localStorage.removeItem("auth_type");
      localStorage.removeItem("auth_user_id");
      setLocalUser(null);

      // Clear any data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/wordlist"] });

      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });

      return Promise.resolve();
    }
    // Otherwise use Firebase signout
    else {
      return signOut();
    }
  };

  // Create the auth context value with local authentication support
  const authContextValue: AuthContextType = {
    user: effectiveUser,
    isLoading: firebaseLoading || backendLoading || localUserLoading,
    error: firebaseError || backendError || null,
    signIn, // Google sign in
    loginWithCredentials, // Username/password login
    registerWithCredentials, // Register new user
    signOut: effectiveSignOut,
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
      localUser: localUser ? "active" : "inactive",
      isLoading: firebaseLoading || backendLoading || localUserLoading,
    });
  }, [effectiveUser, firebaseUser, backendUser, localUser, firebaseLoading, backendLoading, localUserLoading]);

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
}

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
