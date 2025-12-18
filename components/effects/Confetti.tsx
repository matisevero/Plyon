
import React, { useEffect, useRef } from 'react';

const Confetti: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const pieces: any[] = [];
    const numberOfPieces = 200;
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];

    function createPieces() {
      for (let i = 0; i < numberOfPieces; i++) {
        pieces.push({
          x: Math.random() * width,
          y: Math.random() * height - height,
          r: Math.random() * 6 + 4,
          d: Math.random() * numberOfPieces,
          color: colors[Math.floor(Math.random() * colors.length)],
          tilt: Math.floor(Math.random() * 10) - 10,
          tiltAngleIncremental: Math.random() * 0.07 + 0.05,
          tiltAngle: 0
        });
      }
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < pieces.length; i++) {
        const p = pieces[i];
        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt, p.y);
        ctx.lineTo(p.x, p.y + p.tilt + p.r);
        ctx.stroke();
      }
      update();
    }

    let animationFrameId: number;
    function update() {
      let remainingFlakes = 0;
      for (let i = 0; i < pieces.length; i++) {
        const p = pieces[i];
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d + p.r) + 1 + p.r / 2) / 1.5;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle) * 15;

        if (p.y < height) {
            remainingFlakes++;
        }

        if (p.x > width + 30 || p.x < -30 || p.y > height) {
          if (i % 5 > 0 || i % 2 === 0) {
            pieces[i] = { ...p, x: Math.random() * width, y: -30, tilt: Math.floor(Math.random() * 10) - 10 };
          } else {
            if (Math.sin(p.tiltAngle) > 0) {
              pieces[i] = { ...p, x: -30, y: Math.random() * height, tilt: Math.floor(Math.random() * 10) - 10 };
            } else {
              pieces[i] = { ...p, x: width + 30, y: Math.random() * height, tilt: Math.floor(Math.random() * 10) - 10 };
            }
          }
        }
      }
      if(remainingFlakes > 0) {
        animationFrameId = requestAnimationFrame(draw);
      }
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    createPieces();
    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9998 }} />;
};

export default Confetti;
