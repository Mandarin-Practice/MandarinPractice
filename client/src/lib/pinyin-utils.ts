/**
 * Normalizes pinyin by removing tone marks
 * @param pinyin Pinyin string with tone marks
 * @returns Normalized pinyin without tone marks
 */
export function normalizePinyin(pinyin: string): string {
  // Remove tone marks using Unicode normalization
  return pinyin.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Format numeric pinyin (e.g., ni3) to pinyin with tone marks (e.g., nǐ)
 * Used for display purposes
 */
export function formatNumericPinyin(numericPinyin: string): string {
  if (!numericPinyin) return '';
  
  // Replace numeric tones with accented characters
  // This is a simplified implementation
  const vowels = ['a', 'e', 'i', 'o', 'u', 'ü', 'A', 'E', 'I', 'O', 'U', 'Ü'];
  const toneMarks = [
    ['ā', 'ē', 'ī', 'ō', 'ū', 'ǖ', 'Ā', 'Ē', 'Ī', 'Ō', 'Ū', 'Ǖ'],
    ['á', 'é', 'í', 'ó', 'ú', 'ǘ', 'Á', 'É', 'Í', 'Ó', 'Ú', 'Ǘ'],
    ['ǎ', 'ě', 'ǐ', 'ǒ', 'ǔ', 'ǚ', 'Ǎ', 'Ě', 'Ǐ', 'Ǒ', 'Ǔ', 'Ǚ'],
    ['à', 'è', 'ì', 'ò', 'ù', 'ǜ', 'À', 'È', 'Ì', 'Ò', 'Ù', 'Ǜ'],
  ];
  
  // Remove spaces to process each syllable
  const syllables = numericPinyin.split(' ');
  
  return syllables.map(syllable => {
    // Extract the tone number (if any)
    const toneMatch = syllable.match(/([1-5])$/);
    if (!toneMatch) return syllable; // No tone number found
    
    const tone = parseInt(toneMatch[1]) - 1;
    if (tone < 0 || tone > 4) return syllable; // Invalid tone
    
    // Neutral tone (5) doesn't need a tone mark
    if (tone === 4) return syllable.replace(/5$/, '');
    
    // Remove the tone number
    let result = syllable.replace(/[1-5]$/, '');
    
    // Find the vowel to apply tone mark to
    // Priority: a, e, i, o, u
    let vowelIndex = -1;
    
    if (result.includes('a')) {
      vowelIndex = result.indexOf('a');
    } else if (result.includes('e')) {
      vowelIndex = result.indexOf('e');
    } else if (result.includes('ou')) {
      vowelIndex = result.indexOf('o');
    } else if (result.includes('i')) {
      vowelIndex = result.indexOf('i');
    } else if (result.includes('o')) {
      vowelIndex = result.indexOf('o');
    } else if (result.includes('u')) {
      vowelIndex = result.indexOf('u');
    } else if (result.includes('ü')) {
      vowelIndex = result.indexOf('ü');
    }
    
    if (vowelIndex === -1) return result;
    
    // Apply tone mark
    const vowel = result.charAt(vowelIndex);
    const vowelPosition = vowels.indexOf(vowel);
    
    if (vowelPosition === -1) return result;
    
    return (
      result.substring(0, vowelIndex) +
      toneMarks[tone][vowelPosition] +
      result.substring(vowelIndex + 1)
    );
  }).join(' ');
}