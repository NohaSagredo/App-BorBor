import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy, limit } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { ArrowLeft, Save, User, Activity, Settings, Calendar as CalendarIcon, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import GlobalLoader from '../components/GlobalLoader';

const ADMIN_UID = 'O4uALBlfRGZgqmxxGoEOKicgd0F2';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [dailyLogs, setDailyLogs] = useState({});
  const [logsArray, setLogsArray] = useState([]);
  const [selectedDayData, setSelectedDayData] = useState(null);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null);
  
  // Edit forms
  const [editForm, setEditForm] = useState({
     kegelXp: 0,
     kegelCoins: 0,
     kegelLevel: 1,
     streak: 0,
     name: '',
     role: 'mujer'
  });
  
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user || user.uid !== ADMIN_UID) {
        navigate('/'); // expulsar si no es admin
        return;
      }
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const uList = [];
        usersSnap.forEach(snap => {
            uList.push({ ...snap.data(), uid: snap.id });
        });
        setUsers(uList.sort((a,b) => (a.name || '').localeCompare(b.name || '')));
      } catch(e) {
          console.error("Error cargando usuarios:", e);
      } finally {
          setLoading(false);
      }
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
     if (!selectedUserId) {
         setSelectedUser(null);
         setDailyLogs({});
         setLogsArray([]);
         return;
     }
     
     const fetchUserData = async () => {
         setLoading(true);
         try {
             // Set user object
             const u = users.find(x => x.uid === selectedUserId);
             setSelectedUser(u);
             setEditForm({
                 kegelXp: u.kegelXp || 0,
                 kegelCoins: u.kegelCoins || 0,
                 kegelLevel: u.kegelLevel || 1,
                 streak: u.streak || 0,
                 name: u.name || '',
                 role: u.role || 'mujer'
             });

             // Fetch logs for calendar & insights
             if (u.role === 'mujer') {
                const logsRef = collection(db, 'users', selectedUserId, 'dailyLogs');
                const logsQ = query(logsRef, orderBy('date', 'desc'), limit(90));
                const logsSnap = await getDocs(logsQ);
                
                let dict = {};
                let arr = [];
                logsSnap.forEach(d => {
                    const data = d.data();
                    dict[data.date || d.id] = data;
                    arr.push(data);
                });
                setDailyLogs(dict);
                setLogsArray(arr.reverse()); // chronological for insights if needed, but here reverse is ok
             } else {
                 setDailyLogs({});
                 setLogsArray([]);
             }
         } catch(e) {
             console.error("Error al obtener perfil:", e);
         } finally {
             setLoading(false);
         }
     };
     fetchUserData();
  }, [selectedUserId, users]);

  const handleUpdateUser = async () => {
     if (!selectedUserId) return;
     try {
         setLoading(true);
         await updateDoc(doc(db, 'users', selectedUserId), {
             kegelXp: Number(editForm.kegelXp),
             kegelCoins: Number(editForm.kegelCoins),
             kegelLevel: Number(editForm.kegelLevel),
             streak: Number(editForm.streak),
             name: editForm.name,
             role: editForm.role
         });
         // Reflejar localmente (mutate state)
         const updatedUsers = users.map(u => 
             u.uid === selectedUserId ? { ...u, ...editForm } : u
         );
         setUsers(updatedUsers);
         alert("¡Usuario actualizado exitosamente!");
     } catch(e) {
         console.error(e);
         alert("Error actualizando: " + e.message);
     } finally {
         setLoading(false);
     }
  };

  // --- CALENDAR LOGIC (Ported from MujerHome) ---
  const getCycleStats = (logs) => {
    const dates = Object.keys(logs).sort((a, b) => new Date(a) - new Date(b));
    let bleedingDates = [];
    dates.forEach(d => {
        if (logs[d].bleeding && logs[d].bleeding !== 'none') bleedingDates.push(d);
    });

    if (bleedingDates.length === 0) return { currentStart: null, cycleLength: 28 };

    const clusters = [];
    let currentCluster = [bleedingDates[0]];
    
    for (let i = 0; i < bleedingDates.length - 1; i++) {
       const d1 = new Date(bleedingDates[i]);
       const d2 = new Date(bleedingDates[i+1]);
       const diffDays = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
       if (diffDays <= 4) {
         currentCluster.push(bleedingDates[i+1]);
       } else {
         clusters.push(currentCluster);
         currentCluster = [bleedingDates[i+1]];
       }
    }
    clusters.push(currentCluster);
    // last cluster represents most recent period. the start is the first day of that period
    const currentStart = clusters[clusters.length - 1][0]; 
    let cycleLength = 28;
    
    let totalLength = 0;
    let validCyclesCount = 0;

    for (let i = 0; i < clusters.length - 1; i++) {
        const startCurrent = clusters[i][0];
        const startNext = clusters[i+1][0];
        const diffTicks = new Date(startNext) - new Date(startCurrent);
        let calcLength = Math.floor(diffTicks / (1000 * 60 * 60 * 24));
        if (calcLength >= 21 && calcLength <= 40) {
            totalLength += calcLength;
            validCyclesCount++;
        }
    }
    if (validCyclesCount > 0) cycleLength = Math.round(totalLength / validCyclesCount);
    
    return { currentStart, cycleLength };
  };

  const generateCalendarDays = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let firstDayIndex = new Date(year, month, 1).getDay();
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1; 

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    
    const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(today);
    return { days, monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1), year };
  };

  const getPhaseStyles = (date) => {
    const stats = getCycleStats(dailyLogs);
    const activeStart = stats.currentStart || selectedUser?.lastPeriodStart;
    
    if (!activeStart || !date) return { bg: 'transparent', color: '#94a3b8' };
    const start = new Date(activeStart);
    start.setHours(0,0,0,0);
    const d = new Date(date);
    d.setHours(0,0,0,0);

    const isToday = d.getTime() === new Date().setHours(0,0,0,0);
    const dStr = d.toLocaleDateString('en-CA');
    const dayLog = dailyLogs[dStr];
    let diffTime = d - start;

    if (dayLog) {
        if (dayLog.bleeding && dayLog.bleeding !== 'none') return { bg: '#fee2e2', color: '#ef4444', isToday }; 
        if (dayLog.fluid === 'egg_white' || dayLog.fluid === 'watery') return { bg: '#dcfce7', color: '#22c55e', dot: '⭐', isToday };
    }

    let cycleDayOffset = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    let diffDays = ((cycleDayOffset % stats.cycleLength) + stats.cycleLength) % stats.cycleLength; 
    const dayOfCycle = diffDays + 1;
    
    const ovulationDay = stats.cycleLength - 14; 
    const fertileStart = Math.max(0, ovulationDay - 5);
    const fertileEnd = ovulationDay + 2; 

    if (dayOfCycle <= 5) return { bg: 'transparent', color: '#ef4444', border: '1px dashed #ef4444', isToday }; 
    if (dayOfCycle >= fertileStart && dayOfCycle <= fertileEnd) {
       const isPeak = dayOfCycle === ovulationDay;
       return { bg: 'transparent', color: '#22c55e', border: '1px dashed #22c55e', dot: isPeak ? '✨' : null, isToday };
    }
    return { bg: 'transparent', color: '#334155', isToday }; 
  };
  
  // --- INSIGHTS LOGIC ---
  const stats = useMemo(() => {
    if (!logsArray.length) return null;
    const emotionsCount = { happy: 0, sensitive: 0, sad: 0, irritable: 0 };
    const painCount = { none: 0, cramps: 0, headache: 0, breasts: 0 };
    
    logsArray.forEach(log => {
       const emotionVal = log.emotions || log.emotion;
       if (emotionVal && emotionsCount[emotionVal] !== undefined) emotionsCount[emotionVal]++;
       if (log.pain && painCount[log.pain] !== undefined) painCount[log.pain]++;
    });

    const radarData = [
       { subject: 'Feliz', A: emotionsCount.happy || 0, fullMark: logsArray.length },
       { subject: 'Sensible', A: emotionsCount.sensitive || 0, fullMark: logsArray.length },
       { subject: 'Triste', A: emotionsCount.sad || 0, fullMark: logsArray.length },
       { subject: 'Irritable', A: emotionsCount.irritable || 0, fullMark: logsArray.length }
    ];

    const painData = Object.keys(painCount)
       .filter(k => k !== 'none' && painCount[k] > 0)
       .map(k => ({ 
          name: (k === 'cramps' ? 'Cólicos' : (k === 'headache' ? 'Cabeza' : 'Senos')), 
          cantidad: painCount[k] 
       }));
       
    return { radarData, painData };
  }, [logsArray]);

  if (loading && users.length === 0) return <GlobalLoader text="Accediendo a la Bóveda Maestra..." />;

  const cal = generateCalendarDays();

  return (
    <div style={{ padding: '1.5rem', minHeight: '100vh', background: '#0f172a', color: '#f8fafc', paddingBottom: '4rem', position: 'relative', overflow: 'hidden' }}>

      <style>{`
        @keyframes admOrb1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(15px,-20px) scale(1.08)} }
        @keyframes admOrb2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-18px,12px) scale(1.12)} }
        @keyframes admStagger { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes admShine { 0%{left:-100%} 100%{left:200%} }
        @keyframes admPulse { 0%,100%{box-shadow: 0 0 0 0 rgba(251,191,36,0.3)} 50%{box-shadow: 0 0 20px 4px rgba(251,191,36,0.08)} }
        .adm-input { width: 100%; padding: 0.85rem 1rem; border-radius: 12px; background: rgba(15,23,42,0.8); border: 1px solid rgba(71,85,105,0.5); font-size: 0.95rem; outline: none; transition: border-color 0.2s ease, box-shadow 0.2s ease; }
        .adm-input:focus { border-color: rgba(251,191,36,0.5); box-shadow: 0 0 0 3px rgba(251,191,36,0.08); }
        .adm-section { background: rgba(30,41,59,0.5); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 1.5rem; box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
      `}</style>

      {/* Decorative Orbs */}
      <div style={{ position:'absolute', top:'5%', right:'-8%', width:250, height:250, borderRadius:'50%', background:'radial-gradient(circle, rgba(251,191,36,0.15), transparent 70%)', animation:'admOrb1 16s ease-in-out infinite', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'absolute', bottom:'15%', left:'-10%', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(56,189,248,0.1), transparent 70%)', animation:'admOrb2 20s ease-in-out infinite', pointerEvents:'none', zIndex:0 }} />

      {/* ═══ HERO HEADER ═══ */}
      <div style={{
        borderRadius: '24px', padding: '1.5rem', margin: '0 0 2rem',
        background: 'linear-gradient(145deg, #1e293b, #0f172a)',
        border: '1px solid rgba(251,191,36,0.15)',
        boxShadow: '0 14px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
        position: 'relative', overflow: 'hidden',
        animation: 'admStagger 0.7s cubic-bezier(0.16,1,0.3,1) forwards'
      }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, background:'linear-gradient(135deg, rgba(251,191,36,0.06) 0%, transparent 50%, rgba(56,189,248,0.04) 100%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:10, right:20, width:45, height:45, borderRadius:'50%', background:'rgba(251,191,36,0.08)', animation:'admOrb1 5s ease-in-out infinite', pointerEvents:'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', width: 40, height: 40, cursor: 'pointer', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px' }}>🛡️ Admin Panel</h1>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'rgba(148,163,184,0.8)', fontWeight: 500 }}>Operaciones Centrales BorBor</p>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: '14px', background: 'linear-gradient(145deg, #fbbf24, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 14px rgba(251,191,36,0.25)', animation: 'admPulse 3s ease-in-out infinite' }}>⚡</div>
        </div>
        {/* Stats row */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '1rem', position: 'relative', zIndex: 2 }}>
          {[
            { label: 'Usuarios', value: users.length, color: '#fbbf24' },
            { label: 'Mujeres', value: users.filter(u => u.role === 'mujer').length, color: '#f472b6' },
            { label: 'Hombres', value: users.filter(u => u.role === 'hombre').length, color: '#38bdf8' }
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: '0.6rem', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ User Selector ═══ */}
      <div className="adm-section" style={{ marginBottom: '2rem', animation: 'admStagger 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s both' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.82rem', color: '#fbbf24', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Inspeccionar Usuario</label>
        <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="adm-input" style={{ color: '#f8fafc', cursor: 'pointer' }}>
          <option value="" style={{ background: '#0f172a' }}>-- Selecciona un perfil --</option>
          {users.map(u => (
            <option key={u.uid} value={u.uid} style={{ background: '#0f172a' }}>{u.name || 'Sin Nombre'} ({u.role || '?'}) - {u.uid.slice(0,8)}...</option>
          ))}
        </select>
      </div>

        {loading && selectedUserId && (
           <div style={{ textAlign: 'center', color: '#fbbf24', padding: '2rem' }}>Extrayendo Información...</div>
        )}

        {!loading && selectedUser && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
          {/* ═══ PHOTO HISTORY ═══ */}
          <div className="adm-section" style={{ animation: 'admStagger 0.6s cubic-bezier(0.16,1,0.3,1) 0.15s both' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, color: '#fbbf24', fontSize: '1rem', fontWeight: 700 }}><User size={18}/> Historial de Fotos</h3>

            {(!selectedUser.photoHistory || selectedUser.photoHistory.length === 0) && !selectedUser.photoURL ? (
              <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0 }}>Este usuario no ha subido fotos de perfil aún.</p>
            ) : (
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {selectedUser.photoURL && (!selectedUser.photoHistory || selectedUser.photoHistory.length === 0) && (
                  <div onClick={() => setSelectedPhotoModal(selectedUser.photoURL)} style={{ minWidth: '85px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <img src={selectedUser.photoURL} alt="Perfil Actual" style={{ width: '75px', height: '75px', borderRadius: '14px', objectFit: 'cover', border: '2px solid #fbbf24', boxShadow: '0 4px 12px rgba(251,191,36,0.2)' }} />
                    <span style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 600 }}>Actual</span>
                  </div>
                )}
                {selectedUser.photoHistory && [...selectedUser.photoHistory].reverse().map((entry, idx) => (
                  <div key={idx} onClick={() => setSelectedPhotoModal(entry.url)} style={{ minWidth: '85px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer', transition: 'transform 0.2s' }}>
                    <img src={entry.url} alt="Historial" style={{
                      width: '75px', height: '75px', borderRadius: '14px', objectFit: 'cover',
                      border: idx === 0 ? '2px solid #22c55e' : '2px solid rgba(71,85,105,0.5)',
                      opacity: idx === 0 ? 1 : 0.6,
                      boxShadow: idx === 0 ? '0 4px 12px rgba(34,197,94,0.2)' : 'none'
                    }} />
                    <span style={{ fontSize: '0.7rem', color: idx === 0 ? '#22c55e' : '#64748b', fontWeight: 600 }}>
                      {idx === 0 ? 'Actual' : new Date(entry.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ═══ CRUD FORM ═══ */}
          <div className="adm-section" style={{ animation: 'admStagger 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s both' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, color: '#38bdf8', fontSize: '1rem', fontWeight: 700 }}><Settings size={18}/> Edición CRUD</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Nombre Visible</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="adm-input" style={{ color: '#f8fafc' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Tipo de Perfil</label>
                <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} className="adm-input" style={{ color: '#fbbf24', fontWeight: 700, cursor: 'pointer' }}>
                  <option value="mujer" style={{ background: '#0f172a' }}>Mujer</option>
                  <option value="hombre" style={{ background: '#0f172a' }}>Hombre / Pareja</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>💰 Monedas</label>
                <input type="number" value={editForm.kegelCoins} onChange={e => setEditForm({...editForm, kegelCoins: e.target.value})} className="adm-input" style={{ color: '#22c55e', fontWeight: 700 }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>⭐ Experiencia (XP)</label>
                <input type="number" value={editForm.kegelXp} onChange={e => setEditForm({...editForm, kegelXp: e.target.value})} className="adm-input" style={{ color: '#f59e0b', fontWeight: 700 }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Nivel de Fuerza</label>
                <input type="number" value={editForm.kegelLevel} onChange={e => setEditForm({...editForm, kegelLevel: e.target.value})} className="adm-input" style={{ color: '#f8fafc' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>🔥 Racha Activa</label>
                <input type="number" value={editForm.streak} onChange={e => setEditForm({...editForm, streak: e.target.value})} className="adm-input" style={{ color: '#ef4444', fontWeight: 700 }} />
              </div>
            </div>

            <p style={{ fontSize: '0.75rem', color: '#475569', marginTop: '1rem', marginBottom: 0 }}>
              🔗 ID Vínculo: <span style={{ color: '#64748b' }}>{selectedUser.linkedPartnerId || 'Ninguno'}</span>
            </p>

            <button
              onClick={handleUpdateUser}
              style={{
                background: 'linear-gradient(145deg, #38bdf8, #0ea5e9)', color: '#0f172a',
                fontWeight: 700, border: 'none', width: '100%', padding: '1rem', borderRadius: '14px',
                marginTop: '1.2rem', cursor: 'pointer',
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                fontSize: '0.95rem', boxShadow: '0 6px 20px rgba(56,189,248,0.25)',
                position: 'relative', overflow: 'hidden', transition: 'transform 0.2s ease'
              }}
            >
              <div style={{ position:'absolute', top:0, left:'-100%', width:'60%', height:'100%', background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', animation:'admShine 3s ease-in-out infinite', pointerEvents:'none' }} />
              <Save size={18} /> <span style={{ position: 'relative', zIndex: 2 }}>Forzar Actualización en Servidor</span>
            </button>
          </div>

          {/* ═══ CALENDAR & INSIGHTS (Women Only) ═══ */}
          {selectedUser.role === 'mujer' && (
            <>
            <div className="adm-section" style={{ animation: 'admStagger 0.6s cubic-bezier(0.16,1,0.3,1) 0.25s both' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, color: '#f472b6', fontSize: '1rem', fontWeight: 700 }}><CalendarIcon size={18}/> Calendario Menstrual <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>({logsArray.length} Registros)</span></h3>

              <div style={{ background: 'rgba(15,23,42,0.7)', borderRadius: '16px', padding: '1.2rem', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px', textAlign: 'center', color: '#64748b', fontSize: '0.75rem', fontWeight: 700 }}>
                  <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                  {cal.days.map((date, index) => {
                    if (!date) return <div key={index} style={{ padding: '10px' }} />;
                    const style = getPhaseStyles(date);
                    return (
                      <div key={index}
                        onClick={() => {
                          const dStr = date.toLocaleDateString('en-CA');
                          setSelectedDayData({ date: dStr, log: dailyLogs[dStr] || null });
                        }}
                        style={{
                          position: 'relative', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', height: '38px', borderRadius: '10px',
                          background: style.bg, color: style.color,
                          border: style.border || '1px solid transparent',
                          fontWeight: style.isToday ? 'bold' : 'normal',
                          fontSize: '0.85rem', cursor: 'pointer',
                          boxShadow: style.isToday ? 'inset 0 0 0 2px rgba(251,191,36,0.4)' : 'none',
                          transition: 'background 0.2s ease'
                        }}>
                        <span>{date.getDate()}</span>
                        {style.dot && <span style={{ position: 'absolute', bottom: '-4px', fontSize: '0.5rem' }}>{style.dot}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {stats && (
              <div className="adm-section" style={{ animation: 'admStagger 0.6s cubic-bezier(0.16,1,0.3,1) 0.3s both' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, color: '#a78bfa', fontSize: '1rem', fontWeight: 700 }}><PieChart size={18}/> Insights (Solo Lectura)</h3>

                {/* Radar Emocional */}
                <div style={{ width: '100%', height: 260, background: 'rgba(15,23,42,0.7)', borderRadius: '16px', padding: '1rem', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart outerRadius="65%" data={stats.radarData} margin={{ top: 0, right: 15, bottom: 0, left: 15 }}>
                      <PolarGrid gridType="polygon" stroke="#1e293b" />
                      <PolarAngleAxis dataKey="subject" fontSize={11} tick={{ fill: '#94a3b8' }} />
                      <Radar name="Intensidad Emocional" dataKey="A" stroke="#a78bfa" strokeWidth={2} fill="#a78bfa" fillOpacity={0.4} />
                      <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Barras de Dolor */}
                {stats.painData.length > 0 && (
                  <div style={{ width: '100%', height: 200, background: 'rgba(15,23,42,0.7)', borderRadius: '16px', padding: '1rem', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.painData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="#94a3b8" />
                        <YAxis fontSize={11} tickLine={false} axisLine={false} hide />
                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
                        <Bar dataKey="cantidad" fill="#f472b6" radius={[8, 8, 8, 8]} barSize={36} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
            </>
          )}

            </div>
        )}

      {/* ═══ Day Detail Modal ═══ */}
      {selectedDayData && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(8px)' }}
          onClick={() => setSelectedDayData(null)}
        >
          <div style={{
            background: 'linear-gradient(180deg, #1e293b, #0f172a)', padding: '2rem',
            borderRadius: '20px', border: '1px solid rgba(56,189,248,0.2)',
            maxWidth: '400px', width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)', overflowY: 'auto', maxHeight: '80vh',
            animation: 'admStagger 0.4s cubic-bezier(0.16,1,0.3,1) forwards'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 700 }}><CalendarIcon size={18}/> Registro Biomarcador</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.2rem' }}>Fecha: <span style={{ color: '#94a3b8', fontWeight: 600 }}>{selectedDayData.date}</span></p>

            {selectedDayData.log ? (
              <pre style={{ whiteSpace: 'pre-wrap', color: '#e2e8f0', fontSize: '0.82rem', background: 'rgba(15,23,42,0.8)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', lineHeight: 1.6 }}>
                {JSON.stringify(selectedDayData.log, null, 2).replace(/[{}\"]/g, '').trim()}
              </pre>
            ) : (
              <div style={{ background: 'rgba(15,23,42,0.8)', padding: '1.5rem', borderRadius: '12px', color: '#475569', textAlign: 'center', fontSize: '0.88rem', border: '1px solid rgba(255,255,255,0.04)' }}>
                No hay registros guardados en esta fecha.
              </div>
            )}
            <button onClick={() => setSelectedDayData(null)} style={{
              marginTop: '1.5rem', width: '100%', padding: '0.9rem',
              background: 'rgba(255,255,255,0.06)', color: '#94a3b8',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
              cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem',
              transition: 'all 0.2s ease'
            }}>Cerrar Modal</button>
          </div>
        </div>
      )}

      {/* ═══ Photo Modal ═══ */}
      {selectedPhotoModal && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(8px)' }}
          onClick={() => setSelectedPhotoModal(null)}
        >
          <div style={{
            background: 'linear-gradient(180deg, #1e293b, #0f172a)', padding: '1.2rem',
            borderRadius: '20px', border: '1px solid rgba(56,189,248,0.2)',
            maxWidth: '500px', width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            animation: 'admStagger 0.4s cubic-bezier(0.16,1,0.3,1) forwards'
          }} onClick={e => e.stopPropagation()}>
            <img src={selectedPhotoModal} alt="Ampliada" style={{ width: '100%', height: 'auto', borderRadius: '14px', objectFit: 'contain', maxHeight: '70vh' }} />
            <button onClick={() => setSelectedPhotoModal(null)} style={{
              marginTop: '1rem', width: '100%', padding: '0.9rem',
              background: 'rgba(255,255,255,0.06)', color: '#94a3b8',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
              cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem',
              transition: 'all 0.2s ease'
            }}>Cerrar Galería</button>
          </div>
        </div>
      )}
    </div>
  );
}
