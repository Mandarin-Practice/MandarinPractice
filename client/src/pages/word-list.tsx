import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import WordChip from "@/components/word-chip";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useUserWordList } from "@/hooks/use-user-word-list";
import { LESSON11_WORDLIST } from "@/data/word-lists";
import { LESSON12_WORDLIST } from "@/data/lesson12-wordlist";
import { LESSON13_WORDLIST } from "@/data/lesson13-wordlist";
import { LESSON14_WORDLIST } from "@/data/lesson14-wordlist";
import { LESSON15_WORDLIST } from "@/data/lesson15-wordlist";
import { LESSON16_WORDLIST } from "@/data/lesson16-wordlist";
import { LESSON17_WORDLIST } from "@/data/lesson17-wordlist";
import { LESSON18_WORDLIST } from "@/data/lesson18-wordlist";
import { LESSON19_WORDLIST } from "@/data/lesson19-wordlist";
import { LESSON20_WORDLIST } from "@/data/lesson20-wordlist";

interface WordList {
  id: string;
  name: string;
  description: string;
  category?: string; // Category/folder to group word lists
  words: {
    chinese: string;
    pinyin: string;
    english: string;
  }[];
}

const SAMPLE_WORD_LISTS: WordList[] = [
  LESSON20_WORDLIST,
  LESSON19_WORDLIST,
  LESSON18_WORDLIST,
  LESSON17_WORDLIST,
  LESSON16_WORDLIST,
  LESSON15_WORDLIST,
  LESSON14_WORDLIST,
  LESSON13_WORDLIST,
  LESSON12_WORDLIST,
  LESSON11_WORDLIST,
  // Other word lists like HSK1, HSK2, etc.
];

