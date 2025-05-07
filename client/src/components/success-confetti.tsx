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

export default function SuccessConfetti({ active, duration = 600 }: SuccessConfettiProps) {
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiSource, setConfettiSource] = useState({
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  });

  // Find the input element position when activated
  useEffect(() => {
    if (active) {
      const inputElement = document.getElementById('translation-input');
      if (inputElement) {
        const rect = inputElement.getBoundingClientRect();
        setConfettiSource({
          x: rect.x,
          y: rect.y,
          w: rect.width,
          h: rect.height,
        });
      }
    }
  }, [active]);

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      
      // Update confetti source position on resize if input exists
      const inputElement = document.getElementById('translation-input');
      if (inputElement) {
        const rect = inputElement.getBoundingClientRect();
        setConfettiSource({
          x: rect.x,
          y: rect.y,
          w: rect.width,
          h: rect.height,
        });
      }
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
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 'var(--z-tooltip)' }}>
      <Confetti
        width={windowDimensions.width}
        height={windowDimensions.height}
        numberOfPieces={150}
        recycle={false}
        colors={['#FFEB3B', '#FFC107', '#FFD700', '#F9A825', '#FDD835']} // Different shades of yellow
        drawShape={(ctx) => {
          const size = Math.random() * 10 + 10; // Random size between 10 and 20
          drawStar(ctx, 0, 0, size);
        }}
        initialVelocityY={-8} // Shoot upward more strongly
        gravity={0.35} // Slightly more gravity
        confettiSource={confettiSource}
      />
    </div>
  );
}