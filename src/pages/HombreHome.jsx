import React, { useState, useEffect } from 'react';
import { auth, db, sendNotification } from '../firebase';
import { doc, getDoc, updateDoc, collection, query, getDocs, increment } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import KegelConsistencyWidget from '../components/KegelConsistencyWidget';
import GlobalLoader from '../components/GlobalLoader';
import { useTheme } from '../components/ThemeProvider';
import { LEVELS } from '../utils/kegelLevels';

export default function HombreHome() {
  const navigate = useNavigate();
  const { themeId, setTheme, themes } = useTheme();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Soporte Multi-pareja
  const [linkedUsers, setLinkedUsers] = useState([]);
  const [activePartnerId, setActivePartnerId] = useState(null);
  const [partnerData, setPartnerData] = useState(null);
  const [partnerLogs, setPartnerLogs] = useState({});
  const [todayLog, setTodayLog] = useState(null);
  

  // Diccionario de Traducción Lógica -> UI
  const MIMOS_CATALOG = [
    { id: 'hug', label: 'Abrazo de oso', icon: '🫂', cost: 10 },
    { id: 'kiss', label: 'Besito', icon: '😚', cost: 15 },
    { id: 'dance', label: 'Baile borborines', icon: '💃', cost: 20 },
    { id: 'movie', label: 'Cupón película', icon: '🍿', cost: 50 },
  ];
  const SYMPTOM_DICT = {
      // Sangrado
      spotting: { label: 'Manchado', icon: '🩸' },
      light: { label: 'Ligero', icon: '💧' },
      medium: { label: 'Medio', icon: '🩸' },
      heavy: { label: 'Fuerte', icon: '🔴' },
      // Dolor
      none: { label: 'Sin dolor', icon: '✨' },
      cramps: { label: 'Cólicos', icon: '⚡' },
      headache: { label: 'Cabeza', icon: '🤕' },
      breasts: { label: 'Senos', icon: '🍈' },
      // Emociones
      happy: { label: 'Feliz', icon: '😊' },
      sensitive: { label: 'Sensible', icon: '🥺' },
      sad: { label: 'Triste', icon: '😢' },
      irritable: { label: 'Irritable', icon: '😤' },
      // Deseo
      high_libido: { label: 'Alta Líbido', icon: '🔥' },
      low_energy: { label: 'Agotada', icon: '🔋' },
      normal: { label: 'Normal', icon: '⭐' },
      // Intimidad
      protected: { label: 'Protección', icon: '🛡️' },
      unprotected_out: { label: 'Afuera', icon: '💦' },
      unprotected_in: { label: 'Adentro', icon: '🎯' },
      masturbation: { label: 'A solas', icon: '🖐️' }
  };

  // --- Lógica de Calendario de Riesgo ---
  const generateCalendar = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let firstDayIndex = new Date(year, month, 1).getDay();
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1; 

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return { days, monthName: new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(today), year };
  };

  const getCycleStats = (logs) => {
    if (!logs) return { currentStart: null, cycleLength: 28 };
    const bleedingDates = Object.keys(logs).filter(date => {
       const b = logs[date]?.bleeding;
       return b && b !== 'none';
    }).sort((a,b) => new Date(b) - new Date(a));
    
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

  const getRiskStyles = (date, partnerStartDate, pLogs) => {
    const stats = getCycleStats(pLogs);
    const activeStart = stats.currentStart || partnerStartDate;
    if (!activeStart || !date) return { bg: 'transparent', color: 'var(--color-text-muted)' };
    
    const start = new Date(activeStart);
    start.setHours(0,0,0,0);
    const d = new Date(date);
    d.setHours(0,0,0,0);
    
    const dateStr = d.toLocaleDateString('en-CA');
    const logs = pLogs?.[dateStr];

    const isToday = d.getTime() === new Date().setHours(0,0,0,0);

    let diffTime = d - start;

    // Prioridad Absoluta: Biomarcadores de la Pareja (Aplica a historia)
    if (logs) {
        if (logs.fluid === 'egg_white' || logs.fluid === 'watery') {
            return { 
               bg: 'var(--color-danger)', 
               color: '#ffffff', 
               isToday, 
               dot: '🚨',
               boxShadow: '0 0 10px var(--color-danger)',
               logs 
            }; 
        }
        if (logs.bleeding && logs.bleeding !== 'none') {
            return { 
               bg: 'var(--color-success)', 
               color: '#ffffff', 
               current: true, 
               dot: '🩸', 
               isToday, 
               logs 
            }; 
        }
        
        let cycleDayOffset = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        let diffDays = cycleDayOffset % stats.cycleLength; 
        const dayOfCycle = diffDays >= 0 ? diffDays + 1 : 0; 

        if (dayOfCycle > stats.cycleLength - 10) {
            if (logs.pain === 'cramps' || logs.pain === 'breasts' || ['irritable', 'sad', 'anxious'].includes(logs.emotion)) {
               return { bg: 'var(--color-unsafe)', color: 'var(--color-danger)', isToday, dot: '🌩️', logs };
            }
        }
    }

    // Predicciones Proyectadas
    let cycleDayOffset = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    let diffDays = ((cycleDayOffset % stats.cycleLength) + stats.cycleLength) % stats.cycleLength; 
    const dayOfCycle = diffDays + 1; 

    const ovulationDay = stats.cycleLength - 14; 
    const viableSpermStart = Math.max(0, ovulationDay - 5);
    const eggDeathDay = ovulationDay + 2; 

    // Ventana de Riesgo Predictiva
    if (dayOfCycle >= viableSpermStart && dayOfCycle <= eggDeathDay) {
       const isPeak = dayOfCycle === ovulationDay;
       return { 
          bg: isPeak ? 'var(--color-danger)' : 'var(--color-unsafe)', 
          color: isPeak ? 'white' : 'var(--color-danger)', 
          border: isPeak ? 'none' : '1px solid var(--color-danger)', 
          isToday, 
          dot: isPeak ? '🔥' : null, 
          isPrediction: true, 
          logs 
       }; 
    } 
    else if (dayOfCycle <= 5) {
       // Menstruación Matemática (Seguro Total)
       return { bg: 'var(--color-success)', color: 'var(--btn-text-color)', border: 'transparent', current: true, isToday, isPrediction: true, logs }; 
    }
    
    // Cualquier otro día: Seguro
    return { bg: 'var(--color-safe)', color: 'var(--color-success)', border: 'transparent', isToday, isPrediction: true, logs }; 
  };

  const getNextOvulationDateStr = () => {
    if (!partnerData) return '--';
    const stats = getCycleStats(partnerLogs);
    let activeStartStr = stats.currentStart || partnerData.lastPeriodStart;
    if (!activeStartStr) return '--';

    const start = new Date(activeStartStr);
    start.setHours(0,0,0,0);
    const ovulationOffsetDays = stats.cycleLength - 14; 
    
    let projectedDate = new Date(start);
    projectedDate.setDate(projectedDate.getDate() + ovulationOffsetDays);
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Si la ovulación proyectada del ultimo ciclo ya pasó, proyectamos al siguiente agregando cycleLengths
    while (projectedDate < today) {
       projectedDate.setDate(projectedDate.getDate() + stats.cycleLength);
    }
    
    return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' }).format(projectedDate);
  };

  // Cargar perfil principal
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { setLoading(false); return; }
      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);

          // Guardar rol y validar acceso (Bug Fix #4)
          if (data.role === 'mujer') {
            navigate('/mujer');
            return;
          }

          let partnersArray = data.linkedPartners || [];
          // Backward compatibility 
          if (partnersArray.length === 0 && data.linkedPartnerId) {
             partnersArray = [{ uid: data.linkedPartnerId, name: 'Pareja' }];
          }

          setLinkedUsers(partnersArray);
          
          if (data.linkedPartnerId) {
             setActivePartnerId(data.linkedPartnerId);
          } else if (partnersArray.length > 0) {
             setActivePartnerId(prev => prev || partnersArray[0].uid);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Cargar datos de la pareja activa cuando cambie
  useEffect(() => {
    if (!activePartnerId) return;

    const fetchPartnerData = async () => {
      try {
        const partnerSnap = await getDoc(doc(db, 'users', activePartnerId));
        if (partnerSnap.exists()) {
          setPartnerData(partnerSnap.data());
          
          const logsQuery = query(collection(db, 'users', activePartnerId, 'dailyLogs'));
          const logsRes = await getDocs(logsQuery);
          
          let fetchedLogs = {};
          logsRes.forEach(doc => { fetchedLogs[doc.id] = doc.data(); });
          setPartnerLogs(fetchedLogs);
          
          const todayStr = new Date().toLocaleDateString('en-CA');
          setTodayLog(fetchedLogs[todayStr] || null);
        }
      } catch(e) {
        console.error('Error al cargar compañera:', e);
      }
    };

    fetchPartnerData();
  }, [activePartnerId]);



  const handleSendMimo = async (mimo) => {
    if (!userData || !activePartnerId) return;
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
      await sendNotification(activePartnerId, title, body, mimo.icon);
      
      alert(`¡Mimo enviado exitosamente! (-${mimo.cost} 💰)`);
    } catch(err) {
       console.error("Error al enviar mimo:", err);
       alert("Error al enviar el mimo.");
    }
  };

  const PartnerInsightsCarousel = ({ logs }) => {
     const [currentIndex, setCurrentIndex] = useState(0);
     const [selectedPopUp, setSelectedPopUp] = useState(null);
     
     const scrollRef = React.useRef(null);
     const [isDown, setIsDown] = useState(false);
     const [startX, setStartX] = useState(0);
     const [scrollLeft, setScrollLeft] = useState(0);

     const logEntries = Object.values(logs || {});
     const totalLogs = logEntries.length;

     const symptomsCount = {};
     logEntries.forEach(log => {
        if (log.pain && log.pain !== 'none') symptomsCount[log.pain] = (symptomsCount[log.pain] || 0) + 1;
        if (log.cramps && log.cramps !== 'Sin dolor') symptomsCount[log.cramps] = (symptomsCount[log.cramps] || 0) + 1;
        if (log.emotion && log.emotion !== 'calm') symptomsCount[log.emotion] = (symptomsCount[log.emotion] || 0) + 1;
     });
     const sortedSymptoms = Object.entries(symptomsCount).sort((a,b)=>b[1]-a[1]);
     const topSymptom = sortedSymptoms[0] || ['Ninguno', 0];

     const intimacyTags = logEntries.filter(log => log.intimacy && log.intimacy !== 'none').length;

     const getLastDate = () => {
         const dates = Object.keys(logs || {}).sort((a,b) => new Date(b) - new Date(a));
         return dates[0] ? new Date(dates[0]).toLocaleDateString() : 'N/A';
     };

     const insightsList = [
         {
             id: 'logs',
             title: 'Consistencia',
             icon: '📅',
             value: totalLogs,
             description: 'Cantidad total de días que tu pareja ha registrado información en su diario.',
             action: 'A mayor consistencia, más precisas se volverán las predicciones de la plataforma.'
         },
         {
             id: 'symptom',
             title: 'Síntoma Principal',
             icon: '🤕',
             value: SYMPTOM_DICT[topSymptom[0]]?.label || topSymptom[0],
             description: `Este síntoma fue reportado ${topSymptom[1]} veces recientemente.`,
             action: 'Si ves este síntoma hoy, envíale un mimo desde tu tienda virtual.'
         },
         {
             id: 'intimacy',
             title: 'Días Íntimos',
             icon: '🔥',
             value: intimacyTags,
             description: 'Número de registros de intimidad guardados en el historial reciente.',
             action: 'Usen el tracker compartido para estar alineados en los mejores días.'
         },
         {
             id: 'activity',
             title: 'Última Actividad',
             icon: '⏱️',
             value: getLastDate(),
             description: 'La última fecha donde se actualizó el diario sincronizado.',
             action: 'Es importante mantener la app viva. ¡Recuérdale actualizar su perfil!'
         }
     ];

     useEffect(() => {
         const interval = setInterval(() => {
             if (!isDown && !selectedPopUp) {
                 setCurrentIndex((prev) => (prev + 1) % insightsList.length);
             }
         }, 4000);
         return () => clearInterval(interval);
     }, [isDown, selectedPopUp, insightsList.length]);

     useEffect(() => {
         if (scrollRef.current) {
             const cardWidth = scrollRef.current.clientWidth;
             scrollRef.current.scrollTo({
                 left: currentIndex * cardWidth,
                 behavior: 'smooth'
             });
         }
     }, [currentIndex]);

     const onMouseDown = (e) => {
         setIsDown(true);
         setStartX(e.pageX - scrollRef.current.offsetLeft);
         setScrollLeft(scrollRef.current.scrollLeft);
     };
     const onMouseLeave = () => setIsDown(false);
     const onMouseUp = () => {
         setIsDown(false);
         if (!scrollRef.current) return;
         const cardWidth = scrollRef.current.clientWidth;
         const closestIndex = Math.round(scrollRef.current.scrollLeft / cardWidth);
         setCurrentIndex(Math.min(Math.max(closestIndex, 0), insightsList.length - 1));
     };
     const onMouseMove = (e) => {
         if (!isDown) return;
         e.preventDefault();
         const x = e.pageX - scrollRef.current.offsetLeft;
         const walk = (x - startX) * 1.5; 
         scrollRef.current.scrollLeft = scrollLeft - walk;
     };

     return (
        <div className="glass-panel" style={{ marginBottom: '1.5rem', width: '100%', background: 'var(--color-surface)', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
           <h3 style={{ fontSize: '1rem', color: 'var(--color-text-highlight)', margin: '1.2rem 1.5rem 0', fontWeight: 700 }}>🔍 Insights de Pareja</h3>
           
           <div 
             ref={scrollRef}
             onMouseDown={onMouseDown}
             onMouseLeave={onMouseLeave}
             onMouseUp={onMouseUp}
             onMouseMove={onMouseMove}
             style={{ 
                 display: 'flex', 
                 overflowX: 'hidden',
                 scrollSnapType: 'x mandatory', 
                 cursor: isDown ? 'grabbing' : 'grab',
                 background: 'transparent'
             }}
           >
             {insightsList.map((item) => (
                 <div 
                   key={item.id} 
                   onClick={() => {
                        if (!isDown) setSelectedPopUp(item);
                   }}
                   style={{ 
                       minWidth: '100%', 
                       flex: '0 0 100%', 
                       padding: '1.5rem', 
                       display: 'flex', 
                       alignItems: 'center', 
                       gap: '1.2rem',
                       scrollSnapAlign: 'start',
                       boxSizing: 'border-box'
                   }}
                 >
                    <div style={{ fontSize: '2.5rem', background: '#f8fafc', minWidth: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       {item.icon}
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.title}</h4>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-main)' }}>{item.value}</span>
                    </div>
                 </div>
             ))}
           </div>
           
           {/* Dots */}
           <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', margin: '0.8rem 0 1.2rem 0' }}>
              {insightsList.map((_, i) => (
                  <span 
                    key={i} 
                    onClick={() => setCurrentIndex(i)}
                    style={{ 
                        width: currentIndex === i ? '16px' : '8px', 
                        height: '8px', 
                        borderRadius: '4px', 
                        background: currentIndex === i ? 'var(--color-primary)' : '#e2e8f0', 
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                    }} 
                  />
              ))}
           </div>

           {selectedPopUp && document.body && createPortal(
               <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedPopUp(null)}>
                  <div className="glass-panel animate-fade-in" style={{ background: 'var(--color-surface)', padding: '2rem', width: '90%', maxWidth: '350px', borderRadius: '24px', textAlign: 'center', cursor: 'default', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid var(--color-primary)' }} onClick={e => e.stopPropagation()}>
                      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{selectedPopUp.icon}</div>
                      <h2 style={{ color: 'var(--color-text-main)', marginBottom: '0.5rem', fontSize: '1.5rem' }}>{selectedPopUp.title}</h2>
                      <h1 style={{ color: 'var(--color-text-highlight)', margin: '0 0 1rem 0', fontSize: '2rem' }}>{selectedPopUp.value}</h1>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                         {selectedPopUp.description}
                      </p>
                      <div style={{ background: 'var(--color-safe)', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem', color: 'var(--color-text-main)', fontStyle: 'italic', marginBottom: '1.5rem', border: '1px solid var(--color-success)' }}>
                         💡 {selectedPopUp.action}
                      </div>
                      <button onClick={() => setSelectedPopUp(null)} className="btn btn-primary" style={{ width: '100%', background: 'var(--btn-primary-gradient)' }}>
                         Cerrar Detalle
                      </button>
                  </div>
               </div>,
               document.body
           )}
        </div>
     );
  };

  if (loading) return <GlobalLoader text="Cargando tu espacio..." />;

  return (
    <div className="app-wrapper responsive-container" style={{ position: 'relative', overflow: 'hidden' }}>

      <style>{`
        @keyframes hhOrb1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(18px,-15px) scale(1.08)} }
        @keyframes hhOrb2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-12px,10px) scale(1.1)} }
        @keyframes hhStagger { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes hhShine { 0%{left:-100%} 100%{left:200%} }
      `}</style>

      {/* Orbes decorativos */}
      <div style={{ position:'absolute', top:'-3%', right:'-10%', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, var(--color-primary), transparent 70%)', opacity:0.07, animation:'hhOrb1 14s ease-in-out infinite', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'absolute', bottom:'20%', left:'-12%', width:220, height:220, borderRadius:'50%', background:'radial-gradient(circle, var(--color-secondary), transparent 70%)', opacity:0.05, animation:'hhOrb2 18s ease-in-out infinite', pointerEvents:'none', zIndex:0 }} />

      {/* ═══ HERO HEADER ═══ */}
      <div style={{
        borderRadius: '24px', padding: '1.5rem',
        margin: '0.5rem 0 1.5rem',
        background: 'linear-gradient(145deg, var(--color-primary), var(--color-secondary))',
        boxShadow: '0 14px 40px rgba(0,0,0,0.15)',
        position: 'relative', overflow: 'hidden',
        animation: 'hhStagger 0.7s cubic-bezier(0.16,1,0.3,1) forwards'
      }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, background:'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%, rgba(255,255,255,0.06) 100%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:12, right:25, width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.15)', animation:'hhOrb1 5s ease-in-out infinite', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:10, left:15, width:22, height:22, borderRadius:'50%', background:'rgba(255,255,255,0.1)', animation:'hhOrb2 7s ease-in-out infinite', pointerEvents:'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: '1.45rem', margin: 0, fontWeight: 800, letterSpacing: '-0.3px' }}>
              Hola, {userData?.name} 👨
            </h1>
            {linkedUsers.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>❤️ Viendo a:</span>
                <select
                  value={activePartnerId || ''}
                  onChange={(e) => setActivePartnerId(e.target.value)}
                  style={{
                    fontSize: '0.78rem', padding: '3px 8px', borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.15)',
                    color: '#fff', fontWeight: 700, outline: 'none', backdropFilter: 'blur(4px)'
                  }}
                >
                  {linkedUsers.map(u => (
                    <option key={u.uid} value={u.uid} style={{ color: '#333' }}>{u.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                const themeIds = Object.keys(themes);
                const nextIndex = (themeIds.indexOf(themeId) + 1) % themeIds.length;
                setTheme(themeIds[nextIndex]);
              }}
              style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s ease'
              }}
              aria-label="Cambiar Tema"
            >
              🎨
            </button>
            <button
              onClick={() => window.location.href='/App-BorBor/perfil'}
              style={{
                width: 40, height: 40, borderRadius: '50%',
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

      {/* ═══ Acciones Rápidas ═══ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.5rem' }}>
        <KegelConsistencyWidget logs={userData?.challengeLogs} themeColor="var(--color-primary)" />
        <div
          style={{
            width: '100%', padding: '1rem', cursor: 'pointer',
            background: 'var(--btn-primary-gradient)', borderRadius: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            boxShadow: '0 8px 28px rgba(var(--color-primary-rgb,244,63,94),0.25)',
            position: 'relative', overflow: 'hidden',
            animation: 'hhStagger 0.6s cubic-bezier(0.16,1,0.3,1) 0.15s both',
            transition: 'transform 0.2s ease'
          }}
          onClick={() => navigate('/kegels')}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ position:'absolute', top:0, left:'-100%', width:'60%', height:'100%', background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', animation:'hhShine 3s ease-in-out infinite', pointerEvents:'none' }} />
          <span style={{ fontSize: '1.4rem', position: 'relative', zIndex: 2 }}>🧘‍♂️</span>
          <h3 style={{ margin: 0, color: 'var(--btn-text-color)', fontSize: '1.05rem', fontWeight: 700, position: 'relative', zIndex: 2 }}>Entrenamiento Pélvico</h3>
        </div>
      </div>

      {/* CTA para vincular si no hay nadie (reemplaza el form local) */}
      {linkedUsers.length === 0 && !loading && (
         <div style={{
           borderRadius: '22px', padding: '2rem', marginBottom: '1.5rem', textAlign: 'center',
           background: 'rgba(var(--color-primary-rgb,244,63,94),0.02)',
           backdropFilter: 'blur(12px)',
           border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
           boxShadow: '0 6px 24px rgba(0,0,0,0.06)',
           animation: 'hhStagger 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s both'
         }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>🔗</div>
            <h2 style={{ color: 'var(--color-text-highlight)', marginBottom: '0.5rem', fontSize: '1.2rem', fontWeight: 800 }}>¡Bienvenido a Holística!</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginBottom: '1.2rem', lineHeight: 1.5 }}>Aún no has vinculado la cuenta de tu pareja. Dirígete a tu Perfil para ingresar su código de sincronización.</p>
            <button onClick={() => navigate('/perfil')} style={{
              width: '100%', padding: '1rem', border: 'none', borderRadius: '14px',
              background: 'var(--btn-primary-gradient)', color: 'var(--btn-text-color, #fff)',
              fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(var(--color-primary-rgb,244,63,94),0.2)',
              transition: 'transform 0.2s ease'
            }}>Ir a Mi Perfil</button>
         </div>
      )}


      {/* Dashboard Activo */}
      {activePartnerId && partnerData && (
        <div className="dashboard-grid">
          <div className="dashboard-col" style={{ marginTop: '1.5rem' }}>
          
           {/* Widget Próxima Ovulación Proyectada */}
           <div className="glass-panel animate-fade-in hover-scale" style={{ padding: '1.2rem', background: 'var(--color-unsafe)', marginBottom: '1.5rem', borderLeft: '4px solid var(--color-danger)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                 <span style={{ fontSize: '0.85rem', color: 'var(--color-danger)', fontWeight: 'bold' }}>Próxima Ovulación Proyectada</span>
                 <span style={{ fontSize: '1.2rem' }}>🔥</span>
             </div>
             <p style={{ fontSize: '1.4rem', color: 'var(--color-danger)', fontWeight: '900', margin: '0.5rem 0 0 0', textTransform: 'capitalize' }}>
                 {getNextOvulationDateStr()}
             </p>
           </div>

           <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', background: 'var(--color-surface)' }} key={`calendar-${activePartnerId}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ color: 'var(--color-text-main)', marginBottom: '0.2rem' }}>Tracker de Fertilidad</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                  {partnerData.name} • {generateCalendar().monthName}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', textAlign: 'center', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>
              <div>L</div><div>M</div><div>X</div><div>J</div><div>V</div><div>S</div><div>D</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', textAlign: 'center' }}>
              {generateCalendar().days.map((date, index) => {
                if (!date) return <div key={`empty-${index}`} style={{ height: '35px' }} />;
                
                const styles = getRiskStyles(date, partnerData?.lastPeriodStart, partnerLogs);
                
                let subIcon = null;
                if (styles.logs) {
                    if (styles.logs.energy === 'high_libido' || styles.logs.libido === 'Alta') subIcon = '🔥';
                    else if (styles.logs.pain && styles.logs.pain !== 'none') subIcon = '⚡';
                    else if (styles.logs.cramps && styles.logs.cramps !== 'Sin dolor') subIcon = '⚡';
                    else if (styles.logs.intimacy === 'unprotected_in') subIcon = '🎯'; // Si la mujer marcó que hubo intimidad adentro ese día
                }

                return (
                  <div 
                    key={date.toISOString()}
                    style={{
                      width: '40px',
                      height: '40px',
                      margin: '0 auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      background: styles.bg,
                      color: styles.color,
                      fontWeight: styles.isToday ? '700' : '500',
                      fontSize: '0.95rem',
                      position: 'relative',
                      cursor: 'default',
                      border: styles.border || '1px solid transparent',
                      opacity: styles.isPrediction && !styles.isToday ? 0.7 : 1,
                      boxShadow: styles.boxShadow || 'none',
                      zIndex: styles.boxShadow ? 10 : 1
                    }}
                  >
                    {date.getDate()}
                    
                    <div style={{ position: 'absolute', bottom: '4px', display: 'flex', gap: '3px' }}>
                       {styles.isToday && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-text-main)' }}></div>}
                       {subIcon && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-primary)' }}></div>}
                       {styles.current && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ef4444' }}></div>}
                    </div>

                    {styles.dot && <span style={{ position: 'absolute', top: '-8px', right: '-8px', fontSize: '14px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>{styles.dot}</span>}
                  </div>
                );
              })}
            </div>

            {/* Leyenda Visual de Seguridad Temática */}
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)' }}></div> Picos de Seguridad</div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-unsafe)', border: '1px solid var(--color-danger)' }}></div> Ventana de Riesgo</div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-danger)' }}></div> Peligro Extremo ⚠️</div>
            </div>
           </div>

           <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', marginTop: '1rem' }}>
             <button 
               onClick={() => navigate('/academia')}
               style={{ width: '100%', background: 'var(--color-secondary)', color: 'var(--btn-text-color)', border: 'none', borderRadius: '16px', padding: '1rem', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
             >
                📚 Academia
             </button>
          </div>

          <button 
               onClick={() => navigate('/kegels', { state: { tab: 'CHALLENGE' } })}
               className="btn btn-primary animate-pulse-slow"
               style={{ width: '100%', marginBottom: '1.5rem', padding: '1.2rem', background: 'var(--btn-primary-gradient)', color: 'var(--btn-text-color)', border: 'none', borderRadius: '16px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', boxShadow: 'var(--btn-primary-shadow)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
               🏆 Entrar al Reto 30 Días
          </button>
          </div><div className="dashboard-col">
            <PartnerInsightsCarousel logs={partnerLogs} />

          <div style={{ marginBottom: '1.5rem' }}>
             {/* Estado actual de la pareja seleccionada */}
             <div className="glass-panel animate-fade-in hover-scale" style={{ padding: '1rem', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column' }} key={activePartnerId}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: 'bold', margin: 0 }}>Estado de Hoy</p>
                    <span style={{ fontSize: '1.2rem' }}>{todayLog ? '✨' : '☁️'}</span>
                </div>
                
                {todayLog ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: 'auto' }}>
                     {['emotions', 'energy', 'pain', 'bleeding'].map(key => {
                        const val = todayLog[key];
                        // Filtrar vacios o 'none' si no queremos saturar
                        if (!val || val === 'none') return null;
                        
                        const data = SYMPTOM_DICT[val];
                        if (!data) return null;
                        
                        // Si es negativo (dolor, triste) pintar fondo rojo, si no gris
                        const isNegative = ['sad', 'irritable', 'cramps', 'headache', 'heavy'].includes(val);
                        const pillBg = isNegative ? '#fee2e2' : '#f3f4f6';
                        const pillColor = isNegative ? '#b91c1c' : '#4b5563';

                        return (
                           <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: pillBg, padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                               <span>{data.icon}</span>
                               <span style={{ color: pillColor }}>{data.label}</span>
                           </div>
                        )
                     })}
                     
                     {/* Pill fallback por si marcó algo q no esta en el map de arriba o puro 'none' */}
                     {Object.keys(todayLog).filter(k => todayLog[k] && !['date', 'timestamp'].includes(k)).length === 0 && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Reporte en blanco</span>
                     )}
                  </div>
                ) : (
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '5px', opacity: 0.6 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Sin registros hoy.</span>
                  </div>
                )}
             </div>
          </div>
          
           {/* Catálogo de Mimos Virtuales Temático */}
           <div className="glass-panel animate-fade-in" style={{ padding: '1.2rem', marginBottom: '1.5rem', background: 'var(--color-surface)', borderLeft: '4px solid var(--color-primary)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--color-text-highlight)', fontSize: '1rem' }}>Tienda de Mimos</h3>
                  <div style={{ fontWeight: 'bold', color: 'var(--color-success)', background: 'var(--color-safe)', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                      💰 {userData?.kegelCoins || 0}
                  </div>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                  Gasta tus monedas de entrenamiento (Kegels) enviando detalles a tu pareja en tiempo real.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                 {MIMOS_CATALOG.map(mimo => (
                    <button 
                       key={mimo.id}
                       onClick={() => handleSendMimo(mimo)}
                       style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s', ':active': { transform: 'scale(0.95)' } }}
                       className="hover-scale"
                    >
                       <span style={{ fontSize: '1.5rem' }}>{mimo.icon}</span>
                       <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-text-main)', textAlign: 'center' }}>{mimo.label}</span>
                       <span style={{ fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: 'bold' }}>💰 {mimo.cost}</span>
                    </button>
                 ))}
              </div>
           </div>
           
          </div>
        </div>
      )}
    </div>
  );
}
