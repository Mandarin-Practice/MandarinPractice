import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import WordChip from "@/components/word-chip";

// Create inline spinner component since the external one isn't working
const Spinner = ({ className = "", size = "md" }: { className?: string, size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-10 w-10 border-3",
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-solid border-current border-t-transparent text-primary ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

interface CharacterDefinition {
  id: number;
  characterId: number;
  definition: string;
  partOfSpeech?: string;
  example?: string;
  order: number;
  createdAt: string;
}

// Type for saved word list
interface SavedWord {
  id: number;
  character: string;
  definition: string;
  pinyin: string;
  timestamp: number;
}

// See if the document object is available (client-side only)
const isClient = typeof window !== 'undefined';

// Interface for Vocabulary from database
interface Vocabulary {
  id: number;
  chinese: string;
  pinyin: string;
  english: string;
  active: string;
}

// Interface for word proficiency
interface WordProficiency {
  id: number;
  wordId: number;
  correctCount: number;
  incorrectCount: number;
  lastPracticed?: string;
}

export default function CharacterDictionary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState<Vocabulary | null>(null);
  const { toast } = useToast();
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  
  // Query for vocabulary words
  const vocabularyQuery = useQuery({
    queryKey: ['/api/vocabulary/words'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/vocabulary/words');
      if (!response.ok) throw new Error('Failed to fetch vocabulary');
      return response.json() as Promise<Vocabulary[]>;
    },
  });
  
  // Add keyboard shortcut (Ctrl+K or Cmd+K) to focus search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Query for searching characters with debounce
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  
  // Debounce search term to reduce API calls
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  const charactersQuery = useQuery({
    queryKey: ['/api/definitions/search', debouncedSearchTerm],
    queryFn: async () => {
      const response = await fetch(`/api/definitions/search?q=${encodeURIComponent(debouncedSearchTerm)}`);
      if (!response.ok) throw new Error('Failed to search characters');
      return response.json() as Promise<Vocabulary[]>;
    },
    enabled: true, // Always fetch some characters, even with empty search
  });

  // Query for fetching definitions of selected character
  const definitionsQuery = useQuery({
    queryKey: ['/api/definitions', selectedCharacter?.chinese, 'definitions'],
    queryFn: async () => {
      if (!selectedCharacter) return [] as CharacterDefinition[];
      const response = await fetch(`/api/definitions/${selectedCharacter.chinese}`);
      if (!response.ok) throw new Error('Failed to fetch definitions');
      return response.json() as Promise<CharacterDefinition[]>;
    },
    enabled: !!selectedCharacter,
  });

  // Query for fetching compounds where the selected character is a component
  const compoundsQuery = useQuery({
    queryKey: ['/api/definitions', selectedCharacter?.chinese, 'compounds'],
    queryFn: async () => {
      if (!selectedCharacter) return [] as Vocabulary[];
      const response = await fetch(`/api/definitions/compounds/${selectedCharacter.chinese}`);
      if (!response.ok) throw new Error('Failed to fetch compounds');
      return response.json() as Promise<Vocabulary[]>;
    },
    enabled: !!selectedCharacter,
  });

  // Query for fetching components of the selected character (if it's a compound)
  const componentsQuery = useQuery({
    queryKey: ['/api/definitions', selectedCharacter?.id, 'components'],
    queryFn: async () => {
      if (!selectedCharacter) return [] as Vocabulary[];
      const response = await fetch(`/api/definitions/compounds/${selectedCharacter.chinese}`);
      if (!response.ok) throw new Error('Failed to fetch components');
      return response.json() as Promise<Vocabulary[]>;
    },
    enabled: !!selectedCharacter,
  });

  // Add word mutation
  const addVocabularyMutation = useMutation({
    mutationFn: async (word: { chinese: string, pinyin: string, english: string }) => {
      const response = await apiRequest('POST', '/api/vocabulary/words', { words: [word] });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add word');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete word mutation
  const deleteVocabularyMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/vocabulary/words/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete word');
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Add a definition to the user's word list (vocabulary database)
  const handleToggleLearned = async (definitionId: number) => {
    if (!selectedCharacter) return;
    
    const definition = definitionsQuery.data?.find(def => def.id === definitionId);
    if (!definition) return;
    
    // Create a new vocabulary word
    const newWord = {
      chinese: selectedCharacter.chinese,
      pinyin: selectedCharacter.pinyin,
      english: definition.definition,
      active: "true"
    };
    
    // Check if word is already in the vocabulary list
    const isAlreadyInVocabulary = vocabularyQuery.data?.some(word => 
      word.chinese === newWord.chinese && word.english === newWord.english
    );
    
    if (isAlreadyInVocabulary) {
      toast({
        title: "Already Added",
        description: `"${newWord.chinese}: ${newWord.english}" is already in your vocabulary list`,
        variant: "default",
      });
      return;
    }
    
    // Add to vocabulary database
    try {
      await addVocabularyMutation.mutateAsync(newWord);
      toast({
        title: "Word Added to List",
        description: `"${newWord.chinese}: ${newWord.english}" has been added to your vocabulary list`,
        variant: "default",
      });
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  // Function to remove a word from the vocabulary list
  const handleRemoveWord = (wordId: number) => {
    deleteVocabularyMutation.mutate(wordId);
  };
  
  // Function to clear all vocabulary words
  const handleClearAllWords = async () => {
    try {
      const response = await apiRequest('DELETE', '/api/vocabulary/words');
      if (!response.ok) {
        throw new Error('Failed to clear vocabulary');
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
      
      toast({
        title: "Word List Cleared",
        description: "All words have been removed from your vocabulary list",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Character Dictionary</h1>
        <div className="mt-2 sm:mt-0 px-3 py-1 bg-muted rounded-full text-sm flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-4 w-4"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          Search by character, pinyin, or English definition
        </div>
      </div>
      
      {/* Top-level tabs */}
      <Tabs defaultValue="dictionary" className="w-full mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="dictionary">Dictionary</TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center gap-1">
            Word List
            {!vocabularyQuery.isLoading && vocabularyQuery.data && vocabularyQuery.data.length > 0 && (
              <Badge className="ml-1">{vocabularyQuery.data.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dictionary">
          <div className="flex flex-wrap gap-4 mb-6">
        <div className="w-full md:w-1/3">
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative">
                <Input
                  ref={searchInputRef}
                  placeholder="Search by character, pinyin or English... (Ctrl+K)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 pl-10"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <Button
                variant="secondary"
                onClick={() => setSearchTerm("")}
                disabled={!searchTerm}
              >
                Clear
              </Button>
            </div>
            
            <div>
              {!charactersQuery.isLoading && !charactersQuery.isError && charactersQuery.data && (
                <div className="text-sm text-muted-foreground mb-2 flex justify-between items-center">
                  <span>
                    {charactersQuery.data.length > 0 ? (
                      <>Found {charactersQuery.data.length} character{charactersQuery.data.length !== 1 ? 's' : ''}</>
                    ) : (
                      <>No characters found</>
                    )}
                  </span>
                  {debouncedSearchTerm && (
                    <Badge variant="outline">
                      Search: "{debouncedSearchTerm}"
                    </Badge>
                  )}
                </div>
              )}
              
              <div className="h-[calc(100vh-300px)] overflow-y-auto border rounded-md p-4">
                {charactersQuery.isLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Spinner />
                  </div>
                ) : charactersQuery.isError ? (
                  <div className="text-center text-red-500 p-4">
                    Error loading characters: {charactersQuery.error.message}
                  </div>
                ) : charactersQuery.data && charactersQuery.data.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {charactersQuery.data.map((char) => (
                      <Button
                        key={char.id}
                        variant={selectedCharacter?.id === char.id ? "default" : "outline"}
                        className={`h-20 text-xl ${selectedCharacter?.id === char.id ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => setSelectedCharacter(char)}
                      >
                        <div className="flex flex-col items-center w-full">
                          <span className="text-2xl mb-1 truncate max-w-full">{char.chinese}</span>
                          <span className="text-xs truncate max-w-full">{char.pinyin}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground p-4">
                    No characters found. Try a different search term.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="w-full md:w-3/5 flex-1">
          {selectedCharacter ? (
            <Card className="h-full">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-5xl mb-2">{selectedCharacter.chinese}</CardTitle>
                    <CardDescription className="text-xl">{selectedCharacter.pinyin}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="definitions" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="definitions">Definitions</TabsTrigger>
                    <TabsTrigger value="related">Related</TabsTrigger>
                    <TabsTrigger value="examples">Examples</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="definitions" className="space-y-4">
                    {definitionsQuery.isLoading ? (
                      <div className="flex justify-center items-center h-40">
                        <Spinner />
                      </div>
                    ) : definitionsQuery.isError ? (
                      <div className="text-center text-red-500 p-4">
                        Error loading definitions: {definitionsQuery.error.message}
                      </div>
                    ) : definitionsQuery.data && definitionsQuery.data.length > 0 ? (
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground mb-2">
                          {definitionsQuery.data.length} definition{definitionsQuery.data.length !== 1 ? 's' : ''} available
                        </div>
                        
                        {definitionsQuery.data
                          .sort((a, b) => a.order - b.order)
                          .map((def, index) => (
                            <div key={def.id} className="border rounded-md p-4 hover:border-primary transition-colors">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="font-semibold text-lg flex items-center gap-2">
                                    <span>{index + 1}.</span>
                                    <span>{def.definition}</span>
                                  </div>
                                  <div className="mt-1">
                                    {def.partOfSpeech && (
                                      <Badge variant="outline" className="mb-2">
                                        {def.partOfSpeech}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleLearned(def.id)}
                                  className="ml-2 whitespace-nowrap"
                                >
                                  <span className="flex items-center gap-1">
                                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M8 2.75C8 2.47386 7.77614 2.25 7.5 2.25C7.22386 2.25 7 2.47386 7 2.75V7H2.75C2.47386 7 2.25 7.22386 2.25 7.5C2.25 7.77614 2.47386 8 2.75 8H7V12.25C7 12.5261 7.22386 12.75 7.5 12.75C7.77614 12.75 8 12.5261 8 12.25V8H12.25C12.5261 8 12.75 7.77614 12.75 7.5C12.75 7.22386 12.5261 7 12.25 7H8V2.75Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                    </svg>
                                    <span>Add to Word List</span>
                                  </span>
                                </Button>
                              </div>
                              {def.example && (
                                <div className="mt-3 text-muted-foreground bg-muted/50 p-2 rounded-md">
                                  <Label className="text-xs font-medium">Example:</Label>
                                  <div className="mt-1">{def.example}</div>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground p-4">
                        No definitions found for this character.
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="related" className="space-y-6">
                    {/* Components section (for compound characters) */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Components</h3>
                      {componentsQuery.isLoading ? (
                        <div className="flex justify-center items-center h-20">
                          <Spinner size="sm" />
                        </div>
                      ) : componentsQuery.isError ? (
                        <div className="text-center text-red-500 p-2">
                          Error loading components: {componentsQuery.error.message}
                        </div>
                      ) : componentsQuery.data && componentsQuery.data.length > 0 ? (
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground mb-1">
                            {selectedCharacter?.chinese} is composed of the following characters:
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {componentsQuery.data
                              .map((component, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  className="h-20 text-xl"
                                  onClick={() => setSelectedCharacter(component)}
                                >
                                  <div className="flex flex-col items-center w-full">
                                    <span className="text-2xl mb-1 truncate max-w-full">{component.chinese}</span>
                                    <span className="text-xs truncate max-w-full">{component.pinyin}</span>
                                  </div>
                                </Button>
                              ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground p-2 border rounded-md">
                          {selectedCharacter?.chinese.length === 1 
                            ? "This is a single character with no further components." 
                            : "No component data available for this character."}
                        </div>
                      )}
                    </div>
                    
                    {/* Compounds section (where this character is used) */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Compound Words</h3>
                      {compoundsQuery.isLoading ? (
                        <div className="flex justify-center items-center h-20">
                          <Spinner size="sm" />
                        </div>
                      ) : compoundsQuery.isError ? (
                        <div className="text-center text-red-500 p-2">
                          Error loading compounds: {compoundsQuery.error.message}
                        </div>
                      ) : compoundsQuery.data && compoundsQuery.data.length > 0 ? (
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground mb-1">
                            {selectedCharacter?.chinese} is used in the following words:
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {compoundsQuery.data.map((compound, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                className="h-20 text-xl"
                                onClick={() => setSelectedCharacter(compound)}
                              >
                                <div className="flex flex-col items-center w-full">
                                  <span className="text-2xl mb-1 truncate max-w-full">{compound.chinese}</span>
                                  <span className="text-xs truncate max-w-full">{compound.pinyin}</span>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground p-2 border rounded-md">
                          No compounds found that use this character.
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="examples">
                    <div className="text-center text-muted-foreground p-4">
                      Example sentences will be added in a future update.
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center p-8">
                <div className="text-4xl mb-4">汉字</div>
                <p className="text-muted-foreground">
                  Select a character from the list to view its details and definitions.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </TabsContent>
      
      <TabsContent value="saved">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Your Word List</h2>
            {!vocabularyQuery.isLoading && vocabularyQuery.data && vocabularyQuery.data.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleClearAllWords}
                className="text-muted-foreground hover:text-destructive"
                disabled={deleteVocabularyMutation.isPending}
              >
                {deleteVocabularyMutation.isPending ? (
                  <span className="flex items-center gap-1">
                    <Spinner size="sm" />
                    <span>Clearing...</span>
                  </span>
                ) : (
                  "Clear All"
                )}
              </Button>
            )}
          </div>
          
          {vocabularyQuery.isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Spinner />
            </div>
          ) : vocabularyQuery.isError ? (
            <div className="text-center text-red-500 p-4">
              Error loading vocabulary: {vocabularyQuery.error.message}
            </div>
          ) : vocabularyQuery.data && vocabularyQuery.data.length > 0 ? (
            <div className="space-y-2">
              {vocabularyQuery.data
                .filter(word => word.active === "true")
                .map((word) => (
                  <Card key={word.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{word.chinese}</div>
                          <div>
                            <div className="text-sm font-medium">{word.pinyin}</div>
                            <div className="text-base">{word.english}</div>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveWord(word.id)}
                        disabled={deleteVocabularyMutation.isPending}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12.8536 2.85355C13.0488 2.65829 13.0488 2.34171 12.8536 2.14645C12.6583 1.95118 12.3417 1.95118 12.1464 2.14645L7.5 6.79289L2.85355 2.14645C2.65829 1.95118 2.34171 1.95118 2.14645 2.14645C1.95118 2.34171 1.95118 2.65829 2.14645 2.85355L6.79289 7.5L2.14645 12.1464C1.95118 12.3417 1.95118 12.6583 2.14645 12.8536C2.34171 13.0488 2.65829 13.0488 2.85355 12.8536L7.5 8.20711L12.1464 12.8536C12.3417 13.0488 12.6583 13.0488 12.8536 12.8536C13.0488 12.6583 13.0488 12.3417 12.8536 12.1464L8.20711 7.5L12.8536 2.85355Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                        </svg>
                      </Button>
                    </div>
                  </Card>
                ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="text-xl mb-2">Your word list is empty</div>
                <p className="text-muted-foreground mb-4">
                  When browsing the dictionary, use the "Add to Word List" button to save words for later study.
                </p>
                
                <Button 
                  onClick={() => {
                    if (isClient) {
                      const tabButton = document.querySelector('button[value="dictionary"]');
                      if (tabButton && 'click' in tabButton) {
                        (tabButton as HTMLElement).click();
                      }
                    }
                  }} 
                  variant="default"
                >
                  Browse Dictionary
                </Button>
              </div>
            </Card>
          )}
        </div>
      </TabsContent>
      </Tabs>
    </div>
  );
}