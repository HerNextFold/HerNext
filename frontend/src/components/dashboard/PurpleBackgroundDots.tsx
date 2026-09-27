import React, { useEffect, useRef } from 'react';

interface PurpleBackgroundDotsProps {
  className?: string;
  dotCount?: number;
}

export const PurpleBackgroundDots: React.FC<PurpleBackgroundDotsProps> = ({ 
  className = '', 
  dotCount = 45 
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Color palette for purple aesthetic
    const colors = [
      'rgba(140, 63, 150, 0.45)', // #8C3F96 purple
      'rgba(186, 104, 200, 0.35)', // soft lilac
      'rgba(240, 90, 126, 0.35)',  // pinkish magenta
      'rgba(126, 87, 194, 0.40)',  // deep lavender
      'rgba(171, 71, 188, 0.30)',  // electric orchid
    ];

    interface Particle {
      x: number;
      y: number;
      radius: number;
      color: string;
      vx: number;
      vy: number;
      alpha: number;
      alphaSpeed: number;
      pulse: number;
    }

    const particles: Particle[] = [];
    const count = Math.min(dotCount, Math.floor((width * height) / 25000) + 20);

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.8 + 1.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        alpha: Math.random() * 0.6 + 0.2,
        alphaSpeed: (Math.random() * 0.01 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
        pulse: Math.random() * Math.PI * 2,
      });
    }

    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Draw subtle connecting lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            const lineAlpha = (1 - dist / 110) * 0.12;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(168, 85, 247, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw floating glowing dots
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around borders gently
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        // Alpha pulsing
        p.alpha += p.alphaSpeed;
        if (p.alpha > 0.8 || p.alpha < 0.2) {
          p.alphaSpeed = -p.alphaSpeed;
        }

        const currentRadius = p.radius + Math.sin(time + p.pulse) * 0.6;

        // Outer soft glow
        const gradient = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, currentRadius * 3.5
        );
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, 'rgba(140, 63, 150, 0)');

        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, currentRadius * 3), 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, currentRadius), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [dotCount]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`pointer-events-none absolute inset-0 w-full h-full z-0 opacity-80 ${className}`} 
      aria-hidden="true"
    />
  );
};

export default PurpleBackgroundDots;
