import React, { createContext, useContext, useState, useEffect } from 'react';

const THEMES = {
  rose: {
    id: 'rose',
    name: 'Rose',
    icon: '🌸',
    preview: '#f43f5e',
    vars: {
      '--color-bg': '#0f0d13',
      '--color-surface': 'rgba(30, 18, 24, 0.65)',
      '--color-primary': '#f43f5e',
      '--color-secondary': '#c084fc',
      '--color-accent': '#fcd34d',
      '--color-text-main': '#f1f5f9',
      '--color-text-muted': '#94a3b8',
      '--color-text-highlight': '#fb7185',
      '--color-danger': '#fb7185',
      '--color-success': '#a855f7',
      '--color-safe': '#ddd6fe',
      '--color-unsafe': '#fecdd3',
      '--body-gradient': 'radial-gradient(circle at top left, #ffe4e6 0%, #fae8ff 50%, #f0f9ff 100%)',
      '--glass-bg': 'rgba(255, 255, 255, 0.75)',
      '--glass-border': 'rgba(255, 255, 255, 0.6)',
      '--btn-primary-gradient': 'linear-gradient(135deg, #f43f5e, #e11d48)',
      '--btn-text-color': '#ffffff',
      '--btn-primary-shadow': '0 8px 16px rgba(244, 63, 94, 0.25)',
      '--btn-primary-hover-shadow': '0 12px 20px rgba(244, 63, 94, 0.35)',
    }
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    icon: '🌙',
    preview: '#818cf8',
    vars: {
      '--color-bg': '#0f172a',
      '--color-surface': 'rgba(20, 28, 46, 0.65)',
      '--color-primary': '#818cf8',
      '--color-secondary': '#a78bfa',
      '--color-accent': '#fbbf24',
      '--color-text-main': '#f8fafc',
      '--color-text-muted': '#94a3b8',
      '--color-text-highlight': '#a5b4fc',
      '--color-danger': '#f87171',
      '--color-success': '#a78bfa',
      '--color-safe': 'rgba(99, 102, 241, 0.2)',
      '--color-unsafe': 'rgba(248, 113, 113, 0.2)',
      '--body-gradient': 'radial-gradient(circle at top left, #1e1b4b 0%, #0f172a 50%, #111827 100%)',
      '--glass-bg': 'rgba(30, 41, 59, 0.75)',
      '--glass-border': 'rgba(51, 65, 85, 0.6)',
      '--btn-primary-gradient': 'linear-gradient(135deg, #818cf8, #6366f1)',
      '--btn-text-color': '#ffffff',
      '--btn-primary-shadow': '0 8px 16px rgba(129, 140, 248, 0.25)',
      '--btn-primary-hover-shadow': '0 12px 20px rgba(129, 140, 248, 0.35)',
    }
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    icon: '🌊',
    preview: '#06b6d4',
    vars: {
      '--color-bg': '#0a1a1e',
      '--color-surface': 'rgba(8, 40, 50, 0.65)',
      '--color-primary': '#0891b2',
      '--color-secondary': '#06b6d4',
      '--color-accent': '#fbbf24',
      '--color-text-main': '#e0f2fe',
      '--color-text-muted': '#7dd3fc',
      '--color-text-highlight': '#38bdf8',
      '--color-danger': '#f87171',
      '--color-success': '#06b6d4',
      '--color-safe': 'rgba(6, 182, 212, 0.15)',
      '--color-unsafe': 'rgba(248, 113, 113, 0.15)',
      '--body-gradient': 'radial-gradient(circle at top left, #cffafe 0%, #e0f2fe 50%, #f0f9ff 100%)',
      '--glass-bg': 'rgba(255, 255, 255, 0.75)',
      '--glass-border': 'rgba(207, 250, 254, 0.8)',
      '--btn-primary-gradient': 'linear-gradient(135deg, #0891b2, #0e7490)',
      '--btn-text-color': '#ffffff',
      '--btn-primary-shadow': '0 8px 16px rgba(8, 145, 178, 0.25)',
      '--btn-primary-hover-shadow': '0 12px 20px rgba(8, 145, 178, 0.35)',
    }
  },
  amethyst: {
    id: 'amethyst',
    name: 'Amethyst',
    icon: '🍇',
    preview: '#7c3aed',
    vars: {
      '--color-bg': '#120a1e',
      '--color-surface': 'rgba(25, 15, 45, 0.65)',
      '--color-primary': '#7c3aed',
      '--color-secondary': '#a855f7',
      '--color-accent': '#f59e0b',
      '--color-text-main': '#ede9fe',
      '--color-text-muted': '#c4b5fd',
      '--color-text-highlight': '#a78bfa',
      '--color-danger': '#f472b6',
      '--color-success': '#a855f7',
      '--color-safe': 'rgba(167, 139, 250, 0.15)',
      '--color-unsafe': 'rgba(244, 114, 182, 0.15)',
      '--body-gradient': 'radial-gradient(circle at top left, #f5f3ff 0%, #fae8ff 50%, #fdf4ff 100%)',
      '--glass-bg': 'rgba(255, 255, 255, 0.75)',
      '--glass-border': 'rgba(245, 243, 255, 0.8)',
      '--btn-primary-gradient': 'linear-gradient(135deg, #7c3aed, #6d28d9)',
      '--btn-text-color': '#ffffff',
      '--btn-primary-shadow': '0 8px 16px rgba(124, 58, 237, 0.25)',
      '--btn-primary-hover-shadow': '0 12px 20px rgba(124, 58, 237, 0.35)',
    }
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    icon: '🌿',
    preview: '#16a34a',
    vars: {
      '--color-bg': '#051208',
      '--color-surface': 'rgba(8, 30, 14, 0.65)',
      '--color-primary': '#16a34a',
      '--color-secondary': '#22c55e',
      '--color-accent': '#eab308',
      '--color-text-main': '#dcfce7',
      '--color-text-muted': '#86efac',
      '--color-text-highlight': '#4ade80',
      '--color-danger': '#ef4444',
      '--color-success': '#22c55e',
      '--color-safe': 'rgba(34, 197, 94, 0.15)',
      '--color-unsafe': 'rgba(239, 68, 68, 0.15)',
      '--body-gradient': 'radial-gradient(circle at top left, #dcfce7 0%, #ecfdf5 50%, #f0fdf4 100%)',
      '--glass-bg': 'rgba(255, 255, 255, 0.75)',
      '--glass-border': 'rgba(220, 252, 231, 0.8)',
      '--btn-primary-gradient': 'linear-gradient(135deg, #16a34a, #15803d)',
      '--btn-text-color': '#ffffff',
      '--btn-primary-shadow': '0 8px 16px rgba(22, 163, 74, 0.25)',
      '--btn-primary-hover-shadow': '0 12px 20px rgba(22, 163, 74, 0.35)',
    }
  },
  empowerment: {
    id: 'empowerment',
    name: 'Empoderamiento',
    icon: '🔥',
    preview: '#E27D60',
    vars: {
      '--color-bg': '#1a100a',
      '--color-surface': 'rgba(35, 20, 12, 0.65)',
      '--color-primary': '#E27D60',
      '--color-secondary': '#BC85A3',
      '--color-accent': '#E27D60',
      '--color-text-main': '#fef3c7',
      '--color-text-muted': '#fcd34d',
      '--color-text-highlight': '#f97316',
      '--color-danger': '#EF4444',
      '--color-success': '#10B981',
      '--color-safe': 'rgba(188, 133, 163, 0.15)',
      '--color-unsafe': 'rgba(226, 125, 96, 0.15)',
      '--body-gradient': 'radial-gradient(circle at top left, #FDFBF7 0%, #F4EBD0 50%, #EAE0C5 100%)',
      '--glass-bg': 'rgba(255, 255, 255, 0.65)',
      '--glass-border': 'rgba(255, 255, 255, 0.5)',
      '--btn-primary-gradient': 'linear-gradient(135deg, #E27D60, #C5684D)',
      '--btn-text-color': '#ffffff',
      '--btn-primary-shadow': '0 8px 16px rgba(226, 125, 96, 0.25)',
      '--btn-primary-hover-shadow': '0 12px 20px rgba(226, 125, 96, 0.35)',
    }
  },
  wellness: {
    id: 'wellness',
    name: 'Bienestar',
    icon: '🍃',
    preview: '#8E7CC3',
    vars: {
      '--color-bg': '#120a18',
      '--color-surface': 'rgba(25, 10, 35, 0.65)',
      '--color-primary': '#8E7CC3',
      '--color-secondary': '#D5E8D4',
      '--color-accent': '#D5E8D4',
      '--color-text-main': '#f3e8ff',
      '--color-text-muted': '#d8b4fe',
      '--color-text-highlight': '#c084fc',
      '--color-danger': '#E74C3C',
      '--color-success': '#2ECC71',
      '--color-safe': 'rgba(213, 232, 212, 0.4)',
      '--color-unsafe': 'rgba(142, 124, 195, 0.2)',
      '--body-gradient': 'radial-gradient(circle at top left, #FFFFFF 0%, #F3E5F5 50%, #E1BEE7 100%)',
      '--glass-bg': 'rgba(255, 255, 255, 0.75)',
      '--glass-border': 'rgba(243, 229, 245, 0.8)',
      '--btn-primary-gradient': 'linear-gradient(135deg, #8E7CC3, #673AB7)',
      '--btn-text-color': '#ffffff',
      '--btn-primary-shadow': '0 8px 16px rgba(142, 124, 195, 0.25)',
      '--btn-primary-hover-shadow': '0 12px 20px rgba(142, 124, 195, 0.35)',
    }
  },
  boldnight: {
    id: 'boldnight',
    name: 'Audaz Nocturno',
    icon: '🍷',
    preview: '#D81B60',
    vars: {
      '--color-bg': '#1A1A2E',
      '--color-surface': 'rgba(20, 18, 36, 0.65)',
      '--color-primary': '#D81B60',
      '--color-secondary': '#CBB26A',
      '--color-accent': '#CBB26A',
      '--color-text-main': '#F8FAFC',
      '--color-text-muted': '#CBD5E1',
      '--color-text-highlight': '#ff4d85',
      '--color-danger': '#FF5252',
      '--color-success': '#4CAF50',
      '--color-safe': 'rgba(203, 178, 106, 0.2)',
      '--color-unsafe': 'rgba(216, 27, 96, 0.3)',
      '--body-gradient': 'radial-gradient(circle at top left, #16213E 0%, #1A1A2E 50%, #0F0F1A 100%)',
      '--glass-bg': 'rgba(30, 30, 50, 0.75)',
      '--glass-border': 'rgba(203, 178, 106, 0.3)',
      '--btn-primary-gradient': 'linear-gradient(135deg, #D81B60, #AD1457)',
      '--btn-text-color': '#ffffff',
      '--btn-primary-shadow': '0 8px 16px rgba(216, 27, 96, 0.25)',
      '--btn-primary-hover-shadow': '0 12px 20px rgba(216, 27, 96, 0.4)',
    }
  },
  organic: {
    id: 'organic',
    name: 'Orgánico Neutro',
    icon: '🍂',
    preview: '#A67C52',
    vars: {
      '--color-bg': '#110d08',
      '--color-surface': 'rgba(25, 18, 10, 0.65)',
      '--color-primary': '#A67C52',
      '--color-secondary': '#E9BCB7',
      '--color-accent': '#E9BCB7',
      '--color-text-main': '#fdf8f0',
      '--color-text-muted': '#e7d5c5',
      '--color-text-highlight': '#d4a574',
      '--color-danger': '#E07A5F',
      '--color-success': '#81B29A',
      '--color-safe': 'rgba(233, 188, 183, 0.3)',
      '--color-unsafe': 'rgba(166, 124, 82, 0.2)',
      '--body-gradient': 'radial-gradient(circle at top left, #FFFFFF 0%, #FFF9F5 50%, #F5F0EB 100%)',
      '--glass-bg': 'rgba(255, 255, 255, 0.75)',
      '--glass-border': 'rgba(255, 249, 245, 0.9)',
      '--btn-primary-gradient': 'linear-gradient(135deg, #A67C52, #8F6A44)',
      '--btn-text-color': '#ffffff',
      '--btn-primary-shadow': '0 8px 16px rgba(166, 124, 82, 0.25)',
      '--btn-primary-hover-shadow': '0 12px 20px rgba(166, 124, 82, 0.35)',
    }
  },
  vital: {
    id: 'vital',
    name: 'Vital Energético',
    icon: '☀️',
    preview: '#FF5A5F',
    vars: {
      '--color-bg': '#0f0d13',
      '--color-surface': 'rgba(15, 13, 19, 0.65)',
      '--color-primary': '#FF5A5F',
      '--color-secondary': '#00A699',
      '--color-accent': '#00A699',
      '--color-text-main': '#f8fafc',
      '--color-text-muted': '#94a3b8',
      '--color-text-highlight': '#ff7a7e',
      '--color-danger': '#FF3B30',
      '--color-success': '#34C759',
      '--color-safe': 'rgba(0, 166, 153, 0.2)',
      '--color-unsafe': 'rgba(255, 90, 95, 0.2)',
      '--body-gradient': 'radial-gradient(circle at top left, #FFFFFF 0%, #FAFAFA 50%, #F0F0F0 100%)',
      '--glass-bg': 'rgba(255, 255, 255, 0.85)',
      '--glass-border': 'rgba(255, 255, 255, 0.9)',
      '--btn-primary-gradient': 'linear-gradient(135deg, #FF5A5F, #E04E53)',
      '--btn-text-color': '#ffffff',
      '--btn-primary-shadow': '0 8px 16px rgba(255, 90, 95, 0.25)',
      '--btn-primary-hover-shadow': '0 12px 20px rgba(255, 90, 95, 0.35)',
    }
  },
  minimalist: {
    id: 'minimalist',
    name: 'Minimalista Sofisticado',
    icon: '🪨',
    preview: '#5D5C61',
    vars: {
      '--color-bg': '#1E1E22',
      '--color-surface': 'rgba(28, 28, 34, 0.65)',
      '--color-primary': '#FDFCF0',
      '--color-secondary': '#7395AE',
      '--color-accent': '#7395AE',
      '--color-text-main': '#FDFCF0',
      '--color-text-muted': '#D1C8C0',
      '--color-text-highlight': '#FFFFFF',
      '--color-danger': '#D98A8A',
      '--color-success': '#97B5A3',
      '--color-safe': 'rgba(115, 149, 174, 0.3)',
      '--color-unsafe': 'rgba(253, 252, 240, 0.2)',
      '--body-gradient': 'radial-gradient(circle at top left, #3A3A40 0%, #29292E 50%, #1E1E22 100%)',
      '--glass-bg': 'rgba(50, 50, 55, 0.65)',
      '--glass-border': 'rgba(253, 252, 240, 0.2)',
      '--btn-primary-gradient': 'linear-gradient(135deg, #7395AE, #5D5C61)',
      '--btn-text-color': '#FFFFFF',
      '--btn-primary-shadow': '0 8px 16px rgba(93, 92, 97, 0.35)',
      '--btn-primary-hover-shadow': '0 12px 20px rgba(93, 92, 97, 0.45)',
    }
  }
};

