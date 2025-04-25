import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import WordChip from "@/components/word-chip";
import { Separator } from "@/components/ui/separator";

interface WordList {
  id: string;
  name: string;
  description: string;
  words: {
    chinese: string;
    pinyin: string;
    english: string;
  }[];
}

const SAMPLE_WORD_LISTS: WordList[] = [
  {
    id: "hsk1",
    name: "HSK Level 1 Basics",
    description: "150 essential words for beginners",
    words: [
      { chinese: "我", pinyin: "wǒ", english: "I/me" },
      { chinese: "你", pinyin: "nǐ", english: "you" },
      { chinese: "他", pinyin: "tā", english: "he/him" },
      { chinese: "她", pinyin: "tā", english: "she/her" },
      { chinese: "好", pinyin: "hǎo", english: "good" },
      { chinese: "是", pinyin: "shì", english: "to be" },
      { chinese: "不", pinyin: "bù", english: "no/not" },
      { chinese: "人", pinyin: "rén", english: "person" },
      { chinese: "的", pinyin: "de", english: "possessive particle" },
      { chinese: "在", pinyin: "zài", english: "at/in/on" }
    ]
  },
  {
    id: "travel",
    name: "Travel Phrases",
    description: "100 useful travel expressions",
    words: [
      { chinese: "你好", pinyin: "nǐ hǎo", english: "hello" },
      { chinese: "谢谢", pinyin: "xiè xiè", english: "thank you" },
      { chinese: "再见", pinyin: "zài jiàn", english: "goodbye" },
      { chinese: "请", pinyin: "qǐng", english: "please" },
      { chinese: "对不起", pinyin: "duì bù qǐ", english: "sorry" },
      { chinese: "没关系", pinyin: "méi guān xì", english: "it's okay" },
      { chinese: "厕所", pinyin: "cè suǒ", english: "toilet" },
      { chinese: "多少钱", pinyin: "duō shǎo qián", english: "how much money" },
      { chinese: "饭店", pinyin: "fàn diàn", english: "restaurant" },
      { chinese: "水", pinyin: "shuǐ", english: "water" }
    ]
  }
];

