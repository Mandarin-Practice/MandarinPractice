import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

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
      
      const response = await fetch(`/api/auth/wordlist?userId=${user.backendUser.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch word list");
      }
      
      return response.json();
    },
    // Only run the query if the user is logged in
    enabled: !!user,
    // Refetch on window focus, useful when user returns to the app
    refetchOnWindowFocus: true
  });

  return {
    wordList: wordList || [],
    isLoading,
    isError,
    error,
    refetch
  };
}