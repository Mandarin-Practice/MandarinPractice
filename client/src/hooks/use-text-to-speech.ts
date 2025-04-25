import { useCallback, useEffect, useState } from 'react';

type TTSOptions = {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice;
  lang?: string;
};

const MANDARIN_LANG_CODES = ['zh-CN', 'zh-TW', 'zh', 'zh-HK'];

export function useTextToSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [mandarinVoices, setMandarinVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize voices when available
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        const mandarinVoicesResult = availableVoices.filter(voice => 
          MANDARIN_LANG_CODES.some(code => voice.lang.includes(code))
        );
        setMandarinVoices(mandarinVoicesResult);
      }
    };

    // Load voices immediately if they're already available
    loadVoices();

    // Otherwise, wait for them to be loaded
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    // Handle speech synthesis end
    const handleEnd = () => {
      setIsPlaying(false);
    };

    // Handle speech synthesis errors
    const handleError = () => {
      setIsPlaying(false);
      setError('Speech synthesis error occurred');
    };

    window.speechSynthesis.addEventListener('end', handleEnd);
    window.speechSynthesis.addEventListener('error', handleError);

    return () => {
      window.speechSynthesis.removeEventListener('end', handleEnd);
      window.speechSynthesis.removeEventListener('error', handleError);
    };
  }, []);

  const speak = useCallback((text: string, options: TTSOptions = {}) => {
    try {
      if (!window.speechSynthesis) {
        throw new Error('Speech synthesis not supported in this browser');
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Create a new utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply options
      utterance.rate = options.rate ?? 1;
      utterance.pitch = options.pitch ?? 1;
      utterance.volume = options.volume ?? 1;
      
      // Use a Mandarin voice if available and not overridden by options
      if (!options.voice) {
        // Try to find a Mandarin voice
        if (mandarinVoices.length > 0) {
          utterance.voice = mandarinVoices[0];
        } else if (options.lang) {
          utterance.lang = options.lang;
        } else {
          // Default to Mandarin Chinese if no specific voice is found
          utterance.lang = 'zh-CN';
        }
      } else {
        utterance.voice = options.voice;
      }

      // Setup event handlers for this utterance
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => {
        setIsPlaying(false);
        setError('Error playing speech');
      };

      // Start speaking
      window.speechSynthesis.speak(utterance);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('TTS error:', err);
    }
  }, [mandarinVoices]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  }, []);

  return {
    speak,
    stop,
    isPlaying,
    error,
    voices,
    mandarinVoices,
  };
}