export default function WordList() {
  const [wordInput, setWordInput] = useState("");
  const [groupByHomophones, setGroupByHomophones] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's vocabulary
  const { data: vocabulary, isLoading } = useQuery({
    queryKey: ['/api/vocabulary'],
    refetchOnWindowFocus: false,
  });

  // Save vocabulary mutation
  const saveVocabularyMutation = useMutation({
    mutationFn: async (words: { chinese: string; pinyin: string; english: string }[]) => {
      const response = await apiRequest('POST', '/api/vocabulary', { words });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
      toast({
        title: "Words saved",
        description: "Your vocabulary list has been updated.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving words",
        description: error.message || "There was a problem saving your vocabulary.",
        variant: "destructive",
      });
    }
  });

  // Delete word mutation
  const deleteWordMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/vocabulary/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
      toast({
        title: "Word removed",
        description: "The word has been removed from your vocabulary list.",
        variant: "default",
      });
    }
  });
  
  // Toggle word active status mutation
  const toggleActiveStatusMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number, active: string }) => {
      const response = await apiRequest('PATCH', `/api/vocabulary/${id}`, { active });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
    }
  });

  // Clear all words mutation
  const clearWordsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/vocabulary');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
      toast({
        title: "List cleared",
        description: "All words have been removed from your vocabulary list.",
        variant: "default",
      });
    }
  });

  // Import word list mutation
  const importWordListMutation = useMutation({
    mutationFn: async (listId: string) => {
      const wordList = SAMPLE_WORD_LISTS.find(list => list.id === listId);
      if (!wordList) throw new Error("Word list not found");
      
      const response = await apiRequest('POST', '/api/vocabulary/import', { words: wordList.words });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
      toast({
        title: "Word list imported",
        description: "The word list has been added to your vocabulary.",
        variant: "default",
      });
    }
  });

  // Parse the textarea input into words
  const parseWords = () => {
    if (!wordInput.trim()) {
      toast({
        title: "Empty input",
        description: "Please enter some vocabulary words.",
        variant: "destructive",
      });
      return;
    }

    const lines = wordInput.split('\n').filter(line => line.trim());
    const words = lines.map(line => {
      // Try to parse lines in format: Chinese (pinyin) - English
      const pattern = /^(.+?)\s*\((.+?)\)\s*-\s*(.+)$/;
      const match = line.match(pattern);
      
      if (match) {
        return {
          chinese: match[1].trim(),
          pinyin: match[2].trim(),
          english: match[3].trim()
        };
      }
      
      // Fallback for unparseable lines
      return {
        chinese: line.trim(),
        pinyin: "",
        english: ""
      };
    });

    saveVocabularyMutation.mutate(words);
    setWordInput("");
  };

  const handleRemoveWord = (id: number) => {
    deleteWordMutation.mutate(id);
  };

  const handleClearWords = () => {
    if (confirm("Are you sure you want to clear all words?")) {
      clearWordsMutation.mutate();
    }
  };

  const handleImportWordList = (listId: string) => {
    importWordListMutation.mutate(listId);
  };
  
  const handleToggleActive = (id: number, currentActive: string) => {
    const newActive = currentActive === "true" ? "false" : "true";
    toggleActiveStatusMutation.mutate({ id, active: newActive });
  };
  
  // Function to normalize pinyin by removing tone marks
  const normalizePinyin = (pinyin: string): string => {
    // Remove tone marks to get base pinyin
    return pinyin.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };
  
  // Group words by homophone (same pinyin without tones)
  const getHomophoneGroups = (words: any[]) => {
    if (!Array.isArray(words) || words.length === 0) return [];
    
    const groups: { [key: string]: any[] } = {};
    
    // First pass: group by normalized pinyin
    words.forEach(word => {
      const normalizedPinyin = normalizePinyin(word.pinyin);
      if (!groups[normalizedPinyin]) {
        groups[normalizedPinyin] = [];
      }
      groups[normalizedPinyin].push(word);
    });
    
    // Only keep groups with multiple words
    return Object.values(groups).filter(group => group.length > 1);
  };

  return (
    <div className="word-list-section">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Vocabulary Words</CardTitle>
          <CardDescription>Add the Mandarin words you want to practice</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6">
            <label htmlFor="word-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Add Words (one per line)
            </label>
            <Textarea
              id="word-input"
              value={wordInput}
              onChange={(e) => setWordInput(e.target.value)}
              rows={5}
              placeholder="学习 (xuéxí) - to study
喜欢 (xǐhuān) - to like
中文 (zhōngwén) - Chinese language"
              className="w-full px-4 py-3 rounded-lg"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Format: Chinese characters (pinyin) - English meaning
            </p>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium">Current Word List</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Group homophones</span>
                <div
                  className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer ${
                    groupByHomophones ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                  onClick={() => setGroupByHomophones(!groupByHomophones)}
                >
                  <div
                    className={`bg-white dark:bg-gray-200 h-4 w-4 rounded-full shadow-md transform transition-transform ${
                      groupByHomophones ? "translate-x-5" : ""
                    }`}
                  ></div>
                </div>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex flex-wrap gap-2 mb-4">
                <p>Loading vocabulary...</p>
              </div>
            ) : vocabulary && Array.isArray(vocabulary) && vocabulary.length > 0 ? (
              groupByHomophones ? (
                // Homophone grouping mode
                <div className="space-y-4 mb-4">
                  {getHomophoneGroups(vocabulary).map((group, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <h4 className="text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
                        {normalizePinyin(group[0].pinyin)} - Homophones with different tones
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {group.map((word) => (
                          <WordChip
                            key={word.id}
                            word={word}
                            onRemove={() => handleRemoveWord(word.id)}
                            onToggleActive={() => handleToggleActive(word.id, word.active)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {/* Display words that don't have homophones */}
                  {vocabulary.filter(word => {
                    const normalizedPinyin = normalizePinyin(word.pinyin);
                    const group = vocabulary.filter(w => normalizePinyin(w.pinyin) === normalizedPinyin);
                    return group.length === 1;
                  }).length > 0 && (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <h4 className="text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
                        Words without homophones
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {vocabulary.filter(word => {
                          const normalizedPinyin = normalizePinyin(word.pinyin);
                          const group = vocabulary.filter(w => normalizePinyin(w.pinyin) === normalizedPinyin);
                          return group.length === 1;
                        }).map((word) => (
                          <WordChip
                            key={word.id}
                            word={word}
                            onRemove={() => handleRemoveWord(word.id)}
                            onToggleActive={() => handleToggleActive(word.id, word.active)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Normal list mode
                <div className="flex flex-wrap gap-2 mb-4">
                  {vocabulary.map((word) => (
                    <WordChip
                      key={word.id}
                      word={word}
                      onRemove={() => handleRemoveWord(word.id)}
                      onToggleActive={() => handleToggleActive(word.id, word.active)}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="text-gray-500 dark:text-gray-400 italic mb-4">
                No words in your vocabulary list yet.
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleClearWords}
            disabled={isLoading || !vocabulary || !Array.isArray(vocabulary) || vocabulary.length === 0}
          >
            Clear List
          </Button>
          <Button
            onClick={parseWords}
            disabled={!wordInput.trim()}
          >
            Save Words
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-3">Suggested Word Lists</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Import pre-made lists to get started quickly</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SAMPLE_WORD_LISTS.map((list) => (
              <div key={list.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-500 transition-colors">
                <h4 className="font-medium mb-2">{list.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{list.description}</p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-sm text-primary hover:text-blue-700 dark:hover:text-blue-300"
                  onClick={() => handleImportWordList(list.id)}
                  disabled={importWordListMutation.isPending}
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    Import List
                  </span>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
