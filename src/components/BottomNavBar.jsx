import React from 'react';
import { Home, Dumbbell, GraduationCap, User, TrendingUp } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function BottomNavBar({ homeRoute = '/mujer' }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'home',     label: 'Inicio',   Icon: Home,          path: homeRoute },
    { id: 'training', label: 'Kegels',   Icon: Dumbbell,      path: '/kegels' },
    { id: 'insights', label: 'Insights', Icon: TrendingUp,    path: '/insights' },
    { id: 'academy',  label: 'Academia', Icon: GraduationCap, path: '/academia' },
    { id: 'profile',  label: 'Perfil',   Icon: User,          path: '/perfil' },
  ];

  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.15 }}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'rgba(8, 6, 14, 0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: '4.25rem',
        maxWidth: '500px',
        margin: '0 auto',
      }}>
        {navItems.map(({ id, label, Icon, path }) => {
          const isActive = location.pathname === path;

          return (
            <button
              key={id}
              onClick={() => navigate(path)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.2rem',
                padding: '0.5rem 0.25rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'transform 0.15s ease',
                transform: isActive ? 'scale(1.08)' : 'scale(1)',
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  style={{
                    position: 'absolute',
                    inset: '0.25rem 0.125rem',
                    borderRadius: '0.875rem',
                    background: 'var(--color-primary, #f43f5e)',
                    opacity: 0.12,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                style={{
                  width: '1.45rem',
                  height: '1.45rem',
                  color: isActive
                    ? 'var(--color-primary, #f43f5e)'
                    : 'rgba(148, 163, 184, 0.65)',
                  filter: isActive
                    ? 'drop-shadow(0 0 6px var(--color-primary, #f43f5e))'
                    : 'none',
                  transition: 'color 0.2s, filter 0.2s',
                }}
              />
              <span style={{
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: isActive
                  ? 'var(--color-primary, #f43f5e)'
                  : 'rgba(100, 116, 139, 0.8)',
                transition: 'color 0.2s',
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}
