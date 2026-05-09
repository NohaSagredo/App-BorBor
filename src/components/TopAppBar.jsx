import React from 'react';
import { Coins, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeProvider';

export default function TopAppBar({ avatarUrl, partnerAvatarUrl, level = 1, coins = 0, homeRoute = '/mujer' }) {
  const navigate = useNavigate();
  const { themeId, setTheme, themes } = useTheme();

  const cycleTheme = () => {
    const themeIds = Object.keys(themes);
    const nextIndex = (themeIds.indexOf(themeId) + 1) % themeIds.length;
    setTheme(themeIds[nextIndex]);
  };

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        background: 'rgba(8, 6, 14, 0.80)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Avatar propio + (opcional) Avatar pareja */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Grupo de avatares — propio + pareja */}
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          {/* Avatar propio */}
          <button
            onClick={() => navigate('/perfil')}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              padding: '2px',
              background: 'linear-gradient(135deg, var(--color-primary, #f43f5e), var(--color-secondary, #c084fc))',
              flexShrink: 0,
              overflow: 'hidden',
              border: 'none',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              zIndex: 2,
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 0 12px rgba(244,63,94,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            aria-label="Ir a Perfil"
          >
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%',
              overflow: 'hidden', background: '#1e1b2e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <span style={{ fontSize: '1.2rem' }}>👤</span>
              )}
            </div>
          </button>

          {/* Avatar pareja (solo si está vinculado) */}
          {partnerAvatarUrl && (
            <div style={{ position: 'relative', marginLeft: '-10px', zIndex: 1 }}>
              {/* Anillo de vinculación */}
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                padding: '2px',
                background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                flexShrink: 0, overflow: 'hidden',
                boxShadow: '0 0 8px rgba(56,189,248,0.4)',
              }}>
                <div style={{
                  width: '100%', height: '100%', borderRadius: '50%',
                  overflow: 'hidden', background: '#1e1b2e',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <img src={partnerAvatarUrl} alt="Pareja" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              </div>
              {/* Icono de vinculación */}
              <span style={{
                position: 'absolute', bottom: -3, right: -3,
                background: 'linear-gradient(135deg, #f43f5e, #c084fc)',
                borderRadius: '50%', width: 14, height: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.5rem', border: '1.5px solid rgba(8,6,14,0.9)',
                zIndex: 3,
              }}>💞</span>
            </div>
          )}
        </div>

        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--color-primary, #f43f5e)',
          background: 'rgba(255,255,255,0.06)',
          padding: '2px 8px',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.1)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          Lv {level}
        </span>
      </div>

      {/* Brand (clickeable → Inicio) */}
      <button
        onClick={() => navigate(homeRoute)}
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          fontSize: '1.3rem',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          background: 'linear-gradient(90deg, var(--color-primary, #f43f5e), var(--color-secondary, #c084fc))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          whiteSpace: 'nowrap',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          transition: 'opacity 0.2s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.75'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        aria-label="Ir a Inicio"
      >
        BorBor
      </button>

      {/* Theme Toggle + Coins */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Theme Cycle Button */}
        <button
          onClick={cycleTheme}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.14)';
            e.currentTarget.style.transform = 'rotate(30deg) scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
            e.currentTarget.style.transform = 'rotate(0) scale(1)';
          }}
          aria-label="Cambiar Tema"
        >
          <Palette size={14} style={{ color: 'var(--color-accent, #c084fc)' }} strokeWidth={2.2} />
        </button>

        {/* Coins */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          background: 'rgba(255,255,255,0.07)',
          padding: '5px 12px',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.10)',
        }}>
          <Coins size={14} style={{ color: '#fbbf24' }} strokeWidth={2.5} />
          <span style={{
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            fontSize: '13px',
            fontWeight: 700,
            color: '#f1f5f9',
          }}>
            {coins.toLocaleString()}
          </span>
        </div>
      </div>
    </motion.header>
  );
}
