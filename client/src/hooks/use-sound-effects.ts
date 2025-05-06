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
        
        // Create a xylophone/bell sound effect
        const playCorrect = () => {
          // Create oscillator for the bell sound
          const oscillator = audioCtx.createOscillator();
          
          // Create gain nodes for envelope shaping
          const mainGainNode = audioCtx.createGain();
          const delayGainNode = audioCtx.createGain();
          
          // Create a biquad filter for tonal shaping
          const filter = audioCtx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.value = 1800;
          filter.Q.value = 2;
          
          // Configure oscillator
          oscillator.type = 'sine';
          oscillator.frequency.value = 1760; // A6 - high xylophone note
          
          // Configure main gain node with attack and decay
          mainGainNode.gain.setValueAtTime(0, audioCtx.currentTime);
          mainGainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01); // Sharp attack
          mainGainNode.gain.setValueAtTime(0.2, audioCtx.currentTime + 0.02);
          mainGainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5); // Long decay
          
          // Configure delay gain for nice decay
          delayGainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
          delayGainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
          
          // Create a delay node for a slight echo
          const delay = audioCtx.createDelay(0.5);
          delay.delayTime.value = 0.1;
          
          // Connect nodes
          oscillator.connect(filter);
          filter.connect(mainGainNode);
          mainGainNode.connect(audioCtx.destination);
          
          // Add delay path for echo effect
          mainGainNode.connect(delay);
          delay.connect(delayGainNode);
          delayGainNode.connect(audioCtx.destination);
          
          // Play the sound
          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.8);
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