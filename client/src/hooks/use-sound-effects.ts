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
        
        // Create a cheerful coin/award collection sound
        const playCorrect = () => {
          // Create two oscillators for the coin sound (double ping)
          const osc1 = audioCtx.createOscillator();
          const osc2 = audioCtx.createOscillator();
          
          // Create gain nodes
          const gainNode1 = audioCtx.createGain();
          const gainNode2 = audioCtx.createGain();
          
          // Configure oscillators for a coin-like sound
          // First oscillator - higher pitch for first "ping"
          osc1.type = 'triangle';
          osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
          osc1.frequency.setValueAtTime(1320, audioCtx.currentTime + 0.05); // E6 
          
          // Second oscillator - even higher for second "ping"
          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(1320, audioCtx.currentTime + 0.08); // E6
          osc2.frequency.setValueAtTime(1760, audioCtx.currentTime + 0.12); // A6
          
          // First gain - quick attack and decay for first ping
          gainNode1.gain.setValueAtTime(0, audioCtx.currentTime);
          gainNode1.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
          gainNode1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
          
          // Second gain - controls second ping which is slightly louder
          gainNode2.gain.setValueAtTime(0, audioCtx.currentTime);
          gainNode2.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.08); // Delay before attack
          gainNode2.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.09); 
          gainNode2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
          
          // Connect nodes
          osc1.connect(gainNode1);
          osc2.connect(gainNode2);
          gainNode1.connect(audioCtx.destination);
          gainNode2.connect(audioCtx.destination);
          
          // Play sound
          osc1.start(audioCtx.currentTime);
          osc2.start(audioCtx.currentTime);
          osc1.stop(audioCtx.currentTime + 0.1);
          osc2.stop(audioCtx.currentTime + 0.25);
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