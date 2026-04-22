import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Sparkles } from 'lucide-react';

export default function Welcome() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Staggered entrance animation
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* ═══ Estilos de animación ═══ */}
      <style>{`
        @keyframes welcomeOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -20px) scale(1.1); }
          50% { transform: translate(-10px, -40px) scale(0.95); }
          75% { transform: translate(-30px, 10px) scale(1.05); }
        }
        @keyframes welcomeOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-25px, 25px) scale(1.15); }
          66% { transform: translate(20px, -15px) scale(0.9); }
        }
        @keyframes welcomeOrb3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          50% { transform: translate(15px, -30px) scale(1.2); opacity: 0.5; }
        }
        @keyframes welcomeLogoFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes welcomeRingRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes welcomeShine {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        @keyframes welcomeStagger1 {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes welcomeStagger2 {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes welcomePulseGlow {
          0%, 100% { box-shadow: 0 0 30px rgba(var(--color-primary-rgb, 244, 63, 94), 0.15); }
          50% { box-shadow: 0 0 50px rgba(var(--color-primary-rgb, 244, 63, 94), 0.3); }
        }
        .welcome-btn-primary {
          position: relative;
          width: 100%;
          padding: 1rem 1.5rem;
          border: none;
          border-radius: 18px;
          background: var(--btn-primary-gradient);
          color: var(--btn-text-color, #fff);
          font-size: 1.05rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          overflow: hidden;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
          box-shadow: 0 8px 30px rgba(var(--color-primary-rgb, 244, 63, 94), 0.35);
        }
        .welcome-btn-primary:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 12px 40px rgba(var(--color-primary-rgb, 244, 63, 94), 0.45);
        }
        .welcome-btn-primary:active {
          transform: translateY(0) scale(0.98);
        }
        .welcome-btn-primary::after {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: welcomeShine 3s ease-in-out infinite;
        }
        .welcome-btn-outline {
          width: 100%;
          padding: 1rem 1.5rem;
          border: 2px solid var(--glass-border, rgba(255,255,255,0.15));
          border-radius: 18px;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(8px);
          color: var(--color-text-main);
          font-size: 1.05rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.25s ease;
        }
        .welcome-btn-outline:hover {
          background: rgba(255,255,255,0.1);
          border-color: var(--color-primary);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.08);
        }
        .welcome-feature-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.3px;
          background: rgba(var(--color-primary-rgb, 244, 63, 94), 0.08);
          color: var(--color-primary);
          border: 1px solid rgba(var(--color-primary-rgb, 244, 63, 94), 0.12);
        }
      `}</style>

      {/* ═══ Orbes decorativos de fondo ═══ */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-15%',
        width: '280px', height: '280px', borderRadius: '50%',
        background: 'radial-gradient(circle, var(--color-primary), transparent 70%)',
        opacity: 0.12,
        animation: 'welcomeOrb1 12s ease-in-out infinite',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-5%', left: '-20%',
        width: '320px', height: '320px', borderRadius: '50%',
        background: 'radial-gradient(circle, var(--color-secondary), transparent 70%)',
        opacity: 0.1,
        animation: 'welcomeOrb2 15s ease-in-out infinite',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', top: '40%', left: '60%',
        width: '150px', height: '150px', borderRadius: '50%',
        background: 'radial-gradient(circle, var(--color-primary), transparent 70%)',
        opacity: 0.08,
        animation: 'welcomeOrb3 10s ease-in-out infinite',
        pointerEvents: 'none'
      }} />

      {/* ═══ LOGO + MARCA ═══ */}
      <div style={{
        marginBottom: '2.5rem',
        position: 'relative',
        zIndex: 2,
        animation: mounted ? 'welcomeStagger1 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'none',
        opacity: mounted ? 1 : 0
      }}>
        {/* Anillo decorativo detrás del logo */}
        <div style={{
          position: 'relative',
          width: '110px', height: '110px',
          margin: '0 auto 1.5rem auto'
        }}>
          {/* Anillo externo rotatorio */}
          <div style={{
            position: 'absolute', top: -8, left: -8, right: -8, bottom: -8,
            border: '2px dashed var(--color-primary)',
            borderRadius: '50%',
            opacity: 0.25,
            animation: 'welcomeRingRotate 20s linear infinite'
          }} />
          {/* Anillo medio */}
          <div style={{
            position: 'absolute', top: -3, left: -3, right: -3, bottom: -3,
            border: '1px solid var(--color-secondary)',
            borderRadius: '50%',
            opacity: 0.15,
            animation: 'welcomeRingRotate 30s linear infinite reverse'
          }} />
          {/* Círculo principal del logo */}
          <div style={{
            width: '100%', height: '100%',
            borderRadius: '50%',
            background: 'linear-gradient(145deg, var(--color-primary), var(--color-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 12px 40px rgba(var(--color-primary-rgb, 244, 63, 94), 0.3)',
            animation: 'welcomeLogoFloat 4s ease-in-out infinite, welcomePulseGlow 3s ease-in-out infinite',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Brillo interior */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 50%)',
              borderRadius: '50%', pointerEvents: 'none'
            }} />
            <span style={{ fontSize: '3.2rem', position: 'relative', zIndex: 2, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>🌸</span>
          </div>
        </div>

        {/* Título con gradiente */}
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 900,
          margin: 0,
          letterSpacing: '-1.5px',
          background: 'linear-gradient(135deg, var(--color-text-highlight), var(--color-primary))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: 'none',
          lineHeight: 1.1
        }}>
          Holística
        </h1>

        {/* Subtítulo elegante */}
        <p style={{
          color: 'var(--color-text-muted)',
          fontSize: '1.05rem',
          marginTop: '0.6rem',
          fontWeight: 500,
          letterSpacing: '0.5px'
        }}>
          Tu espacio íntimo, conectado.
        </p>
      </div>

      {/* ═══ TARJETA PRINCIPAL ═══ */}
      <div style={{
        width: '100%',
        maxWidth: '360px',
        position: 'relative',
        zIndex: 2,
        animation: mounted ? 'welcomeStagger2 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both' : 'none',
      }}>
        <div className="glass-panel" style={{
          padding: '2rem',
          background: 'rgba(var(--color-primary-rgb, 244, 63, 94), 0.03)',
          border: '1px solid var(--glass-border)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decoración sutil en esquina */}
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: '120px', height: '120px',
            background: 'radial-gradient(circle at top right, rgba(var(--color-primary-rgb, 244, 63, 94), 0.08), transparent 70%)',
            pointerEvents: 'none'
          }} />

          {/* Encabezado de la tarjeta */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{
              margin: 0,
              color: 'var(--color-text-main)',
              fontSize: '1.3rem',
              fontWeight: 800,
              letterSpacing: '-0.3px'
            }}>
              Comienza tu viaje
            </h2>
            <p style={{
              margin: '0.4rem 0 0',
              color: 'var(--color-text-muted)',
              fontSize: '0.82rem',
              lineHeight: 1.4
            }}>
              Bienestar pélvico, consciencia corporal y salud integral.
            </p>
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <button
              className="welcome-btn-primary"
              onClick={() => navigate('/auth')}
            >
              Iniciar Sesión
              <ArrowRight size={18} />
            </button>
            <button
              className="welcome-btn-outline"
              onClick={() => navigate('/auth?signup=true')}
            >
              <Sparkles size={16} />
              Crear Cuenta Nueva
            </button>
          </div>
        </div>

        {/* ═══ Tags de características ═══ */}
        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginTop: '1.2rem',
          animation: mounted ? 'welcomeStagger2 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both' : 'none',
        }}>
          <div className="welcome-feature-tag">🧘 Kegel Training</div>
          <div className="welcome-feature-tag">📊 Insights</div>
          <div className="welcome-feature-tag">📚 Academia</div>
        </div>
      </div>

      {/* ═══ Footer de seguridad ═══ */}
      <div style={{
        marginTop: '2.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: 'var(--color-text-muted)',
        fontSize: '0.75rem',
        fontWeight: 500,
        opacity: 0.6,
        position: 'relative',
        zIndex: 2,
        animation: mounted ? 'welcomeStagger2 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.7s both' : 'none',
      }}>
        <Shield size={13} />
        Sincronización encriptada de extremo a extremo
      </div>

    </div>
  );
}
