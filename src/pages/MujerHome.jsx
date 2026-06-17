import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { auth, db, sendNotification } from '../firebase';
import { doc, getDoc, updateDoc, setDoc, collection, getDocs, query, onSnapshot, orderBy, increment } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import KegelConsistencyWidget from '../components/KegelConsistencyWidget';
import DailyCheckInModal from '../components/DailyCheckInModal';
import GlobalLoader from '../components/GlobalLoader';
import { useTheme } from '../components/ThemeProvider';
import { LEVELS } from '../utils/kegelLevels';

const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date(dateStr);
  const [year, month, day] = parts.map(Number);
  return new Date(year, month - 1, day);
};

export default function MujerHome() {
  const navigate = useNavigate();
  const { themeId, setTheme, themes } = useTheme();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastPeriodStart, setLastPeriodStart] = useState('');
  const [phase, setPhase] = useState('Ninguna registrada');
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const [isSymptomsInfoOpen, setIsSymptomsInfoOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date()); // Fecha para navegación del calendario en malla
  const calCarouselRef = React.useRef(null); // Ref para drag de mouse en el carrusel
  
  // Daily Checkin State
  const [showDailyCheckin, setShowDailyCheckin] = useState(false);
  const [hasPromptedDailyCheckin, setHasPromptedDailyCheckin] = useState(false);
  
  // Auto-carrusel para vistas de calendario
  const MIMOS_CATALOG = [
    { id: 'm1', label: 'Beso Virtual', icon: '💋', cost: 10 },
    { id: 'm2', label: 'Masaje', icon: '💆‍♂️', cost: 30 },
    { id: 'm3', label: 'Café Calentito', icon: '☕', cost: 15 },
    { id: 'm4', label: 'Cena Romántica', icon: '🍝', cost: 100 },
    { id: 'm5', label: 'Vale por Abrazos', icon: '🫂', cost: 50 },
    { id: 'm6', label: 'Ducha Juntos', icon: '🚿', cost: 150 },
  ];

  const handleSendMimo = async (mimo) => {
    if (!userData || !userData.linkedPartnerId) {
      alert("No tienes una pareja vinculada para enviar mimos.");
      return;
    }
    const targetPartnerId = userData.linkedPartnerId;
    const currentCoins = userData.kegelCoins || 0;
    if (currentCoins < mimo.cost) {
      alert(`¡No tienes suficientes monedas! (${currentCoins}/${mimo.cost}) Entrena más en la sección de Kegels.`);
      return;
    }
    
    try {
      const newCoins = currentCoins - mimo.cost;
      await updateDoc(doc(db, 'users', userData.uid), {
         kegelCoins: increment(-mimo.cost)
      });
      setUserData({...userData, kegelCoins: newCoins});
      
      const title = 'Nuevo Mimo 💌';
      const body = `${userData.name} te ha enviado: ${mimo.label}`;
      await sendNotification(targetPartnerId, title, body, mimo.icon);
      
      alert(`¡Mimo enviado exitosamente! (-${mimo.cost} 💰)`);
    } catch(err) {
       console.error("Error al enviar mimo:", err);
       alert("Error al enviar el mimo.");
    }
  };


  // Notificaciones
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Daily Tracking States (Estilo Clue)
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [myLogs, setMyLogs] = useState({});
  const [symptoms, setSymptoms] = useState({
    bleeding:  null,
    flowColor: null,
    fluid:     null,
    symptoms:  [],   // multi-select: array de IDs
    emotions:  null,
    intimacy:  null,
  });
  const [symptomsSaved, setSymptomsSaved] = useState(false);

  const TRACKING_CATEGORIES = [
    // ── 1. SANGRADO ──
    {
      id: 'bleeding',
      title: 'Sangrado',
      color: '#ef4444',
      options: [
        { id: 'spotting', label: 'Manchado', icon: '🟤' },
        { id: 'light',    label: 'Ligero',   icon: '💧' },
        { id: 'medium',   label: 'Medio',    icon: '🩸' },
        { id: 'heavy',    label: 'Abundante',icon: '🔴' }
      ]
    },
    // ── 2. COLOR DE SANGRADO ──
    {
      id: 'flowColor',
      title: 'Color del Sangrado',
      color: '#b91c1c',
      options: [
        { id: 'pink',  label: 'Rosado',       icon: '🌸' },
        { id: 'red',   label: 'Rojo',         icon: '🍎' },
        { id: 'dark',  label: 'Oscuro/Marrón', icon: '🍂' }
      ]
    },
    // ── 3. FLUJO VAGINAL ──
    {
      id: 'fluid',
      title: 'Flujo Vaginal',
      color: '#0ea5e9',
      options: [
        { id: 'dry',        label: 'Seco/Sin flujo',    icon: '🏖️' },
        { id: 'sticky',     label: 'Pegajoso',         icon: '🍯' },
        { id: 'creamy',     label: 'Espeso/Cremoso',   icon: '🥛' },
        { id: 'watery',     label: 'Acuoso',           icon: '🌊' },
        { id: 'egg_white',  label: 'Clara de Huevo',   icon: '🥚' },
        { id: 'bad_odor',   label: 'Mal olor/Atípico', icon: '⚠️', alert: true },
        { id: 'lumpy',      label: 'Grumoso 🚨',       icon: '🧫', alert: true }
      ]
    },
    // ── 4. SÍNTOMAS (multi-select) ──
    {
      id: 'symptoms',
      title: 'Síntomas',
      color: '#8b5cf6',
      multiSelect: true,
      options: [
        { id: 'cramps',        label: 'Cólicos',            icon: '⚡' },
        { id: 'sore_breasts',  label: 'Dolor de senos',    icon: '🍈' },
        { id: 'acne',          label: 'Acné',              icon: '🔴' },
        { id: 'mood_swings',   label: 'Cambios de humor',  icon: '🌪️' },
        { id: 'itching',       label: 'Picazón/Ardor',     icon: '🔥', alert: true },
        { id: 'bloating',      label: 'Inflamación',       icon: '💖' }
      ]
    },
    // ── 5. EMOCIONES ──
    {
      id: 'emotions',
      title: 'Emociones',
      color: '#3b82f6',
      options: [
        { id: 'happy',     label: 'Feliz',     icon: '😊' },
        { id: 'sensitive', label: 'Sensible',  icon: '🥺' },
        { id: 'sad',       label: 'Triste',    icon: '😢' },
        { id: 'irritable', label: 'Irritable', icon: '😤' },
        { id: 'calm',      label: 'Calmada',   icon: '😌' }
      ]
    },
    // ── 6. INTIMIDAD ──
    {
      id: 'intimacy',
      title: 'Intimidad',
      color: '#ec4899',
      options: [
        { id: 'protected',       label: 'Protección',  icon: '🛡️' },
        { id: 'unprotected_out', label: 'Afuera',      icon: '💦' },
        { id: 'unprotected_in',  label: 'Adentro',     icon: '🎯' },
        { id: 'masturbation',    label: 'A solas',     icon: '🖐️' }
      ]
    }
  ];

  const getCycleStats = (logs) => {
    if (!logs) return { currentStart: null, cycleLength: 28 };
    const bleedingDates = Object.keys(logs).filter(date => {
       const b = logs[date]?.bleeding;
       return b && b !== 'none';
    }).sort((a,b) => new Date(b) - new Date(a)); // Descending
    
    if (bleedingDates.length === 0) return { currentStart: null, cycleLength: 28 };
    
    // Group into clusters of consecutive bleeding to find distinct periods
    const clusters = [];
    let currentCluster = [bleedingDates[0]];
    
    for (let i = 0; i < bleedingDates.length - 1; i++) {
       const d1 = new Date(bleedingDates[i]);
       const d2 = new Date(bleedingDates[i+1]);
       const diffDays = Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));
       if (diffDays <= 4) {
         currentCluster.push(bleedingDates[i+1]);
       } else {
         clusters.push(currentCluster);
         currentCluster = [bleedingDates[i+1]];
       }
    }
    clusters.push(currentCluster);
    
    // The start of the current cycle is the OLDEST date in the most recent cluster (last element)
    const currentStart = clusters[0][clusters[0].length - 1]; 
    let cycleLength = 28;
    
    // Calculate average length of all past cycles
    let totalLength = 0;
    let validCyclesCount = 0;

    for (let i = 0; i < clusters.length - 1; i++) {
        const startCurrent = clusters[i][clusters[i].length - 1]; // Date string
        const startPrevious = clusters[i+1][clusters[i+1].length - 1]; // Date string
        
        const diffTicks = new Date(startCurrent) - new Date(startPrevious);
        let calcLength = Math.floor(diffTicks / (1000 * 60 * 60 * 24));
        
        // Filer anomalies (e.g. less than 20 days or more than 40 days is usually a mislog or skipped period)
        if (calcLength >= 21 && calcLength <= 40) {
            totalLength += calcLength;
            validCyclesCount++;
        }
    }
    
    if (validCyclesCount > 0) {
        cycleLength = Math.round(totalLength / validCyclesCount);
    }
    
    return { currentStart, cycleLength };
  };

  // Helper de selección: radio para categorías normales, toggle de array para multi-select
  const toggleSymptom = (categoryId, optionId) => {
    const cat = TRACKING_CATEGORIES.find(c => c.id === categoryId);
    if (cat?.multiSelect) {
      setSymptoms(prev => {
        const current = prev[categoryId] || [];
        const exists = current.includes(optionId);
        return { ...prev, [categoryId]: exists ? current.filter(id => id !== optionId) : [...current, optionId] };
      });
    } else {
      setSymptoms(prev => ({ ...prev, [categoryId]: prev[categoryId] === optionId ? null : optionId }));
    }
  };

  useEffect(() => {
    let unsubNotifs = () => {};
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
          setUserData(data);
          
          // Guardar rol y validar acceso (Bug Fix #4)
          if (data.role === 'hombre' || data.role === 'pareja') {
            navigate('/hombre');
            return;
          }

          // Configurar datos de ciclo
          if (data.lastPeriodStart) {
            setLastPeriodStart(data.lastPeriodStart);
            calculatePhase(data.lastPeriodStart);
          }

          // Fetch daily logs propios
          const logsRef = collection(db, 'users', user.uid, 'dailyLogs');
          const logsQuery = query(logsRef);
          const logsRes = await getDocs(logsQuery);
          
          let fetchedLogs = {};
          logsRes.forEach(docSnap => {
            fetchedLogs[docSnap.id] = docSnap.data();
          });
          setMyLogs(fetchedLogs);

          // Obtener dinámicamente el inicio de ciclo
          const stats = getCycleStats(fetchedLogs);
          if (stats.currentStart) {
             setLastPeriodStart(stats.currentStart);
             calculatePhase(stats.currentStart, stats.cycleLength, fetchedLogs);
          } else if (data.lastPeriodStart) {
             setLastPeriodStart(data.lastPeriodStart);
             calculatePhase(data.lastPeriodStart, 28, fetchedLogs);
          }

          // Cargar log de HOY por defecto
          const todayStr = new Date().toLocaleDateString('en-CA');
          if (fetchedLogs[todayStr]) {
             setSymptoms(fetchedLogs[todayStr]);
          }


          // Escuchar Notificaciones In-App
          const notifRef = collection(db, 'users', user.uid, 'notifications');
          const qNotif = query(notifRef, orderBy('timestamp', 'desc'));
          unsubNotifs = onSnapshot(qNotif, (snap) => {
            const notifs = [];
            snap.forEach(d => notifs.push({ id: d.id, ...d.data() }));
            setNotifications(notifs);
          });

        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      unsubNotifs();
    };
  }, [navigate]);

  const calculatePhase = (startDateStr, cycleLength = 28, logs = {}) => {
    if (!startDateStr) return;
    const start = parseLocalDate(startDateStr);
    const today = new Date();
    start.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    
    const todayStr = today.toLocaleDateString('en-CA');
    const todayLog = logs[todayStr] || {};
    
    // Biomarker Override Prioritization
    if (todayLog.bleeding && todayLog.bleeding !== 'none') {
        setPhase('Menstrual 🩸');
        return;
    }
    if (todayLog.fluid === 'egg_white' || todayLog.fluid === 'watery') {
        setPhase('Fértil (Registrado) ⭐');
        return;
    }

    let diffTime = Math.abs(today - start);
    let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    diffDays = diffDays % cycleLength;
    const dayOfCycle = diffDays + 1;

    if (dayOfCycle > cycleLength - 10) {
        if (todayLog.pain === 'cramps' || todayLog.pain === 'breasts' || todayLog.emotion === 'irritable' || todayLog.emotion === 'sad') {
            setPhase('Lútea (SPM) 🌩️');
            return;
        }
    }

    // Fallback Predicción matemática
    const ovulationDay = cycleLength - 14; 
    const fertileStart = Math.max(0, ovulationDay - 5);
    const fertileEnd = ovulationDay + 2; 

    if (dayOfCycle <= 5) setPhase('Menstrual 🩸');
    else if (dayOfCycle >= fertileStart && dayOfCycle <= fertileEnd) setPhase('Fértil / Ovulatoria 🌟');
    else if (dayOfCycle < fertileStart) setPhase('Folicular 🌸');
    else setPhase('Lútea 🍂');
  };

  // --- Lógica del Calendario Visual ---
  const generateCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Lunes = 0, Domingo = 6
    let firstDayIndex = new Date(year, month, 1).getDay();
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1; 

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    
    const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(viewDate);
    return { days, monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1), year };
  };

  const getPhaseStyles = (date) => {
    const stats = getCycleStats(myLogs);
    const activeStart = stats.currentStart || lastPeriodStart;
    
    if (!activeStart || !date) return { bg: 'transparent', color: 'var(--color-text-muted)', border: 'transparent' };
    const start = parseLocalDate(activeStart);
    start.setHours(0,0,0,0);
    const d = new Date(date);
    d.setHours(0,0,0,0);

    const isToday = d.getTime() === new Date().setHours(0,0,0,0);
    const dStr = d.toLocaleDateString('en-CA');
    const dayLog = myLogs[dStr];

    let diffTime = d - start;

    // Prioridad Absoluta: Biomarcadores Corporales (HISTORIA APLICA AQUÍ)
    if (dayLog) {
        if (dayLog.bleeding && dayLog.bleeding !== 'none') {
            return { bg: 'var(--color-unsafe)', color: 'var(--color-danger)', border: 'transparent', current: true, isToday }; 
        }
        if (dayLog.fluid === 'egg_white' || dayLog.fluid === 'watery') {
            return { bg: 'var(--color-safe)', color: 'var(--color-success)', border: 'transparent', dot: '⭐', isToday };
        }
        
        let cycleDayOffset = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        let diffDays = cycleDayOffset % stats.cycleLength; 
        const dayOfCycle = diffDays >= 0 ? diffDays + 1 : 0; 
        
        if (dayOfCycle > stats.cycleLength - 10) {
            if (dayLog.pain === 'cramps' || dayLog.pain === 'breasts' || ['irritable', 'sad', 'anxious'].includes(dayLog.emotion)) {
               return { bg: 'var(--color-surface)', color: 'var(--color-text-main)', border: 'transparent', dot: '🌩️', isToday };
            }
        }
    }

    // Fallback: Predicción Matemática (continúa hacia el pasado y futuro)
    let cycleDayOffset = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    let diffDays = ((cycleDayOffset % stats.cycleLength) + stats.cycleLength) % stats.cycleLength; 
    const dayOfCycle = diffDays + 1;
    
    // Fallback: Predicción Matemática (No existe log explícito)
    const ovulationDay = stats.cycleLength - 14; 
    const fertileStart = Math.max(0, ovulationDay - 5);
    const fertileEnd = ovulationDay + 2; 

    // Usamos border dashed para evidenciar que es solo una proyección a futuro/pasado no confirmada.
    if (dayOfCycle <= 5) return { bg: 'transparent', color: 'var(--color-danger)', border: '1px dashed var(--color-danger)', isPrediction: true, isToday }; 
    if (dayOfCycle >= fertileStart && dayOfCycle <= fertileEnd) {
       const isPeak = dayOfCycle === ovulationDay;
       return { bg: 'transparent', color: 'var(--color-success)', border: '1px dashed var(--color-success)', dot: isPeak ? '✨' : null, isPrediction: true, isToday };
    }
    return { bg: 'transparent', color: 'var(--color-text-main)', border: 'transparent', isPrediction: true, isToday }; 
  };

  // -- Componente de Vista Circular --
  const CircularCycleView = ({ cycleLength, dayOfCycle }) => {
    const r = 110;
    const cx = 150;
    const cy = 150;
    const c = 2 * Math.PI * r;
    
    // Fallbacks si no hay dtos
    const cLength = cycleLength || 28;
    const dCycle = Math.max(1, Math.min(dayOfCycle || 1, cLength));
  
    const ovulationDay = cLength - 14;
    const fertileStart = Math.max(1, ovulationDay - 5);
    const fertileEnd = ovulationDay + 2;
    const fertileDays = fertileEnd - fertileStart + 1;
    const periodDays = 5;
  
    const anglePerDay = 360 / cLength;
  
    return (
      <div style={{ position: 'relative', width: '300px', height: '300px', margin: '1rem auto' }}>
        <svg width="300" height="300" viewBox="0 0 300 300" style={{ transform: 'rotate(-90deg)', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.03))' }}>
          {/* Base Track */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="22" />
          
          {/* Period Track (Pink/Red) */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f472b6" strokeWidth="22"
            strokeDasharray={`${(periodDays / cLength) * c} ${c}`}
            strokeLinecap="round"
          />
  
          {/* Fertile Track (Blue) */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#38bdf8" strokeWidth="22"
            strokeDasharray={`${(fertileDays / cLength) * c} ${c}`}
            strokeLinecap="round"
            transform={`rotate(${(fertileStart - 1) * anglePerDay}, ${cx}, ${cy})`}
            style={{ transition: 'transform 1s ease' }}
          />
  
          {/* Today Dot Indicator */}
          <circle 
            cx={cx + r * Math.cos(((dCycle - 1) * anglePerDay) * Math.PI / 180)} 
            cy={cy + r * Math.sin(((dCycle - 1) * anglePerDay) * Math.PI / 180)} 
            r="10" fill="#ffffff" stroke="#1e293b" strokeWidth="4" 
            style={{ transition: 'all 1s ease' }}
          />
        </svg>
        
        {/* Middle Text Content */}
        <div className="animate-fade-in" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Día del ciclo</p>
          <h1 style={{ fontSize: '4.5rem', margin: '-5px 0 -5px 0', color: 'var(--color-text-main)', letterSpacing: '-2px' }}>{dCycle}</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-highlight)', fontWeight: 'bold', margin: 0 }}>
            Periodo en {cLength - dCycle > 0 ? cLength - dCycle : 0} días
          </p>
        </div>
      </div>
    );
  };

  // -- Componente del Carrusel de Consejos Diarios --
  const DailyTipsCarousel = ({ dayOfCycle, openDiary, openSymptomsInfo }) => {
    const scrollRef = React.useRef(null);
    const [isDown, setIsDown] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const onMouseDown = (e) => {
      setIsDown(true);
      if (!scrollRef.current) return;
      setStartX(e.pageX - scrollRef.current.offsetLeft);
      setScrollLeft(scrollRef.current.scrollLeft);
    };

    const onMouseLeave = () => setIsDown(false);
    const onMouseUp = () => setIsDown(false);

    const onMouseMove = (e) => {
      if (!isDown || !scrollRef.current) return;
      e.preventDefault();
      const x = e.pageX - scrollRef.current.offsetLeft;
      const walk = (x - startX) * 2; // velocidad de arrastre
      scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    return (
      <div style={{ marginTop: '1rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', marginBottom: '1rem', fontWeight: 700 }}>Mis consejos diarios • Hoy</h3>
        
        <div 
          ref={scrollRef}
          onMouseDown={onMouseDown}
          onMouseLeave={onMouseLeave}
          onMouseUp={onMouseUp}
          onMouseMove={onMouseMove}
          style={{ 
            display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '1rem', 
            scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch',
            cursor: isDown ? 'grabbing' : 'grab'
          }}
        >
          {/* Card 1: Registra tus sintomas */}
          <div onClick={openDiary} style={{ minWidth: '140px', height: '160px', borderRadius: '20px', background: 'var(--color-surface)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-md)', padding: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'transform 0.2s ease', userSelect: 'none' }}>
             <p style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: 700, textAlign: 'center', marginBottom: '1.5rem', lineHeight: 1.3 }}>Registra tus síntomas</p>
             <div style={{ background: 'var(--color-primary)', color: 'var(--btn-text-color)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 'bold', boxShadow: 'var(--shadow-sm)' }}>+</div>
          </div>
  
          {/* Card 2: Posibles síntomas (Dynamic) */}
          <div onClick={openSymptomsInfo} style={{ minWidth: '140px', height: '160px', borderRadius: '20px', background: 'var(--color-safe)', border: '1px solid var(--glass-border)', padding: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, userSelect: 'none', cursor: 'pointer', transition: 'transform 0.2s ease' }}>
             <p style={{ fontSize: '0.85rem', color: 'var(--color-text-highlight)', fontWeight: 700, textAlign: 'center', marginBottom: '1.5rem', lineHeight: 1.3 }}>Posibles síntomas</p>
             <div style={{ fontSize: '2rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>💧</div>
          </div>
  
          {/* Card 3: Día del Ciclo */}
          <div style={{ minWidth: '140px', height: '160px', borderRadius: '20px', background: 'var(--color-unsafe)', border: '1px solid var(--glass-border)', padding: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, userSelect: 'none' }}>
             <p style={{ fontSize: '0.85rem', color: 'var(--color-text-highlight)', fontWeight: 700, textAlign: 'center', marginBottom: '0.5rem' }}>Día del ciclo</p>
             <h2 style={{ fontSize: '3.5rem', color: 'var(--color-text-main)', margin: 0, letterSpacing: '-2px' }}>{dayOfCycle}</h2>
          </div>
        </div>
      </div>
    );
  };

  const handleSaveSymptoms = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    // Usar la fecha SELECCIONADA
    const dateStr = selectedDate; 
    
    try {
      const logRef = doc(db, 'users', auth.currentUser.uid, 'dailyLogs', dateStr);
      await setDoc(logRef, {
        date: dateStr,
        ...symptoms,
        timestamp: new Date().toISOString()
      }, { merge: true });
      
      // Actualizar caché de myLogs para que pinte enseguida y persista en memoria
      const newLogs = {
        ...myLogs,
        [dateStr]: { ...symptoms, date: dateStr }
      };
      setMyLogs(newLogs);
      
      const stats = getCycleStats(newLogs);
      if (stats.currentStart) {
         setLastPeriodStart(stats.currentStart);
         calculatePhase(stats.currentStart, stats.cycleLength);
      }

      setSymptomsSaved(true);
      setTimeout(() => setSymptomsSaved(false), 3000);

      // --- Notificar a pareja automáticamente ---
      if (userData?.linkedPartnerId && dateStr === new Date().toLocaleDateString('en-CA')) {
         if (symptoms.fluid === 'egg_white' || symptoms.fluid === 'watery') {
             await sendNotification(userData.linkedPartnerId, 'Alerta de Pico Fértil ⭐', `${userData.name} acaba de registrar textura cervical fértil.`, '⭐');
         } else if (symptoms.pain === 'cramps' || symptoms.emotions === 'irritable' || symptoms.emotions === 'sad') {
             await sendNotification(userData.linkedPartnerId, 'Síndrome Premenstrual 🌩️', `${userData.name} ha reportado molestias o sensibilidad. ¡Mucha empatía!`, '🌩️');
         } else if (symptoms.bleeding && symptoms.bleeding !== 'none') {
             await sendNotification(userData.linkedPartnerId, 'Inicio de Ciclo 🩸', `${userData.name} ha comenzado su periodo.`, '🩸');
         }
      }

    } catch(err) {
      console.error('Error guardando síntomas diarios:', err);
    }
  };

  const handleDateClick = (date) => {
    if (!date) return;
    const dStr = date.toLocaleDateString('en-CA');
    setSelectedDate(dStr);
    setIsDiaryOpen(true);
    
    if (myLogs[dStr]) {
      const log = myLogs[dStr];
      setSymptoms({
        bleeding:  log.bleeding  || null,
        flowColor: log.flowColor || null,
        fluid:     log.fluid     || null,
        symptoms:  Array.isArray(log.symptoms) ? log.symptoms : [],
        emotions:  log.emotions  || log.emotion || null,
        intimacy:  log.intimacy  || null,
      });
    } else {
      setSymptoms({ bleeding: null, flowColor: null, fluid: null, symptoms: [], emotions: null, intimacy: null });
    }
  };

  useEffect(() => {
     if (!loading && !hasPromptedDailyCheckin) {
         const todayStr = new Date().toLocaleDateString('en-CA');
         if (!myLogs[todayStr]) {
             setShowDailyCheckin(true);
         }
         setHasPromptedDailyCheckin(true);
     }
  }, [loading, hasPromptedDailyCheckin, myLogs]);

  const handleProgressiveCheckInComplete = async (answers) => {
      if (!auth.currentUser) return;
      const dateStr = new Date().toLocaleDateString('en-CA');

      try {
         const logRef = doc(db, 'users', auth.currentUser.uid, 'dailyLogs', dateStr);
         await setDoc(logRef, {
             date: dateStr,
             emotions: answers.emotions,
             pain: answers.pain,
             bleeding: answers.bleeding,
             timestamp: new Date().toISOString()
         }, { merge: true });
         
         const newLogs = {
             ...myLogs,
             [dateStr]: { ...myLogs[dateStr], emotions: answers.emotions, pain: answers.pain, bleeding: answers.bleeding, date: dateStr }
         };
         setMyLogs(newLogs);
         const stats = getCycleStats(newLogs);
         if (stats.currentStart) {
            setLastPeriodStart(stats.currentStart);
            calculatePhase(stats.currentStart, stats.cycleLength);
         }
         
         setShowDailyCheckin(false);
      } catch (err) {
         console.error(err);
      }
  };

  const markNotificationAsRead = async (notifId) => {
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid, 'notifications', notifId), { read: true });
    } catch(e) { console.error(e); }
  };

  if (loading) {
    return <GlobalLoader text="Cargando tu espacio..." />;
  }

  return (
    <div className="app-wrapper responsive-container" style={{ position: 'relative', overflow: 'hidden' }}>

      <style>{`
        @keyframes mhOrb1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(18px,-15px) scale(1.08)} }
        @keyframes mhOrb2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-12px,10px) scale(1.1)} }
        @keyframes mhStagger { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes mhShine { 0%{left:-100%} 100%{left:200%} }
      `}</style>

      {/* Orbes decorativos */}
      <div style={{ position:'absolute', top:'-3%', right:'-10%', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, var(--color-primary), transparent 70%)', opacity:0.07, animation:'mhOrb1 14s ease-in-out infinite', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'absolute', bottom:'20%', left:'-12%', width:220, height:220, borderRadius:'50%', background:'radial-gradient(circle, var(--color-secondary), transparent 70%)', opacity:0.05, animation:'mhOrb2 18s ease-in-out infinite', pointerEvents:'none', zIndex:0 }} />

      {showDailyCheckin && (
         <DailyCheckInModal
            onClose={() => setShowDailyCheckin(false)}
            onComplete={handleProgressiveCheckInComplete}
         />
      )}

      {/* ═══ HERO HEADER ═══ */}
      <div style={{
        borderRadius: '24px', padding: '1.5rem',
        margin: '0.5rem 0 1.5rem',
        background: 'linear-gradient(145deg, var(--color-primary), var(--color-secondary))',
        boxShadow: '0 14px 40px rgba(0,0,0,0.15)',
        position: 'relative', overflow: 'hidden',
        animation: 'mhStagger 0.7s cubic-bezier(0.16,1,0.3,1) forwards'
      }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, background:'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%, rgba(255,255,255,0.06) 100%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:12, right:25, width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.15)', animation:'mhOrb1 5s ease-in-out infinite', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:10, left:15, width:22, height:22, borderRadius:'50%', background:'rgba(255,255,255,0.1)', animation:'mhOrb2 7s ease-in-out infinite', pointerEvents:'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
          <h1 style={{ color: '#fff', fontSize: '1.45rem', margin: 0, fontWeight: 800, letterSpacing: '-0.3px' }}>
            Hola, {userData?.name} 🌸
          </h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowNotifications(true)}
              style={{
                position: 'relative', width: 38, height: 38, borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', cursor: 'pointer'
              }}
              aria-label="Notificaciones"
            >
              🔔
              {notifications.filter(n => !n.read).length > 0 && (
                <span style={{
                  position: 'absolute', top: -3, right: -3, background: '#ef4444',
                  color: '#fff', fontSize: '0.65rem', fontWeight: 'bold',
                  width: 16, height: 16, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('/perfil')}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', cursor: 'pointer', overflow: 'hidden'
              }}
              aria-label="Perfil"
            >
              {userData?.photoURL ? (
                <img src={userData.photoURL} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : '👤'}
            </button>
          </div>
        </div>

        {/* XP Progress embedded in hero */}
        {(() => {
          const { currentLevel: cl, progressRatio: pr, xp: pxp } = (() => {
            if(!userData) return { currentLevel: LEVELS[0], progressRatio: 0, xp: 0 };
            const px = userData.xp || 0;
            const lvl = [...LEVELS].reverse().find(l => l.xpRequired <= px) || LEVELS[0];
            const nlvl = LEVELS.find(l => l.xpRequired > px);
            const ratio = nlvl ? ((px - lvl.xpRequired) / (nlvl.xpRequired - lvl.xpRequired)) * 100 : 100;
            return { currentLevel: lvl, progressRatio: ratio, xp: px };
          })();
          return (
            <div style={{ marginTop: '1rem', position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '5px', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
                <span>Nivel Kegel: {cl.name}</span>
                <span>⭐ {pxp} XP</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.15)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${pr}%`, height: '100%', background: 'rgba(255,255,255,0.7)', borderRadius: '3px', transition: 'width 0.5s ease' }} />
              </div>
            </div>
          );
        })()}
      </div>

      <div>
        <div className="dashboard-grid">
          <div className="dashboard-col">

            <KegelConsistencyWidget logs={userData?.challengeLogs} themeColor="var(--color-primary)" />
            <div
              style={{
                width: '100%', padding: '1rem', cursor: 'pointer',
                background: 'var(--btn-primary-gradient)', borderRadius: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                marginBottom: '1.5rem', position: 'relative', overflow: 'hidden',
                boxShadow: '0 8px 28px rgba(var(--color-primary-rgb,244,63,94),0.25)',
                animation: 'mhStagger 0.6s cubic-bezier(0.16,1,0.3,1) 0.15s both',
                transition: 'transform 0.2s ease'
              }}
              onClick={() => navigate('/kegels')}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ position:'absolute', top:0, left:'-100%', width:'60%', height:'100%', background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', animation:'mhShine 3s ease-in-out infinite', pointerEvents:'none' }} />
              <span style={{ fontSize: '1.4rem', position: 'relative', zIndex: 2 }}>🧘‍♀️</span>
              <h3 style={{ margin: 0, color: 'var(--btn-text-color)', fontSize: '1.05rem', fontWeight: 700, position: 'relative', zIndex: 2 }}>Entrenamiento Pélvico</h3>
            </div>

          {/* ── CARRUSEL DE CALENDARIO (CSS scroll-snap, sin estado de touch) ── */}
          <div style={{ marginBottom: '0.5rem', padding: '0 0.2rem' }}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--color-text-highlight)', fontWeight: 800, marginBottom: 0 }}>{phase.split(' ')[0]}</h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Desliza para cambiar vista</span>
          </div>

          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Contenedor scroll-snap: mueve horizontalmente entre las dos vistas */}
            <div
              ref={calCarouselRef}
              style={{
                display: 'flex',
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                cursor: 'grab',
                userSelect: 'none',
              }}
              className="cal-carousel no-scrollbar"
              onMouseDown={(e) => {
                const el = calCarouselRef.current;
                if (!el) return;
                el.dataset.dragging = 'true';
                el.dataset.startX = e.pageX - el.offsetLeft;
                el.dataset.scrollLeft = el.scrollLeft;
                el.style.cursor = 'grabbing';
                el.style.scrollBehavior = 'auto'; // desactiva smooth durante drag
              }}
              onMouseMove={(e) => {
                const el = calCarouselRef.current;
                if (!el || el.dataset.dragging !== 'true') return;
                e.preventDefault();
                const x = e.pageX - el.offsetLeft;
                const walk = (x - Number(el.dataset.startX)) * 1.5;
                el.scrollLeft = Number(el.dataset.scrollLeft) - walk;
              }}
              onMouseUp={() => {
                const el = calCarouselRef.current;
                if (!el) return;
                el.dataset.dragging = 'false';
                el.style.cursor = 'grab';
                el.style.scrollBehavior = 'smooth'; // reactiva smooth para el snap
              }}
              onMouseLeave={() => {
                const el = calCarouselRef.current;
                if (!el) return;
                el.dataset.dragging = 'false';
                el.style.cursor = 'grab';
                el.style.scrollBehavior = 'smooth';
              }}
            >
              {/* ── SLIDE 1: Vista Circular ── */}
              <div style={{
                flex: '0 0 100%',
                scrollSnapAlign: 'start',
                padding: '1.2rem 1rem',
                boxSizing: 'border-box',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h3 style={{ color: 'var(--color-text-main)', margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Vista Circular</h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600, background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '20px' }}>1 / 2 →</span>
                </div>
                <CircularCycleView
                  cycleLength={getCycleStats(myLogs).cycleLength}
                  dayOfCycle={(() => {
                    const stats = getCycleStats(myLogs);
                    const activeStart = stats.currentStart || lastPeriodStart;
                    if (!activeStart) return 1;
                    const diffTime = new Date().setHours(0,0,0,0) - parseLocalDate(activeStart).setHours(0,0,0,0);
                    const cycleDayOffset = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    return (cycleDayOffset % (stats.cycleLength || 28)) + 1;
                  })()}
                />
              </div>

              {/* ── SLIDE 2: Vista Grilla ── */}
              <div style={{
                flex: '0 0 100%',
                scrollSnapAlign: 'start',
                padding: '1.2rem 1rem',
                boxSizing: 'border-box',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                  <h3 style={{ color: 'var(--color-text-main)', margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                    {generateCalendar().monthName} {generateCalendar().year}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600, background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '20px' }}>← 2 / 2</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)); }}
                      style={{ background: 'rgba(255,255,255,0.08)', border: 'none', width: 28, height: 28, borderRadius: '50%', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >‹</button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)); }}
                      style={{ background: 'rgba(255,255,255,0.08)', border: 'none', width: 28, height: 28, borderRadius: '50%', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >›</button>
                  </div>
                </div>

                {/* Días de semana */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                  {['L','M','X','J','V','S','D'].map(d => <div key={d}>{d}</div>)}
                </div>

                {/* Días del calendario */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
                  {generateCalendar().days.map((date, index) => {
                    if (!date) return <div key={`empty-${index}`} style={{ height: '36px' }} />;
                    const styles = getPhaseStyles(date);
                    const dStr = date.toLocaleDateString('en-CA');
                    const hasLogs = !!myLogs[dStr];
                    const logFluid = myLogs[dStr]?.fluid;
                    const fluidBg = (logFluid === 'egg_white' || logFluid === 'watery')
                      ? 'linear-gradient(135deg, var(--color-safe), transparent)'
                      : styles.bg;
                    const isSelected = selectedDate === dStr;
                    return (
                      <div
                        key={date.toISOString()}
                        onClick={() => handleDateClick(date)}
                        style={{
                          width: '36px', height: '36px', margin: '0 auto',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: '50%',
                          background: isSelected ? 'var(--color-primary)' : fluidBg,
                          color: isSelected ? '#fff' : styles.color,
                          fontWeight: (isSelected || styles.isToday) ? 700 : 500,
                          fontSize: '0.88rem', position: 'relative', cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected ? '0 4px 12px rgba(244,114,182,0.4)' : 'none',
                          border: isSelected ? 'none' : (styles.border || '1px solid transparent'),
                          opacity: styles.isPrediction && !styles.isToday ? 0.65 : 1,
                        }}
                      >
                        {date.getDate()}
                        <div style={{ position: 'absolute', bottom: '3px', display: 'flex', gap: '2px' }}>
                          {styles.isToday && !isSelected && <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--color-text-main)' }} />}
                          {hasLogs && <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: isSelected ? '#fff' : 'var(--color-primary)' }} />}
                          {styles.current && <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#ef4444' }} />}
                        </div>
                        {styles.dot && <span style={{ position: 'absolute', top: '-7px', right: '-7px', fontSize: '11px' }}>{styles.dot}</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Leyenda */}
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', marginTop: '1.2rem', fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#be185d' }} /> Registrado</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '7px', height: '7px', borderRadius: '50%', border: '1px dashed #be185d' }} /> Proyección</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--color-text-muted)' }} /> Seguro</div>
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* Columna Secundaria (Móvil Abajo, PC Derecha) */}
          <div className="dashboard-col" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
              <button 
                 onClick={() => navigate('/insights')}
                 style={{ flex: 1, padding: '1rem', background: 'linear-gradient(135deg, var(--color-secondary), var(--color-primary))', color: 'var(--btn-text-color)', border: 'none', borderRadius: '16px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', boxShadow: 'var(--btn-primary-shadow)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                 📊 Insights
              </button>
              <button 
                 onClick={() => navigate('/academia')}
                 style={{ flex: 1, padding: '1rem', background: 'var(--color-secondary)', color: 'var(--btn-text-color)', border: 'none', borderRadius: '16px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                 📚 Academia
              </button>
            </div>

            <button 
                 onClick={() => navigate('/kegels', { state: { tab: 'CHALLENGE' } })}
                 className="btn btn-primary animate-pulse-slow"
                 style={{ width: '100%', marginBottom: '2rem', padding: '1.2rem', background: 'var(--btn-primary-gradient)', color: 'var(--btn-text-color)', border: 'none', borderRadius: '16px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', boxShadow: 'var(--btn-primary-shadow)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
                 🏆 Entrar al Reto 30 Días
            </button>

          <DailyTipsCarousel 
            dayOfCycle={(() => {
              const stats = getCycleStats(myLogs);
              const activeStart = stats.currentStart || lastPeriodStart;
              if (!activeStart) return 1;
              const diffTime = new Date().setHours(0,0,0,0) - parseLocalDate(activeStart).setHours(0,0,0,0);
              const cycleDayOffset = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              return (cycleDayOffset % (stats.cycleLength || 28)) + 1;
            })()} 
            openDiary={() => {
               setSelectedDate(new Date().toLocaleDateString('en-CA'));
               setIsDiaryOpen(true);
            }} 
            openSymptomsInfo={() => setIsSymptomsInfoOpen(true)}
          />

          {userData?.linkedPartnerId && (
            <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--color-surface)', marginTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--color-text-highlight)', fontSize: '1rem' }}>Tienda de Mimos</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Mima a tu pareja ({userData?.kegelCoins || 0} 💰)</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '1rem', scrollSnapType: 'x mandatory' }}>
                 {MIMOS_CATALOG.map(mimo => (
                    <div 
                       key={mimo.id}
                       onClick={() => handleSendMimo(mimo)}
                       className="hover-scale"
                       style={{ minWidth: '100px', flex: '0 0 100px', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '1rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', scrollSnapAlign: 'start' }}
                    >
                       <span style={{ fontSize: '1.5rem' }}>{mimo.icon}</span>
                       <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-text-main)', textAlign: 'center' }}>{mimo.label}</span>
                       <span style={{ fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: 'bold' }}>💰 {mimo.cost}</span>
                    </div>
                 ))}
              </div>
            </div>
          )}


          {/* Registro Diario de Síntomas - Estilo Clue (Modal) */}
          {isDiaryOpen && createPortal(
            <div 
              className="animate-fade-in"
              style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.6)', // Oscurecido para separar del body
                backdropFilter: 'blur(5px)',
                zIndex: 99999, // Super elevado
                display: 'flex',
                alignItems: 'center', /* Centered vertically */
                justifyContent: 'center',
                padding: '1rem'
              }}
              onClick={() => setIsDiaryOpen(false)}
            >
              <div 
                className="glass-panel" 
                id="diario-form" 
                onClick={(e) => e.stopPropagation()} // Evita cerrar si se clica dentro
                style={{ 
                  margin: 0,
                  width: '100%',
                  maxWidth: '500px',
                  maxHeight: '90vh', // Para no desfasarse de pantalla en moviles
                  overflowY: 'auto',
                  padding: '1.5rem', 
                  background: 'var(--color-bg)',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                  scrollMarginTop: '20px' 
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <h3 style={{ marginBottom: '0.1rem', color: 'var(--color-text-main)' }}>Diario Pélvico</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {selectedDate === new Date().toLocaleDateString('en-CA') ? '¿Cómo te sientes hoy?' : `Registro del ${selectedDate}`}
                    </p>
                  </div>
                  <div style={{ fontSize: '2rem' }}>{selectedDate === new Date().toLocaleDateString('en-CA') ? '✨' : '📅'}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {TRACKING_CATEGORIES.map((category) => (
                    <div key={category.id}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {category.title}
                        {category.multiSelect && <span style={{ fontSize: '0.65rem', background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', borderRadius: '6px', padding: '1px 6px', fontWeight: 700, letterSpacing: 0 }}>Múltiple</span>}
                      </h4>
                      
                      {/* Contenedor scrolleable horizontal */}
                      <div style={{ 
                        display: 'flex', 
                        gap: '12px', 
                        overflowX: 'auto', 
                        paddingBottom: '8px',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                      }}
                      className="hide-scrollbar"
                      >
                        {category.options.map((opt) => {
                          const isSelected = category.multiSelect
                            ? (symptoms[category.id] || []).includes(opt.id)
                            : symptoms[category.id] === opt.id;
                          const alertColor = '#ef4444';
                          const activeColor = opt.alert ? alertColor : category.color;
                          return (
                            <div 
                              key={opt.id}
                              onClick={() => toggleSymptom(category.id, opt.id)}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                minWidth: '72px',
                                cursor: 'pointer',
                                position: 'relative'
                              }}
                            >
                              <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '50%',
                                background: isSelected ? activeColor : (opt.alert ? 'rgba(239,68,68,0.08)' : 'var(--color-surface)'),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem',
                                marginBottom: '6px',
                                transition: 'all 0.2s',
                                boxShadow: isSelected ? `0 4px 12px ${activeColor}50` : 'none',
                                transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                                border: isSelected ? 'none' : (opt.alert ? `1.5px dashed ${alertColor}60` : '1px solid var(--glass-border)')
                              }}>
                                <span style={{ opacity: isSelected ? 1 : 0.75 }}>{opt.icon}</span>
                              </div>
                              {/* Badge de alerta */}
                              {opt.alert && !isSelected && (
                                <span style={{ position: 'absolute', top: -3, right: 6, background: alertColor, color: '#fff', borderRadius: '50%', width: 14, height: 14, fontSize: '0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>!</span>
                              )}
                              <span style={{ 
                                fontSize: '0.72rem', 
                                color: isSelected ? (opt.alert ? alertColor : 'var(--color-text-main)') : 'var(--color-text-muted)',
                                fontWeight: isSelected ? 700 : 500,
                                textAlign: 'center',
                                lineHeight: 1.2
                              }}>
                                {opt.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Mensaje de advertencia si hay alerta seleccionada */}
                      {category.options.some(opt => opt.alert && (
                        category.multiSelect
                          ? (symptoms[category.id] || []).includes(opt.id)
                          : symptoms[category.id] === opt.id
                      )) && (
                        <div style={{ marginTop: '0.5rem', padding: '0.6rem 0.9rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', fontSize: '0.78rem', color: '#ef4444', fontWeight: 600 }}>
                          ⚠️ Considera consultar con tu médico si esto persiste más de 2-3 días.
                        </div>
                      )}
                    </div>
                  ))}

                </div>

                {symptomsSaved && (
                  <div className="animate-fade-in" style={{ marginTop: '1.5rem', color: '#7e22ce', background: '#f3e8ff', padding: '0.8rem', borderRadius: '12px', fontSize: '0.9rem', textAlign: 'center', fontWeight: 'bold' }}>
                    ¡Síntomas guardados! ✨
                  </div>
                )}

                <button 
                  onClick={(e) => {
                    handleSaveSymptoms(e);
                    setTimeout(() => setIsDiaryOpen(false), 1500); // Cerrar corto despues de feedback
                  }}
                  type="button"
                  style={{ 
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                    color: 'var(--btn-text-color)',
                    border: 'none',
                    padding: '1rem',
                    borderRadius: '16px',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(244, 114, 182, 0.4)',
                    width: '100%',
                    marginTop: '1.5rem'
                  }}
                >
                  Guardar Diario
                </button>
                <style jsx="true">{`
                  .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
              </div>
            </div>,
            document.body
          )}

          {/* Modal de Información de Posibles Síntomas */}
          {isSymptomsInfoOpen && createPortal(
            <div 
              className="animate-fade-in"
              style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
                zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1rem'
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsSymptomsInfoOpen(false);
              }}
            >
              <div style={{
                background: 'var(--color-bg)', width: '100%', maxWidth: '400px',
                borderRadius: '30px',
                padding: '2rem', paddingBottom: '2.5rem', maxHeight: '85vh',
                display: 'flex', flexDirection: 'column', gap: '1.5rem',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.4rem', color: 'var(--color-text-highlight)', margin: 0 }}>Qué esperar hoy</h3>
                  <button 
                    onClick={() => setIsSymptomsInfoOpen(false)}
                    style={{ background: 'var(--color-bg)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                  >✕</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--color-text-main)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  <p>Basado en la fase actual de tu ciclo <strong>({phase.split(' ')[0]})</strong>, tu cuerpo experimenta fluctuaciones hormonales que pueden provocar diferentes reacciones.</p>
                  
                  {phase.includes('Menstrual') && (
                    <div style={{ background: 'rgba(236,72,153,0.08)', padding: '1rem', borderRadius: '16px' }}>
                      <p style={{ margin: 0 }}><strong>🩸 Sangrado y Cólicos:</strong> Los niveles de estrógeno y progesterona son bajos. Es muy normal sentir fatiga, dolor pélvico o lumbar, y cambios de humor.</p>
                    </div>
                  )}

                  {phase.includes('Folicular') && (
                    <div style={{ background: 'rgba(52,211,153,0.08)', padding: '1rem', borderRadius: '16px' }}>
                      <p style={{ margin: 0 }}><strong>🌸 Aumento de Energía:</strong> El estrógeno comienza a subir. Te sentirás con más vitalidad, mejor humor y lista para entrenamientos más intensos o reuniones sociales.</p>
                    </div>
                  )}

                  {phase.includes('Fértil') && (
                    <div style={{ background: 'rgba(56,189,248,0.08)', padding: '1rem', borderRadius: '16px' }}>
                      <p style={{ margin: 0 }}><strong>🌟 Pico Hormonal:</strong> El estrógeno alcanza su máximo y liberas testosterona. Notarás un aumento en la libido y el flujo cervical se volverá elástico y claro (como clara de huevo).</p>
                    </div>
                  )}

                  {phase.includes('Lútea') && (
                    <div style={{ background: 'rgba(251,191,36,0.08)', padding: '1rem', borderRadius: '16px' }}>
                      <p style={{ margin: 0 }}><strong>🍂 Fase Pre-menstrual:</strong> La progesterona predomina, lo que puede causar retención de líquidos, sensibilidad en los senos, somnolencia y antojos de carbohidratos.</p>
                    </div>
                  )}
                </div>

              </div>
            </div>,
            document.body
          )}

          </div>
        </div>

        {showNotifications && createPortal(
          <div className="animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)', zIndex: 99999, padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowNotifications(false)}>
             <div className="glass-panel" onClick={e => e.stopPropagation()} style={{ background: 'var(--color-bg)', borderRadius: '24px', padding: '1.5rem', width: '100%', maxWidth: '400px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                   <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-text-main)' }}>Notificaciones</h2>
                   <button onClick={() => setShowNotifications(false)} style={{ background: 'var(--color-bg)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', cursor: 'pointer', color: 'var(--color-text-muted)' }}>✕</button>
                </div>
                {notifications.length === 0 ? (
                   <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.95rem', padding: '2rem 0' }}>No tienes notificaciones aún 📭</p>
                ) : (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {notifications.map(n => (
                         <div key={n.id} onClick={() => !n.read && markNotificationAsRead(n.id)} style={{ padding: '1rem', borderRadius: '16px', background: n.read ? '#f8fafc' : '#fce7f3', border: n.read ? '1px solid #e2e8f0' : '1px solid #fbcfe8', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center', transition: 'all 0.2s', transform: n.read ? 'scale(1)' : 'scale(1.02)' }}>
                            <span style={{ fontSize: '1.8rem' }}>{n.icon || '🔔'}</span>
                            <div style={{ flex: 1 }}>
                               <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-text-main)', fontWeight: 'bold' }}>{n.title}</h4>
                               <p style={{ margin: '2px 0 4px 0', fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.2 }}>{n.body}</p>
                               <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                  {new Date(n.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                               </span>
                            </div>
                            {!n.read && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#e11d48' }}></div>}
                         </div>
                      ))}
                   </div>
                )}
             </div>
          </div>,
          document.body
        )}

      </div>
    </div>
  );
}
