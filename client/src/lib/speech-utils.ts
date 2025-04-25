/**
 * Detect if the browser supports Text-to-Speech
 * @returns Boolean indicating if TTS is supported
 */
export function isTTSSupported(): boolean {
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/**
 * Get available Mandarin TTS voices
 * @returns Array of available Mandarin voices
 */
export function getMandarinVoices(): SpeechSynthesisVoice[] {
  if (!isTTSSupported()) return [];
  
  const voices = window.speechSynthesis.getVoices();
  return voices.filter(voice => {
    // Mandarin language codes
    const mandarinCodes = ['zh-CN', 'zh-TW', 'zh', 'zh-HK'];
    return mandarinCodes.some(code => voice.lang.includes(code));
  });
}

/**
 * Speak text in Mandarin
 * @param text Chinese text to speak
 * @param rate Speech rate (0.1 to 10, default 1)
 * @param onEnd Callback function to run when speech ends
 * @returns The SpeechSynthesisUtterance object
 */
export function speakMandarin(
  text: string,
  rate: number = 1,
  onEnd?: () => void
): SpeechSynthesisUtterance | null {
  if (!isTTSSupported()) return null;
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Try to use a Mandarin voice
  const mandarinVoices = getMandarinVoices();
  if (mandarinVoices.length > 0) {
    utterance.voice = mandarinVoices[0];
  } else {
    // Fallback to language code if no specific voice
    utterance.lang = 'zh-CN';
  }
  
  // Set speech rate (clamp between 0.1 and 10)
  utterance.rate = Math.max(0.1, Math.min(10, rate));
  
  // Set callback for speech end if provided
  if (onEnd) {
    utterance.onend = onEnd;
  }
  
  window.speechSynthesis.speak(utterance);
  return utterance;
}
