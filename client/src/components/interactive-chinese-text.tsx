import { useState } from 'react';
import { Button } from './ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CharacterInfo {
  character: string;
  definition?: string;
  pinyin?: string;
  wordId?: number;
  fullWord?: string;
  positionInWord?: number;
}

interface InteractiveChineseTextProps {
  chinese: string;
  vocabularyWords: Array<{
    id: number;
    chinese: string;
    pinyin: string;
    english: string;
    active: string;
  }>;
  feedbackStatus: "correct" | "partial" | "incorrect" | null;
}

export default function InteractiveChineseText({
  chinese,
  vocabularyWords,
  feedbackStatus,
}: InteractiveChineseTextProps) {
  const queryClient = useQueryClient();
  
  // Process the Chinese text to identify words from vocabulary
  const processedText: CharacterInfo[] = [];
  
  // Iterate through each character in the Chinese text
  for (let i = 0; i < chinese.length; i++) {
    const char = chinese[i];
    const charInfo: CharacterInfo = { character: char };
    
    // Find if this character is part of a word in our vocabulary
    // We check multi-character words first, from longest to shortest
    const matchedWord = vocabularyWords
      .filter(word => word.chinese.includes(char))
      .sort((a, b) => b.chinese.length - a.chinese.length) // Sort by length descending
      .find(word => {
        const startIndex = chinese.indexOf(word.chinese, Math.max(0, i - word.chinese.length + 1));
        return startIndex !== -1 && i >= startIndex && i < startIndex + word.chinese.length;
      });
    
    if (matchedWord) {
      charInfo.definition = matchedWord.english;
      charInfo.pinyin = matchedWord.pinyin;
      charInfo.wordId = matchedWord.id;
      
      // Store the full word and the position of this character within the word
      const startIndex = chinese.indexOf(matchedWord.chinese, Math.max(0, i - matchedWord.chinese.length + 1));
      if (startIndex !== -1) {
        const positionInWord = i - startIndex;
        charInfo.fullWord = matchedWord.chinese;
        charInfo.positionInWord = positionInWord;
      }
    }
    
    processedText.push(charInfo);
  }
  
  // Mutation to toggle the active status of a word
  const toggleWordActive = useMutation({
    mutationFn: async (wordId: number) => {
      const word = vocabularyWords.find(w => w.id === wordId);
      if (!word) return null;
      
      const response = await apiRequest('PATCH', `/api/vocabulary/${wordId}`, {
        active: word.active === 'true' ? 'false' : 'true'
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate vocabulary cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
    }
  });
  
  // Mutation to delete a word
  const deleteWord = useMutation({
    mutationFn: async (wordId: number) => {
      const response = await apiRequest('DELETE', `/api/vocabulary/${wordId}`);
      return response.status === 204;
    },
    onSuccess: () => {
      // Invalidate vocabulary cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
    }
  });
  
  return (
    <div className="text-3xl font-['Noto_Sans_SC',sans-serif] leading-relaxed font-bold">
      {/* Display with hover functionality always, with appropriate styling based on feedback */}
      <span className={
        feedbackStatus === "correct" 
          ? "text-green-600 dark:text-green-400" 
          : feedbackStatus === "incorrect" 
            ? "text-red-600 dark:text-red-400" 
            : "text-primary"
      }>
        {processedText.map((charInfo, index) => (
          charInfo.definition ? (
            <HoverCard key={index} openDelay={100} closeDelay={200}>
              <HoverCardTrigger asChild>
                <span 
                  className="cursor-help hover:bg-gray-100 dark:hover:bg-gray-800 px-1 py-0.5 mx-0.5 rounded transition-colors"
                >
                  {charInfo.character}
                </span>
              </HoverCardTrigger>
              <HoverCardContent className="w-64 p-4 top-layer" style={{ zIndex: 'var(--z-maximum)' }}>
                <div className="space-y-2">
                  {/* Display full word with the current character highlighted */}
                  {charInfo.fullWord && charInfo.positionInWord !== undefined ? (
                    <div className="text-2xl font-bold">
                      {Array.from(charInfo.fullWord).map((char, i) => (
                        <span 
                          key={i} 
                          className={i === charInfo.positionInWord 
                            ? "bg-secondary/25 text-secondary-foreground/90 px-0.5 rounded" 
                            : ""
                          }
                        >
                          {char}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-2xl font-bold">{charInfo.character}</div>
                  )}
                  
                  <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">{charInfo.pinyin}</div>
                  <div className="text-base text-gray-900 dark:text-white">{charInfo.definition}</div>
                  
                  {/* Only show word management options after checking an answer */}
                  {charInfo.wordId && feedbackStatus && (
                    <div className="flex flex-col space-y-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-700 dark:text-white font-medium mb-1">
                        Manage this word (you can update multiple words before continuing)
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleWordActive.mutate(charInfo.wordId as number)}
                        className="text-xs justify-start"
                      >
                        {vocabularyWords.find(w => w.id === charInfo.wordId)?.active === 'true' 
                          ? 'Mark as Inactive' 
                          : 'Mark as Active'}
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this word?')) {
                            deleteWord.mutate(charInfo.wordId as number);
                          }
                        }}
                        className="text-xs justify-start"
                      >
                        Delete Word
                      </Button>
                    </div>
                  )}
                </div>
              </HoverCardContent>
            </HoverCard>
          ) : (
            <span key={index} className="px-1 mx-0.5">{charInfo.character}</span>
          )
        ))}
      </span>
    </div>
  );
}