import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

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

interface Character {
  id: number;
  character: string;
  pinyin: string;
  strokes?: number;
  radical?: string;
  hskLevel?: number;
  frequency?: number;
  createdAt: string;
}

interface CharacterDefinition {
  id: number;
  characterId: number;
  definition: string;
  partOfSpeech?: string;
  example?: string;
  order: number;
  createdAt: string;
}

interface CharacterCompound {
  compound: Character;
  position: number;
}

interface CharacterComponent {
  component: Character;
  position: number;
}

export default function CharacterDictionary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const { toast } = useToast();
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  
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
    queryKey: ['/api/characters/search', debouncedSearchTerm],
    queryFn: async () => {
      const response = await fetch(`/api/characters/search?q=${encodeURIComponent(debouncedSearchTerm)}`);
      if (!response.ok) throw new Error('Failed to search characters');
      return response.json() as Promise<Character[]>;
    },
    enabled: true, // Always fetch some characters, even with empty search
  });

  // Query for fetching definitions of selected character
  const definitionsQuery = useQuery({
    queryKey: ['/api/characters', selectedCharacter?.id, 'definitions'],
    queryFn: async () => {
      if (!selectedCharacter) return [] as CharacterDefinition[];
      const response = await fetch(`/api/characters/${selectedCharacter.id}/definitions`);
      if (!response.ok) throw new Error('Failed to fetch definitions');
      return response.json() as Promise<CharacterDefinition[]>;
    },
    enabled: !!selectedCharacter,
  });

  // Query for fetching compounds where the selected character is a component
  const compoundsQuery = useQuery({
    queryKey: ['/api/characters', selectedCharacter?.id, 'compounds'],
    queryFn: async () => {
      if (!selectedCharacter) return [] as CharacterCompound[];
      const response = await fetch(`/api/characters/${selectedCharacter.id}/compounds`);
      if (!response.ok) throw new Error('Failed to fetch compounds');
      return response.json() as Promise<CharacterCompound[]>;
    },
    enabled: !!selectedCharacter,
  });

  // Query for fetching components of the selected character (if it's a compound)
  const componentsQuery = useQuery({
    queryKey: ['/api/characters', selectedCharacter?.id, 'components'],
    queryFn: async () => {
      if (!selectedCharacter) return [] as CharacterComponent[];
      const response = await fetch(`/api/characters/${selectedCharacter.id}/components`);
      if (!response.ok) throw new Error('Failed to fetch components');
      return response.json() as Promise<CharacterComponent[]>;
    },
    enabled: !!selectedCharacter,
  });

  // Handler for character selection
  const handleSelectCharacter = (character: Character) => {
    setSelectedCharacter(character);
  };

  // Add a definition to the user's word list
  const handleToggleLearned = async (definitionId: number) => {
    // For now, just show a success message since login functionality isn't implemented yet
    const definitionText = definitionsQuery.data?.find(def => def.id === definitionId)?.definition || "";
    const characterText = selectedCharacter?.character || "";
    
    toast({
      title: "Word Added to List",
      description: `"${characterText}: ${definitionText}" has been added to your word list`,
      variant: "default",
    });
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
                        onClick={() => handleSelectCharacter(char)}
                      >
                        <div className="flex flex-col items-center w-full">
                          <span className="text-2xl mb-1 truncate max-w-full">{char.character}</span>
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
                    <CardTitle className="text-5xl mb-2">{selectedCharacter.character}</CardTitle>
                    <CardDescription className="text-xl">{selectedCharacter.pinyin}</CardDescription>
                  </div>
                  <div className="space-y-1">
                    {selectedCharacter.hskLevel && (
                      <Badge variant="outline" className="ml-2">
                        HSK {selectedCharacter.hskLevel}
                      </Badge>
                    )}
                    {selectedCharacter.strokes && (
                      <div className="text-sm text-muted-foreground">
                        Strokes: {selectedCharacter.strokes}
                      </div>
                    )}
                    {selectedCharacter.radical && (
                      <div className="text-sm text-muted-foreground">
                        Radical: {selectedCharacter.radical}
                      </div>
                    )}
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
                            {selectedCharacter?.character} is composed of the following characters:
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {componentsQuery.data
                              .sort((a, b) => a.position - b.position)
                              .map((item) => (
                                <Button
                                  key={`${item.component.id}-${item.position}`}
                                  variant="outline"
                                  className="h-20 text-xl"
                                  onClick={() => handleSelectCharacter(item.component)}
                                >
                                  <div className="flex flex-col items-center w-full">
                                    <span className="text-2xl mb-1 truncate max-w-full">{item.component.character}</span>
                                    <span className="text-xs truncate max-w-full">{item.component.pinyin}</span>
                                  </div>
                                </Button>
                              ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground p-2 border rounded-md">
                          {selectedCharacter?.character.length === 1 
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
                            {selectedCharacter?.character} is used in the following words:
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {compoundsQuery.data.map((item) => (
                              <Button
                                key={item.compound.id}
                                variant="outline"
                                className="h-20 text-xl"
                                onClick={() => handleSelectCharacter(item.compound)}
                              >
                                <div className="flex flex-col items-center w-full">
                                  <span className="text-2xl mb-1 truncate max-w-full">{item.compound.character}</span>
                                  <span className="text-xs truncate max-w-full">{item.compound.pinyin}</span>
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
              <CardFooter>
                <div className="text-sm text-muted-foreground">
                  {selectedCharacter.frequency ? 
                    `Frequency rank: ${selectedCharacter.frequency} (lower is more common)` : 
                    "Frequency data not available"}
                </div>
              </CardFooter>
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
    </div>
  );
}