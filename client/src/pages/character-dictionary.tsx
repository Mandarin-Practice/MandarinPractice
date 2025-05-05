import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";

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

export default function CharacterDictionary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const { toast } = useToast();

  // Query for searching characters
  const charactersQuery = useQuery({
    queryKey: ['/api/characters/search', searchTerm],
    queryFn: async () => {
      const response = await fetch(`/api/characters/search?q=${encodeURIComponent(searchTerm)}`);
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

  // Handler for character selection
  const handleSelectCharacter = (character: Character) => {
    setSelectedCharacter(character);
  };

  // Mark a definition as learned (would need user authentication first)
  const handleToggleLearned = async (definitionId: number) => {
    toast({
      title: "Authentication Required",
      description: "You need to log in to track your learned definitions",
      variant: "destructive",
    });
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Character Dictionary</h1>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="w-full md:w-1/3">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search for a character or pinyin..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="secondary"
                onClick={() => setSearchTerm("")}
                disabled={!searchTerm}
              >
                Clear
              </Button>
            </div>
            
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {charactersQuery.data.map((char) => (
                    <Button
                      key={char.id}
                      variant={selectedCharacter?.id === char.id ? "default" : "outline"}
                      className="h-16 text-xl"
                      onClick={() => handleSelectCharacter(char)}
                    >
                      <div className="flex flex-col items-center">
                        <span>{char.character}</span>
                        <span className="text-xs">{char.pinyin}</span>
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
                        {definitionsQuery.data
                          .sort((a, b) => a.order - b.order)
                          .map((def) => (
                            <div key={def.id} className="border rounded-md p-4">
                              <div className="flex justify-between">
                                <div>
                                  <div className="font-semibold text-lg">{def.definition}</div>
                                  {def.partOfSpeech && (
                                    <Badge variant="outline" className="mb-2">
                                      {def.partOfSpeech}
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleLearned(def.id)}
                                >
                                  Mark as Learned
                                </Button>
                              </div>
                              {def.example && (
                                <div className="mt-2 text-muted-foreground">
                                  <Label>Example:</Label>
                                  <div>{def.example}</div>
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