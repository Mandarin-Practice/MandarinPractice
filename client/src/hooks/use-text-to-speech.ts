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
  const [preferredVoice, setPreferredVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speechRate, setSpeechRate] = useState<number>(1.0);

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
        
        // Look for Google Taiwan voice as preferred default
        const googleTWVoice = availableVoices.find(v => 
          v.name.includes('Google') && v.lang.includes('zh-TW')
        );
        
        if (googleTWVoice) {
          // Set Google TW voice as default in localStorage
          localStorage.setItem('selectedVoiceURI', googleTWVoice.voiceURI);
          setPreferredVoice(googleTWVoice);
          // console.log('Set default voice to Google Taiwan:', googleTWVoice.name);
        }

        // Check for saved voice preference (this will override only if user has explicitly set a preference)
        const savedVoiceURI = localStorage.getItem('selectedVoiceURI');
        if (savedVoiceURI) {
          const savedVoice = availableVoices.find(v => v.voiceURI === savedVoiceURI);
          if (savedVoice) {
            setPreferredVoice(savedVoice);
            // console.log('Loaded preferred voice:', savedVoice.name);
          }
        }

        // Check for saved speech rate
        const savedSpeechRate = localStorage.getItem('speechRate');
        if (savedSpeechRate) {
          setSpeechRate(parseFloat(savedSpeechRate));
        }
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
      
      // Get saved speech rate if not provided in options
      const savedRate = localStorage.getItem('speechRate');
      const storedRate = savedRate ? parseFloat(savedRate) : 1.0;
      
      // Apply options
      utterance.rate = options.rate ?? storedRate;
      utterance.pitch = options.pitch ?? 1;
      utterance.volume = options.volume ?? 1;
      
      // Use a Mandarin voice if available and not overridden by options
      if (!options.voice) {
        // Try to use preferred voice first if available
        const savedVoiceURI = localStorage.getItem('selectedVoiceURI');
        if (savedVoiceURI && voices.length > 0) {
          const savedVoice = voices.find(v => v.voiceURI === savedVoiceURI);
          if (savedVoice) {
            utterance.voice = savedVoice;
          } else if (mandarinVoices.length > 0) {
            utterance.voice = mandarinVoices[0];
          } else if (options.lang) {
            utterance.lang = options.lang;
          } else {
            // Default to Mandarin Chinese if no specific voice is found
            utterance.lang = 'zh-CN';
          }
        } else if (mandarinVoices.length > 0) {
          utterance.voice = mandarinVoices[0];
        } else if (options.lang) {
          utterance.lang = options.lang;
        } else {
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
  }, [voices, mandarinVoices]);

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
    preferredVoice,
  };
}
