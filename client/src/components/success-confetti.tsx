import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';

interface SuccessConfettiProps {
  active: boolean;
  duration?: number;
}

// Custom draw function to create star shapes
const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
  // Draw a 5-point star
  ctx.beginPath();
  const outerRadius = size / 2;
  const innerRadius = size / 5;
  const spikes = 5;
  
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (Math.PI / spikes) * i;
    const pointX = x + radius * Math.sin(angle);
    const pointY = y - radius * Math.cos(angle);
    
    if (i === 0) {
      ctx.moveTo(pointX, pointY);
    } else {
      ctx.lineTo(pointX, pointY);
    }
  }
  
  ctx.closePath();
  ctx.fill();
};

export default function SuccessConfetti({ active, duration = 1500 }: SuccessConfettiProps) {
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
      numberOfPieces={200}
      recycle={false}
      colors={['#FFEB3B', '#FFC107', '#FFD700', '#F9A825', '#FDD835']} // Different shades of yellow
      drawShape={(ctx) => {
        const size = Math.random() * 10 + 10; // Random size between 10 and 20
        drawStar(ctx, 0, 0, size);
      }}
      initialVelocityY={-5}
      gravity={0.3}
      wind={0.05}
      // Use the entire screen as the source for confetti (no specific origin point)
      confettiSource={{
        x: 0,
        y: 0,
        w: windowDimensions.width,
        h: 0,
      }}
    />
  );
}