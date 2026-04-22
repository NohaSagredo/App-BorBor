import React from 'react';
import { useTheme } from './ThemeProvider';

export default function GlobalLoader({ text = "Cargando..." }) {
  const { theme } = useTheme();
  
  return (
    <div 
      className="animate-fade-in"
      style={{
        position: 'fixed',
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        backgroundColor: 'var(--color-bg)',
        zIndex: 999999,
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
    }}>
       {/* Animación Minimalista Premium */}
       <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          
          {/* Anillos rotativos (Más gruesos y vibrantes) */}
          <div style={{ 
              position: 'absolute', width: '100%', height: '100%', 
              border: '5px solid var(--color-primary)', 
              borderTopColor: 'transparent', 
              borderRadius: '50%', 
              filter: 'drop-shadow(0 0 8px var(--color-primary))',
              animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite' 
          }} />
          
          <div style={{ 
              position: 'absolute', width: '65%', height: '65%', 
              border: '5px solid var(--color-secondary)', 
              borderBottomColor: 'transparent', 
              borderRadius: '50%', 
              filter: 'drop-shadow(0 0 8px var(--color-secondary))',
              animation: 'spin-reverse 1.8s cubic-bezier(0.5, 0, 0.5, 1) infinite' 
          }} />
          
          {/* Logo Central Pulsante Dinámico */}
          <div style={{ 
              fontSize: '2.5rem', 
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              filter: `drop-shadow(0 0 15px var(--color-primary))`
          }}>
              {theme?.icon || '🌟'}
          </div>

       </div>

       <p style={{ 
           marginTop: '2rem', 
           color: 'var(--color-text-main)', 
           fontWeight: '800', 
           letterSpacing: '2px', 
           fontSize: '1.1rem',
           textTransform: 'uppercase',
           textShadow: '0 2px 10px rgba(0,0,0,0.1)',
           animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' 
       }}>
          {text}
       </p>

       <style>{`
          @keyframes spin {
             0% { transform: rotate(0deg); }
             100% { transform: rotate(360deg); }
          }
          @keyframes spin-reverse {
             0% { transform: rotate(360deg); }
             100% { transform: rotate(0deg); }
          }
          @keyframes pulse {
             0%, 100% { opacity: 1; transform: scale(1); }
             50% { opacity: 0.6; transform: scale(0.92); }
          }
       `}</style>
    </div>
  );
}
