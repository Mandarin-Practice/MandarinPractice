import { useEffect, useState } from 'react';

/**
 * Hook for playing sound effects for feedback
 */
export function useSoundEffects() {
  const [correctAudio] = useState(() => {
    if (typeof window !== 'undefined') {
      // Create audio context on first use
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create oscillator for correct sound (higher pitch)
        const playCorrect = () => {
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          
          // Configure oscillator
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
          
          // Configure gain (volume)
          gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
          
          // Connect nodes
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          // Play sound
          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.3);
        };
        
        return playCorrect;
      } catch (e) {
        console.error("Could not initialize audio context:", e);
        return () => {};
      }
    }
    return () => {};
  });
  
  const [incorrectAudio] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create oscillator for incorrect sound (buzzer-like)
        const playIncorrect = () => {
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          
          // Configure oscillator
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(220, audioCtx.currentTime); // A3 note
          oscillator.frequency.setValueAtTime(180, audioCtx.currentTime + 0.1); // Drop pitch slightly
          
          // Configure gain (volume)
          gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
          
          // Connect nodes
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          // Play sound
          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.2);
        };
        
        return playIncorrect;
      } catch (e) {
        console.error("Could not initialize audio context:", e);
        return () => {};
      }
    }
    return () => {};
  });

  /**
   * Play the correct answer sound
   */
  const playCorrectSound = () => {
    try {
      correctAudio();
    } catch (e) {
      console.error("Error playing correct sound:", e);
    }
  };

  /**
   * Play the incorrect answer sound
   */
  const playIncorrectSound = () => {
    try {
      incorrectAudio();
    } catch (e) {
      console.error("Error playing incorrect sound:", e);
    }
  };

  return {
    playCorrectSound,
    playIncorrectSound
  };
}