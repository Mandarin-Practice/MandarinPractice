import { useState, useEffect } from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';
import { Button } from './ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CharacterDetails {
  character: string;
  pinyin?: string;
  definition?: string;
  wordId?: number;
}

interface CharacterHoverViewProps {
  chinese: string;
  isInteractive: boolean;  // Only enable hover when interactive is true
  vocabularyWords?: Array<{
    id: number;
    chinese: string;
    pinyin: string;
    english: string;
    active: string;
  }>;
  feedbackStatus?: "correct" | "partial" | "incorrect" | null;
}

// Simple character database with common characters for immediate display
// This is used as fallback when we can't fetch from the database
const commonCharacters: Record<string, { pinyin: string, definition: string }> = {
  '他': { pinyin: 'tā', definition: 'he/him' },
  '不': { pinyin: 'bù', definition: 'no/not' },
  '是': { pinyin: 'shì', definition: 'is/to be' },
  '老': { pinyin: 'lǎo', definition: 'old/experienced' },
  '师': { pinyin: 'shī', definition: 'teacher/master' },
  '我': { pinyin: 'wǒ', definition: 'I/me' },
  '你': { pinyin: 'nǐ', definition: 'you' },
  '们': { pinyin: 'men', definition: 'plural marker' },
  '的': { pinyin: 'de', definition: 'possessive particle' },
  '在': { pinyin: 'zài', definition: 'at/in/on' },
  '有': { pinyin: 'yǒu', definition: 'to have/there is' },
  '学': { pinyin: 'xué', definition: 'to learn/study' },
  '生': { pinyin: 'shēng', definition: 'student/life' },
  '中': { pinyin: 'zhōng', definition: 'middle/center' },
  '国': { pinyin: 'guó', definition: 'country/state' },
  '人': { pinyin: 'rén', definition: 'person/people' },
  '好': { pinyin: 'hǎo', definition: 'good/well' },
  '要': { pinyin: 'yào', definition: 'want/need' },
  '会': { pinyin: 'huì', definition: 'can/will/meeting' },
  '去': { pinyin: 'qù', definition: 'to go' },
  '来': { pinyin: 'lái', definition: 'to come' },
  '做': { pinyin: 'zuò', definition: 'to do/make' },
  '吃': { pinyin: 'chī', definition: 'to eat' },
  '喝': { pinyin: 'hē', definition: 'to drink' },
  '大': { pinyin: 'dà', definition: 'big/large' },
  '小': { pinyin: 'xiǎo', definition: 'small/little' },
  '多': { pinyin: 'duō', definition: 'many/much' },
  '少': { pinyin: 'shǎo', definition: 'few/little' },
  '买': { pinyin: 'mǎi', definition: 'to buy' },
  '东': { pinyin: 'dōng', definition: 'east' },
  '西': { pinyin: 'xī', definition: 'west/thing' },
  '南': { pinyin: 'nán', definition: 'south' },
  '北': { pinyin: 'běi', definition: 'north' },
  '家': { pinyin: 'jiā', definition: 'home/family' },
  '想': { pinyin: 'xiǎng', definition: 'to think/want' },
  '现': { pinyin: 'xiàn', definition: 'present/current' },
  '工': { pinyin: 'gōng', definition: 'work' },
  '作': { pinyin: 'zuò', definition: 'to do/make' },
  '爱': { pinyin: 'ài', definition: 'to love' },
  '和': { pinyin: 'hé', definition: 'and/with' },
  '说': { pinyin: 'shuō', definition: 'to say/speak' },
  '话': { pinyin: 'huà', definition: 'speech/words' },
  '书': { pinyin: 'shū', definition: 'book' },
  '年': { pinyin: 'nián', definition: 'year' },
  '月': { pinyin: 'yuè', definition: 'month/moon' },
  '日': { pinyin: 'rì', definition: 'day/sun' },
  '时': { pinyin: 'shí', definition: 'time/hour' },
  '分': { pinyin: 'fēn', definition: 'minute/to divide' },
  '秒': { pinyin: 'miǎo', definition: 'second (time)' },
  '钟': { pinyin: 'zhōng', definition: 'clock/bell' },
  '点': { pinyin: 'diǎn', definition: 'o\'clock/dot/point' },
  '看': { pinyin: 'kàn', definition: 'to see/look/read' },
  '听': { pinyin: 'tīng', definition: 'to listen' },
};

