import { useState } from 'react';
import { Button } from './ui/button';
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
    
    // SIMPLIFIED MATCHING FOR DEBUGGING
    // Just check if this character appears anywhere in any vocabulary word
    const matchedWord = vocabularyWords.find(word => word.chinese.includes(char));
    
    if (matchedWord) {
      charInfo.definition = matchedWord.english;
      charInfo.pinyin = matchedWord.pinyin;
      charInfo.wordId = matchedWord.id;
      charInfo.fullWord = matchedWord.chinese;
      charInfo.positionInWord = matchedWord.chinese.indexOf(char);
      
      // Force debug info to console
      console.log('Matched character:', char, 'to word:', matchedWord.chinese);
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
  
  const [activeCharId, setActiveCharId] = useState<string | null>(null);
  
  // Function to render popup content
  const renderPopupContent = (charInfo: CharacterInfo) => {
    return (
      <div className="fixed top-10 left-10 mt-1 w-64 p-4 bg-white dark:bg-gray-800 rounded shadow-lg border z-[9999]">
        <div className="space-y-2">
          {/* Close button */}
          <button 
            className="absolute top-1 right-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={() => setActiveCharId(null)}
          >
            ×
          </button>
          
          {/* Display full word with the current character highlighted */}
          {charInfo.fullWord && charInfo.positionInWord !== undefined ? (
            <div className="text-2xl font-bold mt-2">
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
            <div className="text-2xl font-bold mt-2">{charInfo.character}</div>
          )}
          
          <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">{charInfo.pinyin}</div>
          <div className="text-base text-gray-900 dark:text-white">{charInfo.definition}</div>
          
          {charInfo.wordId && (
            <div className="flex flex-col space-y-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-700 dark:text-white font-medium mb-1">
                Manage this word (you can update multiple words before continuing)
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  toggleWordActive.mutate(charInfo.wordId as number);
                  setActiveCharId(null);
                }}
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
                    setActiveCharId(null);
                  }
                }}
                className="text-xs justify-start"
              >
                Delete Word
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Created fixed popup content for testing
  const testContent = (
    <div className="fixed top-10 left-10 mt-1 w-64 p-4 bg-white dark:bg-gray-800 rounded shadow-lg border z-[9999]">
      <div className="space-y-2">
        <div className="text-2xl font-bold mt-2">Test Popup</div>
        <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">This is a test popup</div>
        <div className="text-base text-gray-900 dark:text-white">Does this appear?</div>
      </div>
    </div>
  );

  return (
    <div className="text-3xl font-['Noto_Sans_SC',sans-serif] leading-relaxed font-bold overflow-visible">
      {/* Debug info displayed at the top to help troubleshooting */}
      <div className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 p-2 text-sm border-b z-50">
        <div>Feedback: {feedbackStatus || 'none'}</div>  
        <div>Words matched: {processedText.filter(c => c.definition).length}</div>
        <div>Active char: {activeCharId || 'none'}</div>
        <button 
          className="bg-blue-500 text-white px-2 py-1 rounded mt-1"
          onClick={() => setActiveCharId('test')}
        >
          Test Popup
        </button>
        {activeCharId === 'test' && testContent}
      </div>
      
      {feedbackStatus ? (
        // Display with interactive functionality after checking answer
        <span className={
          feedbackStatus === "correct" 
            ? "text-green-600 dark:text-green-400" 
            : feedbackStatus === "incorrect" 
              ? "text-red-600 dark:text-red-400" 
              : ""
        }>
          {processedText.map((charInfo, index) => {
            const charId = `char-${index}`;
            
            return charInfo.definition ? (
              <span key={index} className="relative inline-block">
                <span 
                  className="cursor-help border-b-2 border-dotted border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 px-1 py-0.5 mx-0.5 rounded transition-colors"
                  onClick={() => setActiveCharId(activeCharId === charId ? null : charId)}
                  onMouseEnter={() => setActiveCharId(charId)}
                  onMouseLeave={() => {
                    console.log('Mouse leave', charId);
                    setTimeout(() => setActiveCharId(null), 300);
                  }}
                >
                  {charInfo.character}
                </span>
                {activeCharId === charId && renderPopupContent(charInfo)}
              </span>
            ) : (
              <span key={index} className="px-1 mx-0.5">{charInfo.character}</span>
            );
          })}
        </span>
      ) : (
        // Normal display when no feedback with better spacing and readability
        <span style={{ color: '#cc0000' }}>
          {chinese.split('').map((char, index) => (
            <span key={index} className="px-1 mx-0.5">{char}</span>
          ))}
        </span>
      )}
    </div>
  );
}