import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

// Define the WordListItem type
export interface WordListItem {
  id: number;
  chinese: string;
  pinyin: string;
  english: string;
  category: string | null;
  subcategory: string | null;
  active: string;
  proficiency: {
    id: number;
    wordId: string;
    correctCount: string;
    attemptCount: string;
    lastPracticed: string;
    userId: number;
    isSaved: boolean;
  };
}

export function useUserWordList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Query for the user's word list
  const {
    data: wordList,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<WordListItem[]>({
    queryKey: ["/api/auth/wordlist", user?.backendUser?.id],
    queryFn: async () => {
      if (!user) {
        return []; // Return empty array if not logged in
      }
      
      // Check if we're in development mode
      const isDevMode = localStorage.getItem('dev_auth') === 'true';
      
      if (isDevMode) {
        console.log("[Dev mode] Fetching saved words from localStorage");
        
        try {
          // Get saved word IDs from localStorage
          const savedWordsStr = localStorage.getItem('dev_saved_words') || '[]';
          const savedWordIds = JSON.parse(savedWordsStr) as number[];
          
          if (savedWordIds.length === 0) {
            console.log("[Dev mode] No saved words found");
            return [];
          }
          
          // Fetch each word by ID
          const wordListItems: WordListItem[] = [];
          
          for (const wordId of savedWordIds) {
            try {
              const response = await fetch(`/api/vocabulary/${wordId}`);
              if (response.ok) {
                const word = await response.json();
                
                // Create mock proficiency data
                const wordWithProficiency: WordListItem = {
                  ...word,
                  proficiency: {
                    id: 9000 + wordId,
                    wordId: String(wordId),
                    correctCount: "0",
                    attemptCount: "0",
                    lastPracticed: new Date().toISOString(),
                    userId: 9999, // Dev user ID
                    isSaved: true
                  }
                };
                
                wordListItems.push(wordWithProficiency);
              }
            } catch (err) {
              console.error(`[Dev mode] Failed to fetch word ${wordId}:`, err);
            }
          }
          
          console.log(`[Dev mode] Loaded ${wordListItems.length} saved words`);
          return wordListItems;
        } catch (error) {
          console.error("[Dev mode] Error fetching word list:", error);
          throw error;
        }
      }
      
      // Regular API call for non-dev mode
      try {
        const response = await fetch(`/api/auth/wordlist?userId=${user.backendUser.id}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || "Failed to fetch word list");
        }
        
        return response.json();
      } catch (error) {
        console.error("Error fetching user word list:", error);
        throw error;
      }
    },
    // Only run the query if the user is logged in
    enabled: !!user,
    // Refetch on window focus, useful when user returns to the app
    refetchOnWindowFocus: true
  });

  // Add a word to the user's list
  const addWordToList = async (wordId: number) => {
    if (!user) {
      toast({
        title: "Not signed in",
        description: "You need to sign in to save words to your list.",
        variant: "destructive",
      });
      return;
    }

    // Check if we're in development mode
    const isDevMode = localStorage.getItem('dev_auth') === 'true';

    if (isDevMode) {
      try {
        console.log(`[Dev mode] Adding word ${wordId} to user's list`);
        
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
      } catch (error: any) {
        console.error("[Dev mode] Error adding word to list:", error);
        toast({
          title: "Failed to save word",
          description: error.message || "An unknown error occurred",
          variant: "destructive",
        });
        return;
      }
    }

    // Regular API call for non-dev mode
    try {
      // Call the API directly rather than through the user object
      const response = await fetch(`/api/auth/wordlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.backendUser.id,
          wordId,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to save word to list");
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/auth/wordlist", user.backendUser.id] });
      
      toast({
        title: "Word saved",
        description: "Word has been added to your list.",
      });
    } catch (error: any) {
      console.error("Error adding word to list:", error);
      toast({
        title: "Failed to save word",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Remove a word from the user's list
  const removeWordFromList = async (wordId: number) => {
    if (!user) {
      toast({
        title: "Not signed in",
        description: "You need to sign in to remove words from your list.",
        variant: "destructive",
      });
      return;
    }

    // Check if we're in development mode
    const isDevMode = localStorage.getItem('dev_auth') === 'true';

    if (isDevMode) {
      try {
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
      } catch (error: any) {
        console.error("[Dev mode] Error removing word from list:", error);
        toast({
          title: "Failed to remove word",
          description: error.message || "An unknown error occurred",
          variant: "destructive",
        });
        return;
      }
    }

    // Regular API call for non-dev mode
    try {
      // Call the API directly rather than through the user object
      const response = await fetch(`/api/auth/wordlist`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.backendUser.id,
          wordId,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to remove word from list");
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/auth/wordlist", user.backendUser.id] });
      
      toast({
        title: "Word removed",
        description: "Word has been removed from your list.",
      });
    } catch (error: any) {
      console.error("Error removing word from list:", error);
      toast({
        title: "Failed to remove word",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return {
    wordList: wordList || [],
    isLoading,
    isError,
    error,
    refetch,
    addWordToList,
    removeWordFromList
  };
}