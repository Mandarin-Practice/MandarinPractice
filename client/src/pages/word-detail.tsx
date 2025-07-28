import React, { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { speakMandarin } from '@/lib/speech-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { generateSentence } from '@/lib/openai-utils';

export default function WordDetail() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGeneratingSentence, setIsGeneratingSentence] = useState(false);
  const [exampleSentence, setExampleSentence] = useState<{
    chinese: string;
    pinyin: string;
    english: string;
  } | null>(null);

  // Get the word ID from the URL using the useRoute hook
  const [match, params] = useRoute('/word/:id');
  const wordId = params?.id;
  
  // Fetch the word details
  const { data: word, isLoading } = useQuery({
    queryKey: ['/api/vocabulary/words', wordId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/vocabulary/words/${wordId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Word not found');
        }
        throw new Error('Failed to fetch word details');
      }
      return response.json();
    },
    enabled: !!wordId,
    retry: 1
  });
  
  // Fetch word proficiency data
  const { data: proficiency, isLoading: isLoadingProficiency } = useQuery({
    queryKey: ['/api/vocabulary/proficiency', wordId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/vocabulary/proficiency/${wordId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch word proficiency');
      }
      return response.json();
    },
    enabled: !!wordId,
  });

  // Generate example sentence
  const handleGenerateExample = async () => {
    if (!word) return;
    
    setIsGeneratingSentence(true);
    try {
      const sentence = await generateSentence(word.chinese);
      setExampleSentence(sentence);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate example sentence',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingSentence(false);
    }
  };

  // Delete word mutation
  const deleteWordMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/vocabulary/words/${wordId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
      toast({
        title: 'Word deleted',
        description: 'The word has been removed from your vocabulary',
        variant: 'default',
      });
      // Redirect back to word list
      setLocation('/word-list');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete word',
        variant: 'destructive',
      });
    },
  });

  // Play audio for the word
  const handlePlayAudio = () => {
    if (word) {
      speakMandarin(word.chinese);
    }
  };

  return (
    <div className="container max-w-3xl py-6">
      <Button 
        variant="outline" 
        className="mb-4"
        onClick={() => setLocation('/word-list')}
      >
        <span className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Word List
        </span>
      </Button>

      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full mb-4" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      ) : word ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-3xl mr-2">{word.chinese}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full p-2 h-auto" 
                  onClick={handlePlayAudio}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </svg>
                </Button>
              </div>
              <span className="text-lg font-light">{word.active === "true" ? "Active" : "Inactive"}</span>
            </CardTitle>
            <CardDescription className="text-lg">{word.pinyin}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Definition</h3>
              <p className="text-xl">{word.english}</p>
            </div>

            {/* Word Proficiency Section */}
            <div>
              <h3 className="text-lg font-medium mb-2">Word Proficiency</h3>
              {isLoadingProficiency ? (
                <Skeleton className="h-10 w-full" />
              ) : proficiency ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span>Mastery Level</span>
                    <span className="font-medium">{proficiency.percentCorrect}%</span>
                  </div>

                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                      <div 
                        style={{ width: `${proficiency.proficiencyPercent}%` }} 
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center
                          ${proficiency.proficiencyPercent < 30 ? 'bg-red-500' : 
                            proficiency.proficiencyPercent < 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                      <div className="text-gray-500 dark:text-gray-400">Correct Answers</div>
                      <div className="font-semibold">{proficiency.correctCount}</div>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                      <div className="text-gray-500 dark:text-gray-400">Total Attempts</div>
                      <div className="font-semibold">{proficiency.attemptCount}</div>
                    </div>
                  </div>

                  {Number(proficiency.attemptCount) > 0 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Last practiced: {proficiency.lastPracticed !== "0" 
                        ? new Date(parseInt(proficiency.lastPracticed)).toLocaleDateString() 
                        : "Never"
                      }
                    </div>
                  )}

                  {Number(proficiency.attemptCount) > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => {
                        if (confirm("Are you sure you want to reset your progress for this word?")) {
                          // Reset word proficiency
                          apiRequest('DELETE', `/api/vocabulary/proficiency/${wordId}`)
                            .then(() => {
                              queryClient.invalidateQueries({ queryKey: ['/api/vocabulary/proficiency', wordId] });
                              toast({
                                title: 'Progress reset',
                                description: 'Word proficiency has been reset',
                                variant: 'default',
                              });
                            })
                            .catch(() => {
                              toast({
                                title: 'Error',
                                description: 'Failed to reset word proficiency',
                                variant: 'destructive',
                              });
                            });
                        }
                      }}
                    >
                      Reset Progress
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400">
                  No practice data available for this word yet. Practice with this word to build proficiency.
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">Example Usage</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleGenerateExample}
                  disabled={isGeneratingSentence}
                >
                  {isGeneratingSentence ? (
                    <span className="flex items-center">
                      <svg className="animate-spin mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"></path>
                        <path d="M7 22V11L3 3"></path>
                      </svg>
                      Generate Example
                    </span>
                  )}
                </Button>
              </div>
              
              {exampleSentence ? (
                <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-800">
                  <p className="text-lg mb-1">{exampleSentence.chinese}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{exampleSentence.pinyin}</p>
                  <p>{exampleSentence.english}</p>
                  <div className="mt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-1 h-auto" 
                      onClick={() => speakMandarin(exampleSentence.chinese)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                      </svg>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed rounded-md p-6 text-center text-gray-500 dark:text-gray-400">
                  {isGeneratingSentence ? (
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-pulse mb-2">Generating example...</div>
                      <div className="h-1 w-24 bg-gray-300 dark:bg-gray-700 rounded overflow-hidden">
                        <div className="h-full bg-blue-500 animate-progress-loop"></div>
                      </div>
                    </div>
                  ) : (
                    <p>Click "Generate Example" to see this word used in a sentence</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="destructive" 
              onClick={() => {
                if (confirm("Are you sure you want to delete this word?")) {
                  deleteWordMutation.mutate();
                }
              }}
            >
              Delete Word
            </Button>
            {word.active === "true" ? (
              <Button 
                variant="outline"
                onClick={() => {
                  // Toggle active status
                  const newActive = "false";
                  const response = apiRequest('PATCH', `/api/vocabulary/words/${wordId}`, { active: newActive });
                  response.then(() => {
                    queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
                    toast({
                      title: 'Word deactivated',
                      description: 'This word will not be used in practice sessions',
                      variant: 'default',
                    });
                  });
                }}
              >
                Deactivate Word
              </Button>
            ) : (
              <Button 
                variant="default"
                onClick={() => {
                  // Toggle active status
                  const newActive = "true";
                  const response = apiRequest('PATCH', `/api/vocabulary/words/${wordId}`, { active: newActive });
                  response.then(() => {
                    queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
                    toast({
                      title: 'Word activated',
                      description: 'This word will now be used in practice sessions',
                      variant: 'default',
                    });
                  });
                }}
              >
                Activate Word
              </Button>
            )}
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p>Word not found. It may have been deleted.</p>
            <Button 
              className="mt-4" 
              onClick={() => setLocation('/word-list')}
            >
              Return to Word List
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}