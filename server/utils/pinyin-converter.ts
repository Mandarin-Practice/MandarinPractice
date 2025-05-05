/**
 * Utility to convert number-based pinyin to proper tone mark pinyin
 * E.g., "ni3 hao3" -> "nǐ hǎo"
 */

// Tone mark mappings for vowels
const toneMarks: Record<string, string[]> = {
  'a': ['a', 'ā', 'á', 'ǎ', 'à'],
  'e': ['e', 'ē', 'é', 'ě', 'è'],
  'i': ['i', 'ī', 'í', 'ǐ', 'ì'],
  'o': ['o', 'ō', 'ó', 'ǒ', 'ò'],
  'u': ['u', 'ū', 'ú', 'ǔ', 'ù'],
  'ü': ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ'],
  'v': ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ'] // Handle 'v' as 'ü' 
};

// Function to determine which vowel gets the tone mark
function getVowelWithTone(syllable: string): string {
  syllable = syllable.toLowerCase().replace('v', 'ü');
  
  // When there's an 'a', it gets the tone
  if (syllable.includes('a')) return 'a';
  
  // When there's an 'e', it gets the tone
  if (syllable.includes('e')) return 'e';
  
  // When there's "ou", the 'o' gets the tone
  if (syllable.includes('ou')) return 'o';
  
  // For other cases, the last vowel gets the tone
  const vowels = ['a', 'e', 'i', 'o', 'u', 'ü'];
  let lastVowel = '';
  let lastIndex = -1;
  
  for (const vowel of vowels) {
    const index = syllable.lastIndexOf(vowel);
    if (index > lastIndex) {
      lastIndex = index;
      lastVowel = vowel;
    }
  }
  
  return lastVowel;
}

/**
 * Convert numeric pinyin to tonal pinyin
 * @param numericPinyin Pinyin with tone numbers (e.g., "ni3 hao3")
 * @returns Pinyin with tone marks (e.g., "nǐ hǎo")
 */
export function convertNumericPinyinToTonal(numericPinyin: string): string {
  if (!numericPinyin) return '';
  
  // If the pinyin already has tone marks, return it as is
  if (/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(numericPinyin)) {
    return numericPinyin;
  }
  
  // Split the pinyin into syllables (space-separated)
  return numericPinyin.split(' ').map(syllable => {
    // Find the tone number (1-5, where 5 is neutral tone)
    const toneMatch = syllable.match(/([a-zA-ZüÜ]+)([1-5])?/);
    if (!toneMatch) return syllable;
    
    const [, baseSyllable, toneNumber] = toneMatch;
    const tone = toneNumber ? parseInt(toneNumber) : 0;
    
    if (tone < 1 || tone > 5) return baseSyllable; // Invalid tone, return syllable without tone
    
    // Find the vowel that gets the tone mark
    const vowelWithTone = getVowelWithTone(baseSyllable);
    if (!vowelWithTone) return baseSyllable; // No vowel found
    
    // Apply the tone mark
    return baseSyllable.replace(vowelWithTone, toneMarks[vowelWithTone][tone]);
  }).join(' ');
}

/**
 * Test if pinyin is in numeric format
 * @param pinyin Pinyin to test
 * @returns True if pinyin contains numeric tones
 */
export function isNumericPinyin(pinyin: string): boolean {
  return /[a-zA-ZüÜ]+[1-5]/.test(pinyin);
}