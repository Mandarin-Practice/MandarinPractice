import { useRef } from 'react';

/**
 * Hook for playing sound effects for feedback
 */
export function useSoundEffects() {
  // References to audio elements
  const correctAudioRef = useRef<HTMLAudioElement | null>(null);
  const incorrectAudioRef = useRef<HTMLAudioElement | null>(null);

  /**
   * Initialize the audio elements 
   */
  const initSoundEffects = () => {
    if (!correctAudioRef.current) {
      correctAudioRef.current = new Audio();
      correctAudioRef.current.src = "data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFzb25pY1N0dWRpb3MuY29tAFRYWFgAAAAhAAADY29weXJpZ2h0AENDMCBQdWJsaWMgRG9tYWluAFRJVDIAAAAHAAADSURGADMARU5DAAAABAAAAAAAAE1FVAAAAAANAAADTGF2ZjU4LjEyLjEwMABBUFBSAAAANAAAAGNvbW0ub2dncy5sYXZmNTguMTcuMTAwLmV4cGVyaW1lbnRhbC5ub190aW1lc3RhbXAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/80DAAAANWAGH+AAAP9tEkxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMQAAANUAYPAAAAP/a5DBAABnvY7//+AQP/////y35t////5c//////fT////4G/+u///////////v3/J9J6gbyCwRsHm+xwEbB57wMdPsfnvfPe/l//+BhT//5QZa//5hnZDcTvdjUNvl99YFhv0tkG7vF0DmHcDX+a/zJ6///gYYmxYvllss3fKUv//6WplpYakV0QvS3/jqgC//s3/+WX//+vrkJb/5aX////////////43///05//////////w13////////1v////////+///vUAFAHIZM45JtjSyXiVknl1BBIp5hHMmCLkxN5qs0NuQotbvUHQKP/81DEIgJBJnRb/9l0TsyJFOqiiLEjVNfKOOXxY7uMkgSNl0M//EvhgQDVbZ+C8wWDQpBL2fl5bcFgqBwLnuCWXQOAwJxK2vhqCwVmeLJaFZc9tlQXBhiytcFgTBaYGBQCIJAu7Pj4EwhMNy+6GJplm33mEL4YWGj2hVAeHzHC6DwwGWB4aEMy0wLxYAZMXl+KqTEFNRTMuOTkuNKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NQxCYKWYac/QxkToqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";
      correctAudioRef.current.volume = 0.5;
    }

    if (!incorrectAudioRef.current) {
      incorrectAudioRef.current = new Audio();
      incorrectAudioRef.current.src = "data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFzb25pY1N0dWRpb3MuY29tAFRYWFgAAAAhAAADY29weXJpZ2h0AENDMCBQdWJsaWMgRG9tYWluAFRJVDIAAAAHAAADSURGADMAVFBFMQAAAAwAAANMYXZmNTguMTYuMTAwVEFMQgAAAAUAAABidXp6AFRDT00AAAAcAAADZW5naW5lZXIAVGVhbSBBdWRpbyBMaXRlcmFjeQBUWUVSAAAABQAAADIwMTcAVENPTgAAAAUAAABPdGhlcgBQUklWAPwzAAAAAANwYwB4AAAAAAABUFNJRAM2lwEAAAgAAIAmf///+MAHoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/84DEABv13pKXmYAAMTQdNBQEgAhAwYH6D44Q4cOHhxwcOG7gcH/h8wYQDhhA4MOHB9/B8HwcHlz+Dh/B/wP8MkiAYMOHDh+g+DD/yjlHDf//+U85RyjhheofmCwz+0ciBpk+1Uf/3v/s0jH/6r//tHeUd////6iPeL/u3iI9KjvKmvqvB38N7j31O/31FX+WvqVd4QV92t6C9a/2T8Z76n/z3r86V2zUtFuFa3DgLAoBQCgFAKAUAoBQCgFAKAUAoBQCgFAKAUAoBQCgFAKAUAoBQCgFAKAUAoBQCgFAKAUAoBQCgFAKAUAoBQCgFAKA//OAxAUoVC6A94FAAP8oBQCgFAKAUAoBQCgFAKAUAoBQCgFAKAUAoBQCgFAKAUAoBQCgFAKAUAoBQCgFAKAUAo4HBxGOIxyAMU5jnMdcCQMhMR1wOD4PB7//BxyyXfgg6Pd8uCH/Cw+XKvcH+PkBGQicmWM8vYPgyP1VXKtX/UeT/l5UrqX//Uuny8qV1L//qXUvl3Lb////////p///////9S+Xcv/////////qpQoQU1FMy45OS41qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv/zgMQjLcwmgP+0gAKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";
      incorrectAudioRef.current.volume = 0.5;
    }
  };

  /**
   * Play the correct answer sound
   */
  const playCorrectSound = () => {
    initSoundEffects();
    if (correctAudioRef.current) {
      correctAudioRef.current.currentTime = 0;
      correctAudioRef.current.play().catch(e => {
        console.error("Error playing correct sound:", e);
      });
    }
  };

  /**
   * Play the incorrect answer sound
   */
  const playIncorrectSound = () => {
    initSoundEffects();
    if (incorrectAudioRef.current) {
      incorrectAudioRef.current.currentTime = 0;
      incorrectAudioRef.current.play().catch(e => {
        console.error("Error playing incorrect sound:", e);
      });
    }
  };

  return {
    playCorrectSound,
    playIncorrectSound
  };
}