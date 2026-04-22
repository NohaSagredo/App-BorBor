import React, { useState, useEffect } from 'react';
import { Check, Lock, Trophy, Zap, Flame, XCircle, Play } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import confetti from 'canvas-confetti';
import GlobalLoader from './GlobalLoader';

export default function ChallengeView({ onStartWorkout }) {
  const [loading, setLoading] = useState(true);
  const [challengeStartDate, setChallengeStartDate] = useState(null);
  const [challengeLogs, setChallengeLogs] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setChallengeStartDate(data.challengeStartDate || null);
          setChallengeLogs(data.challengeLogs || []);
        }
      } catch (err) {
        console.error("Error obteniendo datos del reto", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const startChallenge = async () => {
    if (!auth.currentUser) return;
    const today = new Date().toLocaleDateString('en-CA');
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        challengeStartDate: today
      });
      setChallengeStartDate(today);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f43f5e', '#a855f7', '#3b82f6']
      });
    } catch (err) {
      console.error(err);
    }
  };

  const getDayStatus = (dayOffset) => {
    if (!challengeStartDate) return 'LOCKED';
    
    const [sYear, sMonth, sDay] = challengeStartDate.split('-');
    const startDate = new Date(sYear, sMonth - 1, sDay);
    
    const targetDate = new Date(startDate);
    targetDate.setDate(targetDate.getDate() + dayOffset);
    const targetDateStr = targetDate.toLocaleDateString('en-CA');
    const todayDateStr = new Date().toLocaleDateString('en-CA');

    const isCompleted = challengeLogs.includes(targetDateStr);
    
    if (isCompleted) return 'COMPLETED';

    const targetTime = new Date(targetDateStr).getTime();
    const todayTime = new Date(todayDateStr).getTime();
    
    if (targetTime < todayTime) return 'MISSED';
    if (targetTime === todayTime) return 'TODAY';
    return 'FUTURE';
  };

  if (loading) {
    return <GlobalLoader text="Cargando Reto..." />;
  }

  if (!challengeStartDate) {
    return (
      <div className="animate-fade-in" style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        
        <div style={{ fontSize: '4rem', marginBottom: '1rem', filter: 'drop-shadow(0 4px 10px rgba(245, 158, 11, 0.4))' }}>
          🏆
        </div>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--color-text-highlight)', marginBottom: '1rem' }}>Reto 30 Días</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', lineHeight: '1.6', fontSize: '1rem' }}>
          Construye la disciplina que cambiará tu cuerpo. El reto consiste en completar al menos 1 sesión de entrenamiento al día durante 30 días consecutivos.
        </p>
        
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2.5rem', textAlign: 'left', borderRadius: '20px', width: '100%', maxWidth: '350px' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>Recompensas al finalizar:</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
             <li style={{ display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--color-text-muted)' }}><Flame color="#ef4444" size={20} /> Racha irrompible</li>
             <li style={{ display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--color-text-muted)' }}><Zap color="#eab308" size={20} /> +1000 XP (Experiencia)</li>
             <li style={{ display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--color-text-muted)' }}><Trophy color="#10b981" size={20} /> Medalla "Maestro Pélvico"</li>
          </ul>
        </div>

        <button 
          onClick={startChallenge}
          className="btn-primary"
          style={{ width: '100%', maxWidth: '350px', padding: '1.2rem', fontSize: '1.2rem', borderRadius: '16px', border: 'none', background: 'var(--btn-primary-gradient)', color: 'var(--btn-text-color)', fontWeight: 'bold', boxShadow: '0 8px 25px rgba(244, 63, 94, 0.4)', cursor: 'pointer' }}
        >
          Aceptar el Reto Hoy
        </button>
      </div>
    );
  }

  let completedCount = 0;
  let missedCount = 0;
  const daysGrid = Array.from({ length: 30 }).map((_, i) => {
    const status = getDayStatus(i);
    if (status === 'COMPLETED') completedCount++;
    if (status === 'MISSED') missedCount++;
    return { day: i + 1, status };
  });

  const progressRatio = (completedCount / 30) * 100;

  return (
    <div className="animate-fade-in" style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column' }}>
      
      {/* Progress Card */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '24px', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <div>
               <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0 0 4px 0', fontWeight: 'bold', textTransform: 'uppercase' }}>Progreso Global</p>
               <h1 style={{ fontSize: '2.5rem', margin: 0, color: 'var(--color-text-main)', lineHeight: 1 }}>{completedCount}<span style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>/30</span></h1>
            </div>
            {completedCount === 30 ? (
               <div style={{ fontSize: '2rem' }}>🏆</div>
            ) : (
               <div style={{ fontSize: '2rem' }}>💪</div>
            )}
         </div>

         <div style={{ width: '100%', height: '10px', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ width: `${progressRatio}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #ef4444)', borderRadius: '10px', transition: 'width 1s ease-out' }}></div>
         </div>
      </div>

      {/* Grid de Días */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(5, 1fr)', 
        gap: '12px', 
        justifyItems: 'center' 
      }}>
        {daysGrid.map(({ day, status }) => {
          let bg, color, border, icon;
          
          switch(status) {
            case 'COMPLETED':
              bg = 'linear-gradient(135deg, #10b981, #059669)';
              color = 'white';
              border = 'none';
              icon = <Check size={18} strokeWidth={3} />;
              break;
            case 'TODAY':
              bg = 'var(--color-bg)';
              color = 'var(--color-primary)';
              border = '2px solid var(--color-primary)';
              icon = day;
              break;
            case 'MISSED':
              bg = 'transparent';
              color = '#ef4444';
              border = '1px solid #fca5a5';
              icon = <XCircle size={18} />;
              break;
            case 'FUTURE':
            case 'LOCKED':
              bg = 'transparent';
              color = 'var(--color-text-muted)';
              border = '1px dashed var(--color-text-muted)';
              icon = <Lock size={16} />;
              break;
            default:
              break;
          }

          return (
            <div 
              key={day}
              className={`hover-scale ${status === 'TODAY' ? 'jump-anim' : ''}`}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: bg,
                color: color,
                border: border,
                boxShadow: status === 'COMPLETED' ? '0 4px 10px rgba(16, 185, 129, 0.3)' : (status === 'TODAY' ? '0 4px 15px rgba(var(--color-primary-rgb), 0.3)' : 'none'),
                transition: 'all 0.3s ease',
                position: 'relative',
                fontWeight: 'bold',
                fontSize: '1.1rem'
              }}
            >
              {icon}
              {(status === 'FUTURE' || status === 'LOCKED') && (
                <span style={{ position: 'absolute', bottom: '4px', fontSize: '0.6rem', fontWeight: 'bold', opacity: 0.7 }}>
                  D{day}
                </span>
                )}
            </div>
          );
        })}
      </div>

      {missedCount > 0 && (
         <p style={{ textAlign: 'center', color: '#ef4444', fontSize: '0.85rem', marginTop: '2rem', padding: '1rem', background: '#fee2e2', borderRadius: '12px' }}>
           Has omitido {missedCount} días. ¡Aún puedes recuperarte entrenando con más ahínco tus ejercicios pendientes!
         </p>
      )}

      {/* Acción rápida para Today */}
      {daysGrid.some(d => d.status === 'TODAY') && (
         <button 
           onClick={onStartWorkout}
           className="btn-primary animate-fade-in"
           style={{ marginTop: '2.5rem', width: '100%', padding: '1.2rem', borderRadius: '16px', border: 'none', background: 'var(--btn-primary-gradient)', color: 'var(--btn-text-color)', fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: 'var(--btn-primary-shadow)', cursor: 'pointer' }}
         >
           <Play fill="currentColor" size={20} /> Realizar Entrenamiento de Hoy
         </button>
      )}

    </div>
  );
}