export default function WordList() {
  // State management
  const [wordInput, setWordInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [importResults, setImportResults] = useState<{ total: number; imported: number } | null>(null);
  const [groupByHomophones, setGroupByHomophones] = useState(false);
  const [previewList, setPreviewList] = useState<WordList | null>(null);
  const [selectedWords, setSelectedWords] = useState<Record<number, boolean>>({});
  const [currentTab, setCurrentTab] = useState<'add' | 'list' | 'proficiency'>('add');
  
  // Hooks
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, signIn } = useAuth();
  const { 
    wordList: userWordList, 
    isLoading: userWordListLoading,
    addWordToList,
    removeWordFromList
  } = useUserWordList();

  // Fetch vocabulary data
  const { data: vocabulary, isLoading: vocabularyLoading } = useQuery({
    queryKey: ['/api/vocabulary'],
    refetchOnWindowFocus: false,
  });

  // Combine loading states
  const isLoading = vocabularyLoading || userWordListLoading;

  // State for proficiency data
  const [proficiencyData, setProficiencyData] = useState<Record<number, any>>({});
  const [isLoadingProficiency, setIsLoadingProficiency] = useState(false);

  // Fetch proficiency data for each word
  useEffect(() => {
    if (vocabulary && Array.isArray(vocabulary) && vocabulary.length > 0) {
      setIsLoadingProficiency(true);
      
      const fetchProficiencyData = async () => {
        const proficiencyMap: Record<number, any> = {};
        
        const promises = vocabulary.map(async (word) => {
          try {
            const response = await apiRequest('GET', `/api/word-proficiency/${word.id}`);
            if (response.ok) {
              const data = await response.json();
              proficiencyMap[word.id] = data;
            }
          } catch (error) {
            console.error(`Failed to fetch proficiency for word ID ${word.id}:`, error);
          }
        });
        
        await Promise.all(promises);
        setProficiencyData(proficiencyMap);
        setIsLoadingProficiency(false);
      };
      
      fetchProficiencyData();
    }
  }, [vocabulary]);

  // Add word mutation
  const addWordMutation = useMutation({
    mutationFn: async (data: { chinese: string; pinyin: string; english: string }) => {
      const response = await apiRequest('POST', '/api/vocabulary', data);
      if (!response.ok) {
        throw new Error('Failed to add word');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
      setWordInput('');
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 2000);
      toast({
        title: 'Word added successfully',
        description: 'The new word has been added to your vocabulary',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to add word',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    },
  });

  // Function to parse word input
  const handleAddWord = () => {
    if (!wordInput.trim()) {
      toast({
        title: 'Input is empty',
        description: 'Please enter a word to add',
        variant: 'destructive',
      });
      return;
    }

    const lines = wordInput.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      toast({
        title: 'Input is empty',
        description: 'Please enter a word to add',
        variant: 'destructive',
      });
      return;
    }

    let successCount = 0;
    const failedLines: string[] = [];

    const processLines = async () => {
      for (const line of lines) {
        try {
          const match = line.match(/([^(]+)\s*\(([^)]+)\)\s*-\s*(.+)/);
          
          if (match) {
            const [, chinese, pinyin, english] = match;
            await addWordMutation.mutateAsync({
              chinese: chinese.trim(),
              pinyin: pinyin.trim(),
              english: english.trim(),
            });
            successCount++;
          } else {
            failedLines.push(line);
          }
        } catch (error) {
          failedLines.push(line);
        }
      }

      if (failedLines.length > 0) {
        setWordInput(failedLines.join('\n'));
        toast({
          title: `Added ${successCount} words, ${failedLines.length} failed`,
          description: 'Please check the format of the remaining words',
          variant: 'destructive',
        });
      } else {
        toast({
          title: `Successfully added ${successCount} words`,
          description: 'All words have been added to your vocabulary',
        });
        setWordInput('');
      }
    };

    processLines();
  };

  // Function to handle showing preview of word list
  const handleShowPreview = (listId: string) => {
    const list = SAMPLE_WORD_LISTS.find(l => l.id === listId);
    if (list) {
      setPreviewList(list);
      // Initialize all words as selected
      const initialSelection: Record<number, boolean> = {};
      list.words.forEach((_, index) => {
        initialSelection[index] = true;
      });
      setSelectedWords(initialSelection);
    }
  };

  // Function to handle closing preview
  const handleClosePreview = () => {
    setPreviewList(null);
    setSelectedWords({});
  };

  // Function to toggle word selection in preview
  const handleToggleWordSelection = (index: number) => {
    setSelectedWords({
      ...selectedWords,
      [index]: !selectedWords[index]
    });
  };

  // Import word list mutation
  const importWordListMutation = useMutation({
    mutationFn: async (data: { wordList: { chinese: string; pinyin: string; english: string }[] }) => {
      // Change the data structure to match what the server expects
      const words = data.wordList.map(word => ({
        chinese: word.chinese,
        pinyin: word.pinyin,
        english: word.english,
        active: "true"
      }));
      
      const response = await apiRequest('POST', '/api/vocabulary/import', { words });
      if (!response.ok) {
        throw new Error('Failed to import word list');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
      setImportResults({
        total: data.length,
        imported: data.length
      });
      toast({
        title: 'Words imported successfully',
        description: `${data.length} words were added to your vocabulary`,
      });
      handleClosePreview();
    },
    onError: (error) => {
      toast({
        title: 'Failed to import word list',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  });

  // Function to import selected words from preview
  const handleImportSelectedWords = () => {
    if (!previewList) return;
    
    const selectedIndices = Object.entries(selectedWords)
      .filter(([_, selected]) => selected)
      .map(([index]) => parseInt(index));
    
    const wordsToImport = selectedIndices.map(index => previewList.words[index]);
    
    if (wordsToImport.length === 0) {
      toast({
        title: 'No words selected',
        description: 'Please select at least one word to import',
        variant: 'destructive',
      });
      return;
    }
    
    importWordListMutation.mutateAsync({ wordList: wordsToImport });
  };

  // Function to import entire word list
  const handleImportWordList = (listId: string) => {
    const list = SAMPLE_WORD_LISTS.find(l => l.id === listId);
    if (list) {
      importWordListMutation.mutateAsync({ wordList: list.words });
    }
  };

  // Function to remove a word
  const handleRemoveWord = async (wordId: number) => {
    try {
      const response = await apiRequest('DELETE', `/api/vocabulary/${wordId}`);
      if (!response.ok) {
        throw new Error('Failed to remove word');
      }
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
      toast({
        title: 'Word removed',
        description: 'The word has been removed from your vocabulary',
      });
    } catch (error) {
      toast({
        title: 'Failed to remove word',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  };
  
  // Function to clear all vocabulary
  const clearAllVocabulary = async () => {
    if (!confirm('Are you sure you want to delete ALL vocabulary words? This cannot be undone.')) {
      return;
    }
    
    try {
      const response = await apiRequest('DELETE', '/api/vocabulary');
      if (!response.ok) {
        throw new Error('Failed to clear vocabulary');
      }
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
      toast({
        title: 'Vocabulary cleared',
        description: 'All words have been removed from your vocabulary',
      });
    } catch (error) {
      toast({
        title: 'Failed to clear vocabulary',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  // Function to toggle active status of a word
  const handleToggleActive = async (wordId: number, currentActive: string) => {
    try {
      const response = await apiRequest('PATCH', `/api/vocabulary/${wordId}`, {
        active: currentActive === '1' ? '0' : '1'
      });
      if (!response.ok) {
        throw new Error('Failed to update word');
      }
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
    } catch (error) {
      toast({
        title: 'Failed to update word',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  // Function to normalize pinyin for comparison
  const normalizePinyin = (pinyin: string) => {
    return pinyin.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  // Function to group words by homophones
  const getHomophoneGroups = (words: any[]) => {
    if (!Array.isArray(words) || words.length === 0) return [];
    
    // Group by normalized pinyin
    const pinyinGroups: Record<string, any[]> = {};
    
    // Special case for "tā" (他/她/它) pronouns
    const pronounGroup: any[] = [];
    
    words.forEach(word => {
      const normalizedPinyin = normalizePinyin(word.pinyin);
      
      // Special case for "tā" pronouns (他/她/它)
      if (normalizedPinyin === 'ta' && ['他', '她', '它'].includes(word.chinese)) {
        pronounGroup.push(word);
        return;
      }
      
      if (!pinyinGroups[normalizedPinyin]) {
        pinyinGroups[normalizedPinyin] = [];
      }
      
      pinyinGroups[normalizedPinyin].push(word);
    });
    
    // Convert to array format
    const result: Array<{
      type: 'pronoun' | 'pinyin';
      words: any[];
    }> = [];
    
    // Add pronoun group if it has multiple items
    if (pronounGroup.length > 1) {
      result.push({
        type: 'pronoun',
        words: pronounGroup
      });
    }
    
    // Add other pinyin groups (only if they have multiple items)
    for (const pinyin in pinyinGroups) {
      if (pinyinGroups[pinyin].length > 1) {
        result.push({
          type: 'pinyin',
          words: pinyinGroups[pinyin]
        });
      }
    }
    
    return result;
  };

  // Filter vocabulary based on search query
  const filterVocabulary = (words: any[]) => {
    if (!searchQuery) return words;
    
    return words.filter(word => {
      // Convert search query and word properties to lowercase for case-insensitive matching
      const query = searchQuery.toLowerCase();
      const chineseLower = word.chinese.toLowerCase();
      const pinyinLower = word.pinyin.toLowerCase();
      const normalizedPinyin = normalizePinyin(pinyinLower); // Remove tone marks
      const englishLower = word.english.toLowerCase();
      
      return (
        chineseLower.includes(query) || 
        pinyinLower.includes(query) || 
        normalizedPinyin.includes(query) || 
        englishLower.includes(query)
      );
    });
  };

  // Function to get stats about a word list (how many are already imported)
  const getWordListStats = (listId: string) => {
    const list = SAMPLE_WORD_LISTS.find(l => l.id === listId);
    if (!list || !vocabulary || !Array.isArray(vocabulary)) {
      return { total: 0, imported: 0 };
    }
    
    const total = list.words.length;
    let imported = 0;
    
    list.words.forEach(word => {
      // Check if this word already exists in the vocabulary
      const exists = vocabulary.some(v => 
        v.chinese === word.chinese && 
        normalizePinyin(v.pinyin) === normalizePinyin(word.pinyin)
      );
      
      if (exists) {
        imported++;
      }
    });
    
    return { total, imported };
  };

  // Main component rendering
  return (
    <div className="word-list-section">
      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-6 border-b border-border pb-4">
        <button
          onClick={() => setCurrentTab('add')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            currentTab === 'add'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary hover:bg-secondary/80'
          }`}
        >
          Add Words
        </button>
        <button
          onClick={() => setCurrentTab('list')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            currentTab === 'list'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary hover:bg-secondary/80'
          }`}
        >
          Word List
        </button>
        <button
          onClick={() => setCurrentTab('proficiency')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            currentTab === 'proficiency'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary hover:bg-secondary/80'
          }`}
        >
          Proficiency
        </button>
      </div>
      
      {/* Word List Preview Modal */}
      {previewList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold">{previewList.name}</h3>
                <div className="flex items-center text-sm mt-1">
                  {previewList.category && (
                    <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-xs mr-2 font-medium">
                      {previewList.category}
                    </span>
                  )}
                  <span className="text-gray-700 dark:text-white">{previewList.description}</span>
                </div>
              </div>
              <button 
                onClick={handleClosePreview}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="flex p-4 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Select all words
                    const allSelected: Record<number, boolean> = {};
                    previewList.words.forEach((_, index) => {
                      allSelected[index] = true;
                    });
                    setSelectedWords(allSelected);
                  }}
                >
                  Select All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Deselect all words
                    const noneSelected: Record<number, boolean> = {};
                    previewList.words.forEach((_, index) => {
                      noneSelected[index] = false;
                    });
                    setSelectedWords(noneSelected);
                  }}
                >
                  Deselect All
                </Button>
                <span className="ml-4 text-sm font-medium text-gray-800 dark:text-white">
                  {Object.values(selectedWords).filter(Boolean).length} of {previewList.words.length} selected
                </span>
              </div>
            </div>
            
            <div className="overflow-y-auto p-4 flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {previewList.words.map((word, index) => (
                  <div 
                    key={index} 
                    className={`border rounded-md p-2 transition-colors cursor-pointer ${
                      selectedWords[index] 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                    onClick={() => handleToggleWordSelection(index)}
                  >
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={selectedWords[index] || false}
                        onChange={() => handleToggleWordSelection(index)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <div>
                        <div className="font-medium">{word.chinese}</div>
                        <div className="text-xs text-gray-700 dark:text-gray-200 font-medium">{word.pinyin}</div>
                        <div className="text-sm">{word.english}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={handleClosePreview}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleImportSelectedWords}
                disabled={Object.values(selectedWords).filter(Boolean).length === 0}
              >
                Import Selected Words
              </Button>
            </div>
          </div>
        </div>
      )}
    
      {/* Tab Content */}
      {currentTab === 'add' && (
        <Card className="mb-6 border-border overflow-hidden">
          <CardHeader className="sticky top-0 opaque-header">
            <CardTitle>Add Words</CardTitle>
            <CardDescription className="text-white">Add new words or import pre-made vocabulary lists</CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Custom Word Input */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3 border-b border-border pb-2">
                Add Custom Words
              </h3>
              <label htmlFor="word-input" className="block text-sm font-bold mb-2">
                Add Words (one per line)
              </label>
              <div className="relative">
                <Textarea
                  id="word-input"
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value)}
                  rows={6}
                  placeholder="学习 (xuéxí) - to study"
                  className="w-full px-4 py-3 rounded-md bg-background border-2 border-border focus:border-primary focus:ring-1 focus:ring-primary/50 font-medium leading-normal"
                />
              </div>
              <p className="text-sm text-foreground/70 mt-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 text-primary">
                  <path d="M12 9v4"></path>
                  <path d="M12 17h.01"></path>
                  <path d="M12 3c-1.2 0-2.4.6-3 1.7A4 4 0 0 0 9 12a4 4 0 0 1 1 7.3A4 4 0 0 0 12 21a4 4 0 0 0 2-7.3A4 4 0 0 1 15 6a4 4 0 0 0-.1-1.3c-.5-1.1-1.7-1.7-2.9-1.7Z"></path>
                </svg>
                Format: Chinese characters (pinyin) - English meaning
              </p>
              <div className="mt-3">
                <Button onClick={handleAddWord} disabled={!wordInput.trim()}>
                  Add Word
                </Button>
              </div>
            </div>
            
            <h3 className="text-lg font-bold mb-3 border-b border-border pb-2">
              Word Lists
            </h3>
            
            {/* Word lists content */}
            <div>
              {/* Group word lists by category */}
              {(() => {
                // Extract unique categories
                const categories = Array.from(
                  new Set(SAMPLE_WORD_LISTS.map(list => list.category || "Other"))
                ).sort();
                
                return categories.map(category => {
                  // Filter lists for current category
                  const listsInCategory = SAMPLE_WORD_LISTS.filter(
                    list => (list.category || "Other") === category
                  );
                  
                  return (
                    <div key={category} className="mb-8">
                      {/* Category header with count */}
                      <div className="flex items-center border-b border-primary/20 pb-3 mb-5">
                        <h4 className="text-xl font-bold text-primary flex items-center">
                          {category}
                        </h4>
                        <div className="ml-2 px-3 py-1.5 rounded-md bg-accent/30 border-2 border-primary/30 text-sm font-bold text-primary shadow-sm">
                          {listsInCategory.length} sets
                        </div>
                      </div>
                      
                      {/* Lists in this category */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {listsInCategory.map((list) => {
                          const { total, imported } = getWordListStats(list.id);
                          return (
                            <div key={list.id} className="border-2 border-border rounded-md p-4 bg-accent/10 hover:border-primary/50 hover:bg-accent/20 transition-all shadow-sm">
                              <div className="flex justify-between items-start mb-3">
                                <h4 className="font-bold text-primary text-lg">{list.name}</h4>
                                <div className="text-sm px-3 py-1.5 rounded-md border-2 border-primary/30 bg-background shadow-sm">
                                  <span className={imported === total ? "text-green-600 font-bold" : "text-primary font-bold"}>
                                    {imported}/{total} words added
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm mb-3 font-medium">{list.description}</p>
                              <div className="flex gap-3">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-sm border-primary/50 text-primary hover:bg-primary/10"
                                  onClick={() => handleShowPreview(list.id)}
                                >
                                  <span className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                                      <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                    Preview
                                  </span>
                                </Button>
                                <Button 
                                  variant="link" 
                                  className="p-0 h-auto text-sm text-primary"
                                  onClick={() => handleImportWordList(list.id)}
                                  disabled={importWordListMutation.isPending || (imported > 0 && imported === total)}
                                >
                                  <span className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                      <polyline points="17 8 12 3 7 8"></polyline>
                                      <line x1="12" y1="3" x2="12" y2="15"></line>
                                    </svg>
                                    {imported > 0 && imported === total ? "All Added" : "Import All"}
                                  </span>
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </CardContent>
        </Card>
      )}
      
      {currentTab === 'list' && (
        <Card className="mb-6 border-border overflow-hidden">
          <CardHeader className="sticky top-0 opaque-header">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Word List</CardTitle>
                <CardDescription className="text-white">All the words you've added for practice</CardDescription>
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={clearAllVocabulary}
              >
                Clear All Words
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            
            <div>
              <div className="flex justify-between items-center mb-4 border-b border-border pb-3">
                <h3 className="text-lg font-bold">
                  Current Word List
                </h3>
                <div className="flex items-center px-3 py-1.5">
                  <span className="text-sm flex items-center mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 text-primary">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                    Group Homophones
                  </span>
                  <button 
                    type="button"
                    className={`relative w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      groupByHomophones ? "bg-primary" : "bg-foreground/20"
                    }` as string}
                    onClick={() => setGroupByHomophones(!groupByHomophones)}
                    aria-label={groupByHomophones ? "Disable homophone grouping" : "Enable homophone grouping"}
                  >
                    <div
                      className={`bg-background h-4 w-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        groupByHomophones ? "translate-x-5" : "translate-x-0"
                      }` as string}
                    ></div>
                  </button>
                </div>
              </div>
              
              {/* Search input */}
              {vocabulary && Array.isArray(vocabulary) && vocabulary.length > 0 ? (
                <div className="relative mb-5 mt-2">
                  <div className="text-sm font-bold mb-1">
                    Search Words
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Chinese character (我) or pinyin (wo)"
                    className="w-full px-10 py-2.5 border-2 border-border rounded-md bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors font-medium"
                    title="Type either Chinese characters or pinyin to search. For example, typing '我' will find words with '我', and typing 'wo' will find words with the pinyin 'wo'."
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 top-6">
                    <div className="group relative">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary cursor-help">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 hidden group-hover:block bg-card border border-border text-black dark:text-white text-xs rounded-md py-2 px-3 w-64 z-10 shadow-md font-medium">
                        You can search by typing either Chinese characters or pinyin. The search is smart enough to find matching words regardless of which you use.
                      </div>
                    </div>
                  </div>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 top-6 text-primary/60 hover:text-primary"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  )}
                </div>
              ) : null}
              
              {isLoading ? (
                <div className="flex flex-wrap gap-2 mb-4">
                  <p>Loading vocabulary...</p>
                </div>
              ) : vocabulary && Array.isArray(vocabulary) && vocabulary.length > 0 ? (
                // Check if there are any results after filtering
                filterVocabulary(vocabulary).length === 0 ? (
                  <div className="italic mb-4 font-medium">
                    No words match your search query.
                  </div>
                ) : (
                  groupByHomophones ? (
                    // Homophone grouping mode
                    <div className="space-y-4 mb-4">
                      {/* Display homophone groups */}
                      {getHomophoneGroups(filterVocabulary(vocabulary)).map((group, index) => (
                        <div key={index} className="border-2 border-border rounded-md p-4 bg-accent/10 shadow-md">
                          <h4 className="text-md font-bold mb-3 text-primary flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                              <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
                            </svg>
                            {group.type === 'pronoun' 
                              ? <span><span className="font-bold">tā</span> - Pronoun Homophones (他/她/它)</span> 
                              : <span><span className="font-bold">{normalizePinyin(group.words[0].pinyin)}</span> - Homophones</span>}
                          </h4>
                          <div className="flex flex-wrap gap-2.5 ml-1">
                            {group.words.map((word) => (
                              <WordChip
                                key={word.id}
                                word={word}
                                proficiency={proficiencyData[word.id]}
                                onRemove={() => handleRemoveWord(word.id)}
                                onToggleActive={() => handleToggleActive(word.id, word.active)}
                                onSave={user ? () => addWordToList(word.id) : undefined}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                      
                      {/* Display words without homophones */}
                      {(() => {
                        // Get filtered vocabulary
                        const filteredVocab = filterVocabulary(vocabulary);
                        
                        // Get all words that are in homophone groups
                        const homophoneGroups = getHomophoneGroups(filteredVocab);
                        const wordsInHomophoneGroups = homophoneGroups.flatMap(group => 
                          group.words.map(word => word.id)
                        );
                        
                        // Find words that aren't in any homophone group
                        const singleWords = filteredVocab.filter(word => 
                          !wordsInHomophoneGroups.includes(word.id)
                        );
                        
                        return singleWords.length > 0 ? (
                          <div className="border-2 border-border rounded-md p-4 bg-accent/10 shadow-md">
                            <h4 className="text-md font-bold mb-3 text-primary flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                                <path d="M7 20h10"></path>
                                <path d="M10 20c5.5-2.5.8-6.4 3-10"></path>
                                <path d="M9.5 9.4c1.1.8 1.8 1.7 2.3 3.7"></path>
                                <path d="M14.1 6a7 7 0 0 0-4.2 0"></path>
                              </svg>
                              Words without homophones
                            </h4>
                            <div className="flex flex-wrap gap-2.5 ml-1">
                              {singleWords.map((word) => (
                                <WordChip
                                  key={word.id}
                                  word={word}
                                  proficiency={proficiencyData[word.id]}
                                  onRemove={() => handleRemoveWord(word.id)}
                                  onToggleActive={() => handleToggleActive(word.id, word.active)}
                                  onSave={user ? () => addWordToList(word.id) : undefined}
                                />
                              ))}
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  ) : (
                    // Normal list mode
                    <div className="border-2 border-border rounded-md p-4 mb-4 bg-accent/10 shadow-md">
                      <h4 className="text-md font-bold mb-3 text-primary flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                          <path d="M3 5v14"></path>
                          <path d="M8 5v14"></path>
                          <path d="M12 5v14"></path>
                          <path d="M17 5v14"></path>
                          <path d="M21 5v14"></path>
                        </svg>
                        All Vocabulary Words
                      </h4>
                      <div className="flex flex-wrap gap-2.5 ml-1">
                        {filterVocabulary(vocabulary).map((word) => (
                          <WordChip
                            key={word.id}
                            word={word}
                            proficiency={proficiencyData[word.id]}
                            onRemove={() => handleRemoveWord(word.id)}
                            onToggleActive={() => handleToggleActive(word.id, word.active)}
                            onSave={user ? () => addWordToList(word.id) : undefined}
                          />
                        ))}
                      </div>
                    </div>
                  )
                )
              ) : (
                <div className="border-2 border-border rounded-md p-6 mb-4 bg-accent/10 shadow-md text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-primary/30">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                    <path d="M9 3v18"></path>
                    <path d="M15 3v18"></path>
                    <path d="M3 9h18"></path>
                    <path d="M3 15h18"></path>
                  </svg>
                  <h3 className="text-xl font-semibold mb-2">No vocabulary words yet</h3>
                  <p className="mb-4 text-foreground/70">
                    You haven't added any vocabulary words yet. Add some words using the form above or import a pre-made word list.
                  </p>
                </div>
              )}
            </div>
            
            <CardFooter className="border-t border-border pt-4 pb-2 px-0 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentTab('list')}
                className="border-primary/70 text-primary hover:bg-primary/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M9 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
                  <path d="M17 10h.01" />
                  <path d="M12 10h.01" />
                  <path d="M7 10h.01" />
                  <path d="M7 15h.01" />
                  <path d="M12 15h.01" />
                  <path d="M17 15h.01" />
                </svg>
                View Word List
              </Button>
              <Button
                onClick={handleAddWord}
                disabled={!wordInput.trim()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M5 12h14"></path>
                  <path d="M12 5v14"></path>
                </svg>
                Add Words
              </Button>
            </CardFooter>
          </CardContent>
        </Card>
      )}
      
      {currentTab === 'proficiency' && (
        <Card className="mb-6 border-border overflow-hidden">
          <CardHeader className="sticky top-0 opaque-header">
            <CardTitle>Proficiency Tracking</CardTitle>
            <CardDescription className="text-white">Track your mastery of each vocabulary word</CardDescription>
          </CardHeader>
          
          <CardContent>
            {isLoading || isLoadingProficiency ? (
              <div className="flex flex-wrap gap-2 mb-4">
                <p>Loading proficiency data...</p>
              </div>
            ) : vocabulary && Array.isArray(vocabulary) && vocabulary.length > 0 ? (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="border-2 border-border rounded-md p-4 bg-accent/10 shadow-md text-center">
                    <div className="text-3xl font-bold text-green-500 mb-1">
                      {Object.values(proficiencyData).filter(p => p?.correctCount >= 3).length}
                    </div>
                    <div className="text-sm font-medium">
                      Mastered Words
                    </div>
                  </div>
                  
                  <div className="border-2 border-border rounded-md p-4 bg-accent/10 shadow-md text-center">
                    <div className="text-3xl font-bold text-yellow-500 mb-1">
                      {Object.values(proficiencyData).filter(p => p?.correctCount > 0 && p?.correctCount < 3).length}
                    </div>
                    <div className="text-sm font-medium">
                      Learning Words
                    </div>
                  </div>
                  
                  <div className="border-2 border-border rounded-md p-4 bg-accent/10 shadow-md text-center">
                    <div className="text-3xl font-bold text-red-500 mb-1">
                      {Object.values(proficiencyData).filter(p => !p || p?.correctCount === 0).length}
                    </div>
                    <div className="text-sm font-medium">
                      New Words
                    </div>
                  </div>
                </div>
                
                <div className="mb-4 border-b border-border pb-2">
                  <h3 className="text-lg font-bold">Proficiency by Word</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="border-2 border-border rounded-md p-4 bg-accent/10 shadow-md">
                    <h4 className="text-md font-bold mb-3 text-green-500 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      Mastered Words
                    </h4>
                    <div className="flex flex-wrap gap-2.5 ml-1">
                      {vocabulary
                        .filter(word => proficiencyData[word.id]?.correctCount >= 3)
                        .map(word => (
                          <WordChip
                            key={word.id}
                            word={word}
                            proficiency={proficiencyData[word.id]}
                            onRemove={() => handleRemoveWord(word.id)}
                            onToggleActive={() => handleToggleActive(word.id, word.active)}
                            onSave={user ? () => addWordToList(word.id) : undefined}
                          />
                        ))
                      }
                    </div>
                    {vocabulary.filter(word => proficiencyData[word.id]?.correctCount >= 3).length === 0 && (
                      <p className="text-sm italic text-foreground/70 mt-2">No mastered words yet. Keep practicing!</p>
                    )}
                  </div>
                  
                  <div className="border-2 border-border rounded-md p-4 bg-accent/10 shadow-md">
                    <h4 className="text-md font-bold mb-3 text-yellow-500 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 6v6l4 2"></path>
                      </svg>
                      Learning Words
                    </h4>
                    <div className="flex flex-wrap gap-2.5 ml-1">
                      {vocabulary
                        .filter(word => proficiencyData[word.id]?.correctCount > 0 && proficiencyData[word.id]?.correctCount < 3)
                        .map(word => (
                          <WordChip
                            key={word.id}
                            word={word}
                            proficiency={proficiencyData[word.id]}
                            onRemove={() => handleRemoveWord(word.id)}
                            onToggleActive={() => handleToggleActive(word.id, word.active)}
                            onSave={user ? () => addWordToList(word.id) : undefined}
                          />
                        ))
                      }
                    </div>
                    {vocabulary.filter(word => proficiencyData[word.id]?.correctCount > 0 && proficiencyData[word.id]?.correctCount < 3).length === 0 && (
                      <p className="text-sm italic text-foreground/70 mt-2">No words in progress. Start practicing!</p>
                    )}
                  </div>
                  
                  <div className="border-2 border-border rounded-md p-4 bg-accent/10 shadow-md">
                    <h4 className="text-md font-bold mb-3 text-red-500 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      New Words
                    </h4>
                    <div className="flex flex-wrap gap-2.5 ml-1">
                      {vocabulary
                        .filter(word => !proficiencyData[word.id] || proficiencyData[word.id]?.correctCount === 0)
                        .map(word => (
                          <WordChip
                            key={word.id}
                            word={word}
                            proficiency={proficiencyData[word.id]}
                            onRemove={() => handleRemoveWord(word.id)}
                            onToggleActive={() => handleToggleActive(word.id, word.active)}
                            onSave={user ? () => addWordToList(word.id) : undefined}
                          />
                        ))
                      }
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-border rounded-md p-6 mb-4 bg-accent/10 shadow-md text-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-primary/30">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <h3 className="text-xl font-semibold mb-2">No vocabulary words yet</h3>
                <p className="mb-4 text-foreground/70">
                  You need to add vocabulary words before you can track your proficiency.
                </p>
                <Button onClick={() => setCurrentTab('add')} variant="outline" className="mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add Words
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {false && (
        <Card className="mb-6 border-border overflow-hidden">
          <CardHeader className="sticky top-0 opaque-header">
            <CardTitle>My Saved Words</CardTitle>
            <CardDescription className="text-white">
              {user ? "Words you have specifically saved for later" : "Sign in to save words to your personal list"}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {!user ? (
              <div className="p-4 text-center">
                <h3 className="text-xl font-semibold mb-2">Sign In Required</h3>
                <p className="mb-4">Please sign in to view and manage your saved words</p>
                <Button onClick={signIn}>
                  Sign In with Google
                </Button>
              </div>
            ) : userWordListLoading ? (
              <div className="flex justify-center p-8">
                <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : userWordList && userWordList.length > 0 ? (
              <div>
                <div className="flex justify-between items-center mb-4 border-b border-border pb-3">
                  <h3 className="text-lg font-bold">Your Saved Words</h3>
                  <div className="flex items-center px-3 py-1.5">
                    <span className="text-sm flex items-center mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 text-primary">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                      </svg>
                      Group Homophones
                    </span>
                    <button 
                      type="button"
                      className={`relative w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                        groupByHomophones ? "bg-primary" : "bg-foreground/20"
                      }` as string}
                      onClick={() => setGroupByHomophones(!groupByHomophones)}
                    >
                      <div
                        className={`bg-background h-4 w-4 rounded-full shadow-md transform transition-transform duration-200 ${
                          groupByHomophones ? "translate-x-5" : "translate-x-0"
                        }` as string}
                      ></div>
                    </button>
                  </div>
                </div>
                
                {/* Search input for user's word list */}
                <div className="relative mb-5 mt-2">
                  <div className="text-sm font-bold mb-1">
                    Search Your Saved Words
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Chinese character or pinyin"
                    className="w-full px-10 py-2.5 border-2 border-border rounded-md bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors font-medium"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 top-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </div>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 top-6 text-primary/60 hover:text-primary"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  )}
                </div>
                
                {/* Display user's saved words */}
                <div className="border-2 border-border rounded-md p-4 mb-4 bg-accent/10 shadow-md">
                  <h4 className="text-md font-bold mb-3 text-primary flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Your Saved Words
                  </h4>
                  <div className="flex flex-wrap gap-2.5 ml-1">
                    {filterVocabulary(userWordList).map((word) => (
                      <WordChip
                        key={word.id}
                        word={word}
                        proficiency={proficiencyData[word.id]}
                        onRemove={() => removeWordFromList(word.id)}
                        saved={true}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-8">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-primary/30">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
                <h3 className="text-xl font-semibold mb-2">No Saved Words Yet</h3>
                <p className="mb-4 text-foreground/70">
                  You haven't saved any words to your personal list yet. You can save words from the vocabulary lists or add your own.
                </p>
                <Button variant="outline" onClick={() => setCurrentTab('all')}>
                  Browse All Words
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}