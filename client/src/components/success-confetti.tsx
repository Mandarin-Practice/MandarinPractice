import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';

interface SuccessConfettiProps {
  active: boolean;
  duration?: number;
}

export default function SuccessConfetti({ active, duration = 3000 }: SuccessConfettiProps) {
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (active) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [active, duration]);

  if (!showConfetti) return null;

  return (
    <Confetti
      width={windowDimensions.width}
      height={windowDimensions.height}
      numberOfPieces={250}
      recycle={false}
      colors={['#cc0000', '#ff4444', '#ffffff', '#ffaaaa', '#ff8888']} // Red and white theme
      confettiSource={{
        x: windowDimensions.width / 2,
        y: windowDimensions.height / 3,
        w: 0,
        h: 0,
      }}
    />
  );
}