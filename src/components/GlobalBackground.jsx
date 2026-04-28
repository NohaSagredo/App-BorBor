import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from './ThemeProvider';

export default function GlobalBackground() {
  const { animMode, theme, themeId } = useTheme();
  // Estado local para reaccionar a KegelsModule
  const [kegelPhase, setKegelPhase] = useState('IDLE'); // IDLE, PREPARE, CONTRACT, RELAX, FEEDBACK, DONE
  const [kegelTime, setKegelTime] = useState(0);

  useEffect(() => {
    const handleEvent = (e) => {
      setKegelPhase(e.detail.phase);
      setKegelTime(Math.max(1, e.detail.time || 1)); // min 1s
    };
    window.addEventListener('kegelPhaseChange', handleEvent);
    return () => window.removeEventListener('kegelPhaseChange', handleEvent);
  }, []);

  if (!animMode || animMode === 'none') return null;

  // Condiciones específicas para que luciérnagas destaquen en temas oscuros
  const isNightTheme = themeId === 'midnight' || themeId === 'boldnight';
  const particleColor = isNightTheme ? theme?.vars?.['--color-accent'] : theme?.vars?.['--color-primary'];

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1, pointerEvents: 'none', overflow: 'hidden' }}>
      {animMode === 'aura' && <Aura phase={kegelPhase} time={kegelTime} color={theme?.vars?.['--color-primary']} secondary={theme?.vars?.['--color-secondary']} />}
      {animMode === 'particles' && <Particles phase={kegelPhase} time={kegelTime} color={particleColor} />}
    </div>
  );
}

// ========================
// 1. AURA RESPIRATORIA
// ========================
const Aura = ({ phase, time, color, secondary }) => {
  // Calculamos CSS transform en base a la fase
  let scale = 1.0;
  let opacity = 0.4;
  
  if (phase === 'CONTRACT') {
    scale = 0.5; // Inhala, núcleo de energía concentrado
    opacity = 1;
  } else if (phase === 'RELAX' || phase === 'PREPARE') {
    scale = 1.6; // Exhala, se esparce y se relaja
    opacity = 0.3;
  } else if (phase === 'FEEDBACK' || phase === 'DONE') {
    scale = 1.0;
    opacity = 0.2;
  }

  const transitionStyle = `transform ${time}s ease-in-out, opacity ${time}s ease-in-out`;

  return (
    <>
      <div style={{
        position: 'absolute', top: '20%', left: '10%', width: '60vw', height: '60vw',
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: 'blur(100px)', borderRadius: '50%',
        willChange: 'transform, opacity',
        transform: `scale(${scale}) translate(${phase === 'CONTRACT' ? '20%' : '0'}, ${phase === 'CONTRACT' ? '20%' : '0'})`,
        opacity: opacity, transition: transitionStyle
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '10%', width: '50vw', height: '50vw',
        background: `radial-gradient(circle, ${secondary || color} 0%, transparent 70%)`,
        filter: 'blur(80px)', borderRadius: '50%', mixBlendMode: 'screen',
        willChange: 'transform, opacity',
        transform: `scale(${scale * 0.9}) translate(${phase === 'CONTRACT' ? '-20%' : '0'}, ${phase === 'CONTRACT' ? '-20%' : '0'})`,
        opacity: opacity * 0.8, transition: transitionStyle
      }} />
    </>
  );
};

// ========================
// 3. POLVO DE ESTRELLAS
// ========================
const Particles = ({ phase, time, color }) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // init particles
    if (particlesRef.current.length === 0) {
      const p = [];
      const numParticles = 80;
      for (let i = 0; i < numParticles; i++) {
        p.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 1,
          baseOp: Math.random() * 0.5 + 0.3,
          blinkOffset: Math.random() * Math.PI * 2,
          blinkSpeed: Math.random() * 0.04 + 0.01
        });
      }
      particlesRef.current = p;
    }

    const centerX = width / 2;
    const centerY = height / 2;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const targetX = centerX;
      const targetY = centerY;

      particlesRef.current.forEach(p => {
        // Lógica Gravedad/Flujo
        if (phase === 'CONTRACT') {
          // Fuerza de atracción al centro
          const dx = targetX - p.x;
          const dy = targetY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 0.05 * (time > 0 ? (5 / time) : 1); // Más rápido si hay menos tiempo
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
          // Amortiguación
          p.vx *= 0.95;
          p.vy *= 0.95;
        } else if (phase === 'RELAX') {
          // Fuerza de expansión controlada si están cerca del centro
          const dx = p.x - targetX;
          const dy = p.y - targetY;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < width * 0.5) {
             const force = 0.02;
             p.vx += (dx / dist) * force;
             p.vy += (dy / dist) * force;
          }
          // Flotar natural
          p.vy -= 0.005; // tendencia a subir lento como brasas
          p.vx *= 0.98;
          p.vy *= 0.98;
        } else {
          // IDLE: Flotar vagamente como luciérnagas
          p.vx += (Math.random() - 0.5) * 0.015 + Math.sin(p.blinkOffset) * 0.005;
          p.vy += (Math.random() - 0.5) * 0.015 + Math.cos(p.blinkOffset) * 0.005;
          p.vx *= 0.99;
          p.vy *= 0.99;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Actualizar el offset de parpadeo (Blink logic)
        p.blinkOffset += p.blinkSpeed;
        const sinOscillation = p.baseOp + Math.sin(p.blinkOffset) * 0.4;
        const currentOp = Math.max(0.1, Math.min(1.0, sinOscillation));

        // Wrap boundaries
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (phase === 'CONTRACT' ? 1.5 : 1), 0, Math.PI * 2);
        
        // Efecto premium de resplandor (Glow)
        ctx.shadowBlur = p.size * 6;
        ctx.shadowColor = color;

        ctx.fillStyle = color;
        // opacidad pulsante
        const pulse = phase === 'CONTRACT' ? 1 : currentOp;
        ctx.globalAlpha = pulse;
        ctx.fill();
        
        // Reset shadow for next particle to avoid compounding performance hit
        ctx.shadowBlur = 0;
        
        // Glow effect for larger particles (Orbes)
        if (p.size > 2.5) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3.5, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.globalAlpha = pulse * 0.25;
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1.0;
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      width = canvas.width;
      height = canvas.height;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [phase, time, color]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
};
