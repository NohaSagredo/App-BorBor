import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import ZenAudio from '../components/ZenAudio';
import GlobalLoader from '../components/GlobalLoader';
import ChallengeView from '../components/ChallengeView';
import { ArrowLeft, Dumbbell, Trophy, Zap, Star, Play, Pause, X, CheckCircle } from 'lucide-react';

import { LEVELS } from '../utils/kegelLevels';

export default function KegelsModule() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [xp, setXp] = useState(0);
  const [coins, setCoins] = useState(0);
  const [userUid, setUserUid] = useState(null);
  const [userRole, setUserRole] = useState('mujer'); // Default safety

  // States de entrenamiento
  const [isWorkingOut, setIsWorkingOut] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'TRAINING');
  const [phase, setPhase] = useState('IDLE'); // IDLE, PREPARE, CONTRACT, RELAX, FEEDBACK, DONE
  const [timeLeft, setTimeLeft] = useState(0);
  const [repsLeft, setRepsLeft] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(LEVELS[0]);

  // Control manual de audios
  const [isMusicManuallyPaused, setIsMusicManuallyPaused] = useState(false);
  const [isGuidanceMuted] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/auth');
        return;
      }
      setUserUid(user.uid);
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserRole(data.role || 'mujer'); // Guardar rol
          setXp(data.xp || 0);
          setCoins(data.kegelCoins || 0);
          
          let myLevel = LEVELS[0];
          for (let l of LEVELS) {
            if ((data.xp || 0) >= l.xpRequired) myLevel = l;
          }
          setCurrentLevel(myLevel);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const playBeep = useCallback((type) => {
    if (isGuidanceMuted) return;
    try {
      const osc = new window.AudioContext().createOscillator();
      const gainNode = new window.AudioContext().createGain();
      osc.connect(gainNode);
      gainNode.connect(gainNode.context.destination);
      osc.type = 'sine';
      if (type === 'CONTRACT') {
        osc.frequency.setValueAtTime(440, osc.context.currentTime); // A4
      } else {
        osc.frequency.setValueAtTime(349.23, osc.context.currentTime); // F4
      }
      gainNode.gain.setValueAtTime(0.1, osc.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, osc.context.currentTime + 0.5);
      osc.start();
      osc.stop(osc.context.currentTime + 0.5);
    } catch { /* silent — Web Audio API may fail on some browsers */ }
  }, [isGuidanceMuted]);

  const startWorkout = () => {
    setIsWorkingOut(true);
    setIsPaused(false);
    setPhase('PREPARE');
    setRepsLeft(currentLevel.reps);
    setTimeLeft(3);
    setIsMusicManuallyPaused(false);
  };

  const pauseWorkout = () => {
     setIsPaused(!isPaused);
  };

  const quitWorkout = () => {
    if(!window.confirm("Â¿Seguro que deseas abortar tu sesiÃ³n?")) return;
    setIsWorkingOut(false);
    setIsPaused(false);
    setPhase('IDLE');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const finishWorkoutPhase = () => {
     if (timerRef.current) clearInterval(timerRef.current);
     setPhase('FEEDBACK');
  };

  // Timer Effect
  useEffect(() => {
    if (isWorkingOut && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev > 1) return prev - 1;

          if (phase === 'PREPARE') {
            playBeep('CONTRACT'); 
            setPhase('CONTRACT');
            return currentLevel.contractTime;
          } 
          else if (phase === 'CONTRACT') {
            playBeep('RELAX'); 
            setPhase('RELAX');
            return currentLevel.relaxTime;
          }
          else if (phase === 'RELAX') {
            if (repsLeft > 1) {
              playBeep('CONTRACT');
              setRepsLeft(r => r - 1);
              setPhase('CONTRACT');
              return currentLevel.contractTime;
            } else {
              finishWorkoutPhase();
              return 0;
            }
          }
          return 0;
        });
      }, 1000);
    }
    return () => {
        if(timerRef.current) clearInterval(timerRef.current);
    };
  }, [isWorkingOut, isPaused, phase, repsLeft, currentLevel, isGuidanceMuted, playBeep]);

  // Emitir evento global para el GlobalBackground animado
  useEffect(() => {
    let animTime = 1;
    if (phase === 'CONTRACT') animTime = currentLevel?.contractTime || 1;
    if (phase === 'RELAX') animTime = currentLevel?.relaxTime || 1;
    
    window.dispatchEvent(new CustomEvent('kegelPhaseChange', { 
        detail: { phase, time: animTime } 
    }));
  }, [phase, currentLevel]);

  const submitFeedback = async () => {
     try {
       const today = new Date().toLocaleDateString('en-CA');
       await updateDoc(doc(db, 'users', userUid), {
          xp: xp + currentLevel.reward,
          kegelCoins: coins + currentLevel.reward,
          challengeLogs: arrayUnion(today)
       });
       setXp(p => p + currentLevel.reward);
       setCoins(p => p + currentLevel.reward);
       setPhase('DONE');
     } catch (e) {
       console.error(e);
     }
  };

  if (loading) return <GlobalLoader />;

  // Render logic
  let circleScale = 1;
  let circleColor = 'var(--color-primary)';
  let instruction = 'Listo para empezar';

  if (phase === 'PREPARE') {
    instruction = 'PrepÃ¡rate...';
    circleColor = 'var(--color-text-muted)'; 
  } else if (phase === 'CONTRACT') {
    instruction = 'Â¡CONTRAE!';
    circleScale = 0.6; 
  } else if (phase === 'RELAX') {
    instruction = 'RELAJA';
    circleScale = 1.2; 
    circleColor = 'var(--color-secondary)'; 
  }

  const nextLevel = LEVELS.find(l => l.xpRequired > xp);
  const progressRatio = nextLevel ? ((xp - currentLevel.xpRequired) / (nextLevel.xpRequired - currentLevel.xpRequired)) * 100 : 100;

  return (
    <div className="app-wrapper responsive-container" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>

      <style>{`
        @keyframes kglOrb1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(15px,-20px) scale(1.08)} }
        @keyframes kglOrb2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-18px,15px) scale(1.1)} }
        @keyframes kglStagger { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes kglPulse { 0%,100%{box-shadow:0 0 0 0 rgba(var(--color-primary-rgb,244,63,94),0.3)} 50%{box-shadow:0 0 0 20px rgba(var(--color-primary-rgb,244,63,94),0)} }
        @keyframes kglShine { 0%{left:-100%} 100%{left:200%} }
        .kgl-tab {
          flex: 1; padding: 0.8rem 1rem; border-radius: 14px; border: none;
          font-weight: 700; font-size: 0.9rem; cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .kgl-start-btn {
          position: relative; width: 100%; padding: 1.1rem; border: none;
          border-radius: 16px; background: var(--btn-primary-gradient);
          color: var(--btn-text-color, #fff); font-size: 1.05rem; font-weight: 700;
          cursor: pointer; overflow: hidden; display: flex; align-items: center;
          justify-content: center; gap: 8px;
          box-shadow: 0 8px 28px rgba(var(--color-primary-rgb,244,63,94),0.3);
          transition: transform 0.2s ease, box-shadow 0.3s ease;
        }
        .kgl-start-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 36px rgba(var(--color-primary-rgb,244,63,94),0.4); }
        .kgl-start-btn::after {
          content: ''; position: absolute; top: 0; left: -100%;
          width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: kglShine 3s ease-in-out infinite;
        }
        .kgl-feedback-btn {
          padding: 1rem; border-radius: 14px; width: 100%;
          border: 1.5px solid var(--glass-border, rgba(255,255,255,0.1));
          background: rgba(255,255,255,0.04); backdrop-filter: blur(6px);
          font-size: 1rem; cursor: pointer; font-weight: 600;
          color: var(--color-text-main);
          transition: all 0.2s ease; text-align: left;
          display: flex; align-items: center; gap: 10px;
        }
        .kgl-feedback-btn:hover { transform: translateY(-1px); border-color: var(--color-primary); }
      `}</style>

      {/* Orbes */}
      <div style={{ position:'absolute', top:'-5%', right:'-12%', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, var(--color-primary), transparent 70%)', opacity:0.08, animation:'kglOrb1 14s ease-in-out infinite', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'10%', left:'-15%', width:240, height:240, borderRadius:'50%', background:'radial-gradient(circle, var(--color-secondary), transparent 70%)', opacity:0.06, animation:'kglOrb2 18s ease-in-out infinite', pointerEvents:'none' }} />

      {/* Audio */}
      <ZenAudio
        isPlaying={isWorkingOut && phase !== 'DONE' && phase !== 'FEEDBACK' && !isPaused && !isMusicManuallyPaused}
        onTogglePlay={(playRequest) => setIsMusicManuallyPaused(!playRequest)}
      />

      {/* â•â•â• HERO HEADER â•â•â• */}
      <div style={{
        borderRadius: '24px', padding: '1.5rem',
        marginBottom: '1.5rem',
        background: 'linear-gradient(145deg, var(--color-primary), var(--color-secondary))',
        boxShadow: '0 14px 40px rgba(0,0,0,0.15)',
        position: 'relative', overflow: 'hidden',
        animation: 'kglStagger 0.7s cubic-bezier(0.16,1,0.3,1) forwards'
      }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, background:'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%, rgba(255,255,255,0.06) 100%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:10, right:20, width:35, height:35, borderRadius:'50%', background:'rgba(255,255,255,0.18)', animation:'kglOrb1 5s ease-in-out infinite', pointerEvents:'none' }} />

        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          <button onClick={() => navigate(-1)} style={{
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px',
            padding: '0.4rem 0.9rem', fontSize: '0.82rem', cursor: 'pointer',
            color: '#fff', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600
          }}>
            <ArrowLeft size={14} /> Volver
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px',
              padding: '0.4rem 0.8rem'
            }}>
              <Dumbbell size={14} color="#fff" />
              <span style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 700 }}>Nv.{currentLevel.id}</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', margin: '1rem 0 0.5rem', position: 'relative', zIndex: 2 }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#fff', fontWeight: 800, letterSpacing: '-0.3px' }}>
            Entrenamiento Kegel
          </h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
            {currentLevel.name}
          </p>
        </div>

        {/* Stats chips */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '0.8rem', position: 'relative', zIndex: 2 }}>
          <div style={{ flex:1, background:'rgba(255,255,255,0.12)', backdropFilter:'blur(6px)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'14px', padding:'0.5rem 0.3rem', display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
            <Star size={14} color="#fbbf24" />
            <span style={{ color:'#fff', fontSize:'1rem', fontWeight:800 }}>{xp}</span>
            <span style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.6rem', fontWeight:600 }}>XP</span>
          </div>
          <div style={{ flex:1, background:'rgba(255,255,255,0.12)', backdropFilter:'blur(6px)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'14px', padding:'0.5rem 0.3rem', display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
            <span style={{ fontSize:'0.9rem' }}>ðŸ’°</span>
            <span style={{ color:'#fff', fontSize:'1rem', fontWeight:800 }}>{coins}</span>
            <span style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.6rem', fontWeight:600 }}>Monedas</span>
          </div>
          <div style={{ flex:1, background:'rgba(255,255,255,0.12)', backdropFilter:'blur(6px)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'14px', padding:'0.5rem 0.3rem', display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
            <Zap size={14} color="#38bdf8" />
            <span style={{ color:'#fff', fontSize:'1rem', fontWeight:800 }}>{Math.round(progressRatio)}%</span>
            <span style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.6rem', fontWeight:600 }}>Progreso</span>
          </div>
        </div>
      </div>

      {phase === 'IDLE' && (
        <>
          {/* Tab pills */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1.2rem', animation: 'kglStagger 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s both' }}>
            <button onClick={() => setActiveTab('TRAINING')} className="kgl-tab"
              style={{
                background: activeTab === 'TRAINING' ? 'var(--btn-primary-gradient)' : 'rgba(255,255,255,0.05)',
                color: activeTab === 'TRAINING' ? '#fff' : 'var(--color-text-muted)',
                boxShadow: activeTab === 'TRAINING' ? '0 4px 15px rgba(var(--color-primary-rgb,244,63,94),0.25)' : 'none',
              }}>
              <Dumbbell size={16} /> Entrenar
            </button>
            <button onClick={() => setActiveTab('CHALLENGE')} className="kgl-tab"
              style={{
                background: activeTab === 'CHALLENGE' ? 'var(--btn-primary-gradient)' : 'rgba(255,255,255,0.05)',
                color: activeTab === 'CHALLENGE' ? '#fff' : 'var(--color-text-muted)',
                boxShadow: activeTab === 'CHALLENGE' ? '0 4px 15px rgba(var(--color-primary-rgb,244,63,94),0.25)' : 'none',
              }}>
              <Trophy size={16} /> Mi Reto
            </button>
          </div>

          {activeTab === 'TRAINING' && (
            <div style={{
              borderRadius: '22px', padding: '2rem',
              background: 'rgba(var(--color-primary-rgb,244,63,94),0.02)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
              boxShadow: '0 6px 24px rgba(0,0,0,0.06)',
              animation: 'kglStagger 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s both'
            }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'linear-gradient(145deg, var(--color-primary), var(--color-secondary))',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                margin: '0 auto 1.2rem',
                boxShadow: '0 8px 25px rgba(var(--color-primary-rgb,244,63,94),0.25)',
                position: 'relative'
              }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, borderRadius:'50%', background:'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 50%)', pointerEvents:'none' }} />
                <Dumbbell size={32} color="#fff" style={{ position:'relative', zIndex:2 }} />
              </div>

              <h1 style={{ color: 'var(--color-text-main)', fontSize: '1.5rem', marginBottom: '0.3rem', fontWeight: 800 }}>{currentLevel.name}</h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>Fortalece tu centro de vitalidad pÃ©lvica.</p>

              <div style={{
                display: 'flex', justifyContent: 'space-around', padding: '1rem',
                borderRadius: '16px', marginBottom: '1.5rem',
                background: 'rgba(var(--color-primary-rgb,244,63,94),0.04)',
                border: '1px solid var(--glass-border)'
              }}>
                <div>
                  <span style={{ display: 'block', fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-text-highlight)' }}>{currentLevel.reps}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Reps</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-text-highlight)' }}>{currentLevel.contractTime}s</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Contrae</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-text-highlight)' }}>{currentLevel.relaxTime}s</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Relaja</span>
                </div>
              </div>

              {!nextLevel && <p style={{ color: '#10b981', fontSize: '0.82rem', marginBottom: '1rem', fontWeight: 600 }}>ðŸ† Â¡Nivel mÃ¡ximo alcanzado!</p>}

              <button onClick={startWorkout} className="kgl-start-btn">
                <Play size={18} /> Iniciar Entrenamiento
              </button>
            </div>
          )}

          {activeTab === 'CHALLENGE' && (
            <div style={{ animation: 'kglStagger 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s both' }}>
              <ChallengeView onStartWorkout={startWorkout} />
            </div>
          )}
        </>
      )}

      {(phase === 'PREPARE' || phase === 'CONTRACT' || phase === 'RELAX') && (
        <div style={{ marginTop: '2rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', animation: 'kglStagger 0.5s ease forwards' }}>

          <h2 style={{ fontSize: '2rem', color: 'var(--color-text-main)', marginBottom: '2.5rem', fontWeight: 300, letterSpacing: '-0.5px' }}>{instruction}</h2>

          <div style={{ position: 'relative', width: 200, height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{
              position: 'absolute', width: '100%', height: '100%', borderRadius: '50%',
              border: `3px solid ${circleColor}`, opacity: 0.15, transform: 'scale(1.15)'
            }} />
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%',
              background: `linear-gradient(135deg, var(--color-primary), ${circleColor})`,
              boxShadow: `0 0 50px ${circleColor}`,
              transform: `scale(${circleScale})`,
              transition: `transform ${phase === 'CONTRACT' ? currentLevel.contractTime : phase === 'RELAX' ? currentLevel.relaxTime : 1}s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.5s ease`,
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              animation: 'kglPulse 2s ease-in-out infinite'
            }}>
              <span style={{ fontSize: '3rem', color: '#fff', fontWeight: 700, textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                {timeLeft}
              </span>
            </div>
          </div>

          <div style={{ marginTop: '2rem', fontSize: '1rem', color: 'var(--color-text-muted)' }}>
            Reps restantes: <strong style={{ color: 'var(--color-text-main)', fontSize: '1.1rem' }}>{repsLeft}</strong>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '2rem' }}>
            <button onClick={pauseWorkout} style={{
              padding: '0.9rem', width: '120px', borderRadius: '14px',
              border: isPaused ? 'none' : '1.5px solid var(--glass-border)',
              background: isPaused ? 'var(--btn-primary-gradient)' : 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(6px)',
              color: isPaused ? '#fff' : 'var(--color-text-main)',
              cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              transition: 'all 0.2s ease'
            }}>
              {isPaused ? <><Play size={15} /> Reanudar</> : <><Pause size={15} /> Pausar</>}
            </button>
            <button onClick={quitWorkout} style={{
              padding: '0.9rem', width: '120px', borderRadius: '14px',
              border: 'none', background: 'rgba(239,68,68,0.1)',
              color: '#ef4444', cursor: 'pointer', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              transition: 'all 0.2s ease'
            }}>
              <X size={15} /> Abortar
            </button>
          </div>
        </div>
      )}

      {phase === 'FEEDBACK' && (
        <div style={{
          borderRadius: '22px', padding: '2rem', marginTop: '2rem',
          background: 'rgba(var(--color-primary-rgb,244,63,94),0.02)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
          animation: 'kglStagger 0.5s cubic-bezier(0.16,1,0.3,1) forwards'
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%', margin: '0 auto 1rem',
            background: 'linear-gradient(145deg, var(--color-primary), var(--color-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(var(--color-primary-rgb,244,63,94),0.2)'
          }}>
            <CheckCircle size={28} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--color-text-highlight)', marginBottom: '0.5rem', fontWeight: 800 }}>Â¡Excelente Trabajo!</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.88rem' }}>Â¿CÃ³mo sentiste la sesiÃ³n?</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => submitFeedback('easy')} className="kgl-feedback-btn">ðŸŸ¢ Muy fÃ¡cil â€” Control total</button>
            <button onClick={() => submitFeedback('medium')} className="kgl-feedback-btn">ðŸŸ¡ Moderado â€” Buen esfuerzo</button>
            <button onClick={() => submitFeedback('hard')} className="kgl-feedback-btn">ðŸ”´ DifÃ­cil â€” CostÃ³ sostener</button>
          </div>
        </div>
      )}

      {phase === 'DONE' && (
        <div style={{
          borderRadius: '22px', padding: '2rem', marginTop: '2rem',
          background: 'linear-gradient(145deg, var(--color-primary), var(--color-secondary))',
          boxShadow: '0 14px 40px rgba(0,0,0,0.15)',
          position: 'relative', overflow: 'hidden',
          animation: 'kglStagger 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards'
        }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, background:'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%)', pointerEvents:'none' }} />
          <div style={{ fontSize: '4rem', marginBottom: '0.8rem', position: 'relative', zIndex: 2 }}>ðŸŽ‰</div>
          <h2 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: '0.3rem', fontWeight: 800, position: 'relative', zIndex: 2 }}>Â¡Recompensas!</h2>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.9)', fontWeight: 700, marginBottom: '1.5rem', position: 'relative', zIndex: 2 }}>+{currentLevel.reward} XP / +{currentLevel.reward} Monedas</p>

          <button onClick={() => navigate(userRole?.toLowerCase()?.trim() === 'hombre' ? '/hombre' : '/mujer')} style={{
            width: '100%', padding: '1rem', borderRadius: '14px',
            background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.25)',
            color: '#fff', fontWeight: 700, fontSize: '1rem',
            cursor: 'pointer', position: 'relative', zIndex: 2,
            transition: 'all 0.2s ease'
          }}>
            Volver al Inicio
          </button>
        </div>
      )}
    </div>
  );
}

