import React from 'react';
import { Coins } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TopAppBar({ avatarUrl, level = 1, coins = 0 }) {
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
      {/* Avatar + Level */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          padding: '2px',
          background: 'linear-gradient(135deg, var(--color-primary, #f43f5e), var(--color-secondary, #c084fc))',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            overflow: 'hidden',
            background: '#1e1b2e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <span style={{ fontSize: '1.2rem' }}>👤</span>
            )}
          </div>
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

      {/* Brand */}
      <div style={{
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
      }}>
        BorBor
      </div>

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
    </motion.header>
  );
}