export default function CharacterHoverView({
  chinese,
  isInteractive,
  vocabularyWords = [],
  feedbackStatus
}: CharacterHoverViewProps) {
  const queryClient = useQueryClient();
  const [charactersData, setCharactersData] = useState<CharacterDetails[]>([]);

  // Debug
  console.log("CharacterHoverView rendering with:", {chinese, isInteractive, feedbackStatus});

  // Build the character data with pinyin and definitions from vocabulary words or fallback
  useEffect(() => {
    // Only process if we have Chinese text
    if (!chinese) return;
    
    console.log("Processing characters from:", chinese);
    
    const newCharactersData = chinese.split('').map(char => {
      // Skip processing for punctuation
      if (/[。，！？；：""''「」『』（）【】、]/.test(char)) {
        return { character: char };
      }
      
      // First try to find from vocabulary words
      let charData: CharacterDetails = { character: char };
      
      // Try to match from vocabulary words
      if (vocabularyWords && vocabularyWords.length > 0) {
        // Find if this character is in any vocabulary word
        const matchingWord = vocabularyWords.find(word => 
          word.chinese && word.chinese.includes(char)
        );
        
        if (matchingWord) {
          charData.pinyin = matchingWord.pinyin;
          charData.definition = matchingWord.english;
          charData.wordId = matchingWord.id;
        }
      }
      
      // If not found in vocabulary, use common characters fallback
      if (!charData.definition && commonCharacters[char]) {
        charData.pinyin = commonCharacters[char].pinyin;
        charData.definition = commonCharacters[char].definition;
      } else if (!charData.definition) {
        // If character not found in our dictionary, provide a placeholder definition
        console.log("Character not found in dictionary:", char);
        charData.pinyin = "(unknown)";
        charData.definition = "Character not in dictionary";
      }
      
      return charData;
    });
    
    console.log("Character data prepared:", newCharactersData);
    setCharactersData(newCharactersData);
  }, [chinese, vocabularyWords]);

  // Mutation to toggle word active status
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
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
    }
  });

  return (
    <span className={
      feedbackStatus === "correct" 
        ? "text-green-600 dark:text-green-400" 
        : feedbackStatus === "incorrect" 
          ? "text-red-600 dark:text-red-400" 
          : "text-primary"
    }>
      {isInteractive ? (
        // Interactive mode with hover cards
        charactersData.map((charData, index) => (
          <HoverCard key={index} openDelay={100} closeDelay={200}>
            <HoverCardTrigger asChild>
              <span 
                className="cursor-help hover:bg-gray-100 dark:hover:bg-gray-800 px-1 py-0.5 mx-0.5 rounded transition-colors"
                title={charData.definition ? `${charData.pinyin || ''}: ${charData.definition}` : charData.character}
              >
                {charData.character}
              </span>
            </HoverCardTrigger>
            <HoverCardContent className="w-64 p-4" style={{ zIndex: 9999 }}>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{charData.character}</div>
                <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {charData.pinyin || 'No pinyin available'}
                </div>
                <div className="text-base text-gray-900 dark:text-white">
                  {charData.definition || 'No definition available'}
                </div>
                
                {charData.wordId && (
                  <div className="flex flex-col space-y-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-700 dark:text-white font-medium mb-1">
                      Word management
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toggleWordActive.mutate(charData.wordId as number)}
                      className="text-xs justify-start"
                    >
                      {vocabularyWords?.find?.(w => w.id === charData.wordId)?.active === 'true' 
                        ? 'Mark as Inactive' 
                        : 'Mark as Active'}
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this word?')) {
                          deleteWord.mutate(charData.wordId as number);
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
        ))
      ) : (
        // Non-interactive mode - just display the text
        chinese.split('').map((char, index) => (
          <span key={index} className="px-1 mx-0.5">{char}</span>
        ))
      )}
    </span>
  );
}