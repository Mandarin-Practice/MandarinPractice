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
        
        // Create a melodic ding sound (more pleasant chime)
        const playCorrect = () => {
          // Create multiple oscillators for a richer sound
          const oscillator1 = audioCtx.createOscillator();
          const oscillator2 = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          
          // Configure main oscillator (higher note)
          oscillator1.type = 'sine';
          oscillator1.frequency.setValueAtTime(1047, audioCtx.currentTime); // C6 note
          oscillator1.frequency.setValueAtTime(1319, audioCtx.currentTime + 0.1); // E6 note
          
          // Configure second oscillator (complementary note)
          oscillator2.type = 'triangle';
          oscillator2.frequency.setValueAtTime(784, audioCtx.currentTime); // G5 note
          oscillator2.frequency.setValueAtTime(988, audioCtx.currentTime + 0.1); // B5 note
          
          // Configure gain for pleasant decay
          gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
          gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime + 0.1);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
          
          // Connect nodes
          oscillator1.connect(gainNode);
          oscillator2.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          // Play sound
          oscillator1.start();
          oscillator2.start();
          oscillator1.stop(audioCtx.currentTime + 0.4);
          oscillator2.stop(audioCtx.currentTime + 0.4);
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
        
        // Create a more distinctive "egh" buzzer sound
        const playIncorrect = () => {
          // Create two oscillators for a richer buzzer sound
          const oscillator1 = audioCtx.createOscillator();
          const oscillator2 = audioCtx.createOscillator();
          const filterNode = audioCtx.createBiquadFilter();
          const gainNode = audioCtx.createGain();
          
          // Configure main oscillator
          oscillator1.type = 'sawtooth';
          oscillator1.frequency.setValueAtTime(220, audioCtx.currentTime); // A3 note
          oscillator1.frequency.setValueAtTime(165, audioCtx.currentTime + 0.1); // E3 note, dropping pitch
          
          // Configure second oscillator for dissonance
          oscillator2.type = 'square';
          oscillator2.frequency.setValueAtTime(233, audioCtx.currentTime); // Bb3 - dissonant with A3
          oscillator2.frequency.setValueAtTime(175, audioCtx.currentTime + 0.1); // F3 - dissonant with E3
          
          // Configure filter to emphasize buzzer quality
          filterNode.type = 'lowpass';
          filterNode.frequency.value = 1000;
          filterNode.Q.value = 10;
          
          // Configure gain with fast attack and medium release
          gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
          
          // Connect nodes
          oscillator1.connect(filterNode);
          oscillator2.connect(filterNode);
          filterNode.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          // Play sound
          oscillator1.start();
          oscillator2.start();
          oscillator1.stop(audioCtx.currentTime + 0.3);
          oscillator2.stop(audioCtx.currentTime + 0.3);
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