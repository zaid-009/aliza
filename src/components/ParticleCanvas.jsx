import React, { useEffect, useRef } from 'react';

export const ParticleCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Create subtle, floating light particles
    const particleCount = Math.min(Math.floor(width / 35), 40);
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 1,
      color: Math.random() > 0.5 ? 'rgba(255, 107, 138, ' : 'rgba(139, 124, 255, ',
      alpha: Math.random() * 0.35 + 0.1,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: -Math.random() * 0.4 - 0.1, // slow upward drift
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Soft ambient background radial gradient
      const bgGlow = ctx.createRadialGradient(
        width / 2, height * 0.3, 50,
        width / 2, height * 0.3, width * 0.7
      );
      bgGlow.addColorStop(0, 'rgba(139, 124, 255, 0.04)');
      bgGlow.addColorStop(0.5, 'rgba(255, 107, 138, 0.02)');
      bgGlow.addColorStop(1, 'rgba(8, 10, 13, 0)');
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, width, height);

      // Draw floating particles
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color === 'rgba(255, 107, 138, ' ? '#FF6B8A' : '#8B7CFF';
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};
