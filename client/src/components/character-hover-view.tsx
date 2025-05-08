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
  fullWord?: string;
  positionInWord?: number;
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

// Character database with common characters for immediate display
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
  '和': { pinyin: 'hé', definition: 'and/with/harmonious' },
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
  '早': { pinyin: 'zǎo', definition: 'early/morning' },
  '上': { pinyin: 'shàng', definition: 'up/above/on' },
  '下': { pinyin: 'xià', definition: 'down/below' },
  '饭': { pinyin: 'fàn', definition: 'rice/meal' },
  '了': { pinyin: 'le', definition: 'past tense marker' },
  '觉': { pinyin: 'jué', definition: 'to feel/perceive' },
  '得': { pinyin: 'de', definition: 'auxiliary verb/possessive' },
  '很': { pinyin: 'hěn', definition: 'very' },
  '聪': { pinyin: 'cōng', definition: 'clever/intelligent' },
  '明': { pinyin: 'míng', definition: 'bright/clear' },
  '今': { pinyin: 'jīn', definition: 'now/current' },
  '天': { pinyin: 'tiān', definition: 'day/sky' },
  '气': { pinyin: 'qì', definition: 'air/gas/spirit' },
  '暖': { pinyin: 'nuǎn', definition: 'warm' },
  '最': { pinyin: 'zuì', definition: 'most/extremely' },
  '近': { pinyin: 'jìn', definition: 'near/close' },
  '累': { pinyin: 'lèi', definition: 'tired/exhausted' },
  '所': { pinyin: 'suǒ', definition: 'place/so/therefore' },
  '以': { pinyin: 'yǐ', definition: 'according to/because/so' },
  '高': { pinyin: 'gāo', definition: 'high/tall' },
  '兴': { pinyin: 'xìng', definition: 'happy/excited' },
  '朋': { pinyin: 'péng', definition: 'friend' },
  '友': { pinyin: 'yǒu', definition: 'friend' },
  '发': { pinyin: 'fā', definition: 'to send/issue/develop' },
  '音': { pinyin: 'yīn', definition: 'sound/tone' },
  '常': { pinyin: 'cháng', definition: 'often/common/normal' },
  '自': { pinyin: 'zì', definition: 'self/oneself' },
  '然': { pinyin: 'rán', definition: 'so/yes/natural' },
  '晚': { pinyin: 'wǎn', definition: 'evening/night' },
  '跟': { pinyin: 'gēn', definition: 'with/to follow' },
  '一': { pinyin: 'yī', definition: 'one' },
  '起': { pinyin: 'qǐ', definition: 'to rise/start/together' },
  '电': { pinyin: 'diàn', definition: 'electricity' },
  '影': { pinyin: 'yǐng', definition: 'shadow/movie' },
  '吗': { pinyin: 'ma', definition: 'question particle' },
  '喜': { pinyin: 'xǐ', definition: 'to like/to enjoy' },
  '欢': { pinyin: 'huān', definition: 'happy/pleased' },
  '饺': { pinyin: 'jiǎo', definition: 'dumpling' },
  '子': { pinyin: 'zǐ', definition: 'child/seed/suffix' },
  '星': { pinyin: 'xīng', definition: 'star' },
  '期': { pinyin: 'qī', definition: 'period/phase' },
  '三': { pinyin: 'sān', definition: 'three' },
  '因': { pinyin: 'yīn', definition: 'cause/reason' },
  '为': { pinyin: 'wèi', definition: 'for/because' },
  '病': { pinyin: 'bìng', definition: 'illness/disease' },
  '能': { pinyin: 'néng', definition: 'can/able' },
  '校': { pinyin: 'xiào', definition: 'school' },
  '这': { pinyin: 'zhè', definition: 'this' },
  '个': { pinyin: 'gè', definition: 'measure word' },
  '菜': { pinyin: 'cài', definition: 'food/dish' },
};