const ThemeContext = createContext({
  theme: THEMES.rose,
  themeId: 'rose',
  setTheme: () => {},
  themes: THEMES,
  animMode: 'aura',
  setAnimMode: () => {}
});

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    return localStorage.getItem('borbor-theme') || 'rose';
  });
  const [animMode, setAnimMode] = useState(() => {
    return localStorage.getItem('borbor-anim') || 'aura';
  });

  const theme = THEMES[themeId] || THEMES.rose;

  useEffect(() => {
    // Apply CSS variables to :root
    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([key, value]) => {
      if (key === '--body-gradient') {
        // Aplicamos el gradiente del tema como overlay translúcido
        // para no romper el fondo oscuro base del Glassmorphism
        root.style.setProperty('--theme-gradient', value);
      } else {
        root.style.setProperty(key, value);
      }
    });

    localStorage.setItem('borbor-theme', themeId);
  }, [themeId, theme]);

  const setTheme = (id) => {
    if (THEMES[id]) {
      setThemeId(id);
    }
  };

  useEffect(() => {
    localStorage.setItem('borbor-anim', animMode);
  }, [animMode]);

  return (
    <ThemeContext.Provider value={{ theme, themeId, setTheme, themes: THEMES, animMode, setAnimMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export { THEMES };
export default ThemeProvider;
