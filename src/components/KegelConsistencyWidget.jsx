import React from 'react';

export default function KegelConsistencyWidget({ logs = [], themeColor = 'var(--color-primary)' }) {
    // Generate array of last 7 days
    const last7Days = Array.from({length: 7}).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
            dateStr: d.toLocaleDateString('en-CA'),
            dayName: d.toLocaleDateString('es-ES', { weekday: 'narrow' }).toUpperCase()
        };
    });

    return (
       <div className="glass-panel hover-scale" style={{ padding: '1.2rem', marginBottom: '1rem', background: 'var(--color-surface)', borderLeft: `4px solid ${themeColor}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
             <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', margin: 0, fontWeight: 'bold' }}>
                Frecuencia Kegel
             </h3>
             <span style={{color: themeColor, fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px'}}>
                🔥 {logs.length || 0} Días
             </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             {last7Days.map((ds, i) => {
                const isCompleted = logs?.includes(ds.dateStr);
                const isToday = i === 6;
                // Theme adaptation
                const bgCompleted = `linear-gradient(135deg, ${themeColor}, #a855f7)`;
                
                return (
                   <div key={ds.dateStr} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.7rem', color: isToday ? themeColor : 'var(--color-text-muted)', fontWeight: isToday ? 'bold' : 'normal' }}>
                         {ds.dayName}
                      </span>
                      <div style={{
                         width: '2rem', 
                         height: '2rem', 
                         borderRadius: '50%', 
                         display: 'flex', 
                         alignItems: 'center', 
                         justifyContent: 'center',
                         background: isCompleted ? bgCompleted : 'var(--glass-bg)',
                         color: isCompleted ? '#fff' : 'transparent',
                         fontSize: '0.9rem',
                         fontWeight: 'bold',
                         border: !isCompleted && isToday ? `2px dashed ${themeColor}` : (isCompleted ? 'none' : '1px solid var(--glass-border)'),
                         boxShadow: isCompleted ? 'var(--shadow-sm)' : 'none',
                         transition: 'all 0.3s ease'
                      }}>
                         {isCompleted && '✓'}
                      </div>
                   </div>
                )
             })}
          </div>
       </div>
    );
}