// Phrase dictionary for multi-character words
const commonPhrases: Record<string, { pinyin: string, definition: string }> = {
  '早上': { pinyin: 'zǎo shang', definition: 'morning' },
  '早饭': { pinyin: 'zǎo fàn', definition: 'breakfast' },
  '聪明': { pinyin: 'cōng míng', definition: 'clever/intelligent' },
  '天气': { pinyin: 'tiān qì', definition: 'weather' },
  '暖和': { pinyin: 'nuǎn huo', definition: 'warm' },
  '最近': { pinyin: 'zuì jìn', definition: 'recently/lately' },
  '高兴': { pinyin: 'gāo xìng', definition: 'happy/glad' },
  '朋友': { pinyin: 'péng you', definition: 'friend' },
  '发音': { pinyin: 'fā yīn', definition: 'pronunciation' },
  '非常': { pinyin: 'fēi cháng', definition: 'very/extremely' },
  '自然': { pinyin: 'zì rán', definition: 'natural' },
  '今天': { pinyin: 'jīn tiān', definition: 'today' },
  '晚上': { pinyin: 'wǎn shang', definition: 'evening/night' },
  '一起': { pinyin: 'yī qǐ', definition: 'together' },
  '电影': { pinyin: 'diàn yǐng', definition: 'movie' },
  '东西': { pinyin: 'dōng xi', definition: 'thing/stuff' },
  '喜欢': { pinyin: 'xǐ huan', definition: 'to like/to enjoy' },
  '饺子': { pinyin: 'jiǎo zi', definition: 'dumpling' },
  '星期': { pinyin: 'xīng qī', definition: 'week' },
  '星期一': { pinyin: 'xīng qī yī', definition: 'Monday' },
  '星期二': { pinyin: 'xīng qī èr', definition: 'Tuesday' },
  '星期三': { pinyin: 'xīng qī sān', definition: 'Wednesday' },
  '星期四': { pinyin: 'xīng qī sì', definition: 'Thursday' },
  '星期五': { pinyin: 'xīng qī wǔ', definition: 'Friday' },
  '星期六': { pinyin: 'xīng qī liù', definition: 'Saturday' },
  '星期日': { pinyin: 'xīng qī rì', definition: 'Sunday' },
  '星期天': { pinyin: 'xīng qī tiān', definition: 'Sunday' },
  '因为': { pinyin: 'yīn wèi', definition: 'because' },
  '学校': { pinyin: 'xué xiào', definition: 'school' },
  '生病': { pinyin: 'shēng bìng', definition: 'to fall ill' },
  '所以': { pinyin: 'suǒ yǐ', definition: 'so/therefore' },
  '不能': { pinyin: 'bù néng', definition: 'cannot' },
  '觉得': { pinyin: 'jué de', definition: 'to think/feel' },
  '这个': { pinyin: 'zhè ge', definition: 'this (one)' },
  '好吃': { pinyin: 'hǎo chī', definition: 'delicious' },
  '学生': { pinyin: 'xué shēng', definition: 'student' },
  '看书': { pinyin: 'kàn shū', definition: 'to read a book' },
  '书店': { pinyin: 'shū diàn', definition: 'bookstore' },
  '旁边': { pinyin: 'páng biān', definition: 'beside/next to' },
  '打算': { pinyin: 'dǎ suàn', definition: 'to plan' },
  '打球': { pinyin: 'dǎ qiú', definition: 'to play ball' },
  '看电影': { pinyin: 'kàn diàn yǐng', definition: 'to watch a movie' },
  '明天': { pinyin: 'míng tiān', definition: 'tomorrow' },
  '昨天': { pinyin: 'zuó tiān', definition: 'yesterday' },
  '去见': { pinyin: 'qù jiàn', definition: 'to go see/to visit' },
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

  // Function to find phrases in the text
  function findPhrasesInText(text: string): {
    startIndex: number;
    endIndex: number;
    phrase: string;
    pinyin: string;
    definition: string;
  }[] {
    const results: {
      startIndex: number;
      endIndex: number;
      phrase: string;
      pinyin: string;
      definition: string;
    }[] = [];
    
    const phrasePairs = Object.entries(commonPhrases);
    
    // Sort phrases by length (longest first) to prioritize longer phrase matches
    const sortedPhrases = phrasePairs.sort((a, b) => b[0].length - a[0].length);
    
    // Check for phrases in our dictionary
    for (const [phrase, info] of sortedPhrases) {
      // Skip one-character phrases
      if (phrase.length <= 1) continue;
      
      let startIndex = 0;
      let foundIndex: number = -1;
      
      // Find all occurrences of the phrase
      while ((foundIndex = text.indexOf(phrase, startIndex)) !== -1) {
        // Check if this position is already covered by another phrase
        const isOverlapping = results.some(r => 
          (foundIndex >= r.startIndex && foundIndex <= r.endIndex) ||
          (foundIndex + phrase.length - 1 >= r.startIndex && foundIndex + phrase.length - 1 <= r.endIndex)
        );
        
        if (!isOverlapping) {
          results.push({
            startIndex: foundIndex,
            endIndex: foundIndex + phrase.length - 1,
            phrase,
            pinyin: info.pinyin,
            definition: info.definition
          });
        }
        
        startIndex = foundIndex + 1;
      }
    }
    
    return results;
  }

  // Build the character data with pinyin and definitions from vocabulary words or fallback
  useEffect(() => {
    // Only process if we have Chinese text
    if (!chinese) return;
    
    console.log("Processing characters from:", chinese);
    
    // Find multi-character phrases first
    const phrases = findPhrasesInText(chinese);
    console.log("Looking for phrases in text:", chinese);
    console.log("Available phrases:", Object.keys(commonPhrases));
    console.log("Found phrases:", phrases);
    
    // Create character data array
    const newCharactersData = chinese.split('').map((char, index) => {
      // Skip processing for punctuation
      if (/[。，！？；：""''「」『』（）【】、]/.test(char)) {
        return { character: char };
      }
      
      // Check if this character is part of a phrase
      const matchingPhrase = phrases.find(p => 
        index >= p.startIndex && index <= p.endIndex
      );
      
      let charData: CharacterDetails = { character: char };
      
      if (matchingPhrase) {
        // Character is part of a phrase
        charData.pinyin = matchingPhrase.pinyin.split(' ')[index - matchingPhrase.startIndex];
        charData.definition = matchingPhrase.definition;  // Show just the phrase definition
        charData.fullWord = matchingPhrase.phrase;
        charData.positionInWord = index - matchingPhrase.startIndex;
      } else {
        // Try to match from vocabulary words
        if (vocabularyWords && vocabularyWords.length > 0) {
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
          
          // Save this character to the dictionary
          const savedCharacterMutation = async () => {
            try {
              const response = await apiRequest('POST', '/api/characters', {
                character: char,
                pinyin: "unknown",
                definition: `Automatically added character: ${char}`,
                simplified: true
              });
              console.log("Added new character to dictionary:", char, response);
            } catch (error) {
              console.error("Failed to add character to dictionary:", char, error);
            }
          };
          
          // Execute the mutation (no need to await, we're just initiating the background save)
          savedCharacterMutation();
          
          charData.pinyin = "(unknown)";
          charData.definition = "Character not in dictionary";
        }
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
            <HoverCardContent 
              align="center"
              side="bottom"
              sideOffset={5}
              avoidCollisions={true}
              collisionPadding={20}
              className="w-80 p-4 overflow-visible" 
              style={{ zIndex: 9999, position: 'fixed' }}>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{charData.character}</div>
                <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {charData.pinyin || 'No pinyin available'}
                </div>
                <div className="text-base text-gray-900 dark:text-white">
                  {charData.definition || 'No definition available'}
                </div>
                
                {/* If character is part of a phrase, show the full phrase */}
                {charData.fullWord && (
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">
                      Part of phrase
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded p-2">
                      <div className="text-lg font-semibold">{charData.fullWord}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {commonPhrases[charData.fullWord]?.pinyin || ''}
                      </div>
                      <div className="text-sm mt-1">
                        {commonPhrases[charData.fullWord]?.definition || ''}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Word management section for vocabulary words */}
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