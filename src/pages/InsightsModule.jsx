import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { ArrowLeft, TrendingUp, Activity, Heart, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import GlobalLoader from '../components/GlobalLoader';

export default function InsightsModule() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);
  
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return setLoading(false);
      try {
        const q = query(collection(db, 'users', user.uid, 'dailyLogs'), orderBy('date', 'desc'), limit(90));
        const snap = await getDocs(q);
        const l = [];
        snap.forEach(d => l.push(d.data()));
        setLogs(l);
      } catch(e) { console.error("Error cargando históricos:", e); }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const stats = useMemo(() => {
    if (!logs.length) return null;
    
    const emotionsCount = { happy: 0, sensitive: 0, sad: 0, irritable: 0 };
    const painCount = { none: 0, cramps: 0, headache: 0, breasts: 0 };
    const energyCount = { high_libido: 0, low_energy: 0, normal: 0 };
    
    let totalLogs = logs.length;
    
    logs.forEach(log => {
       const emotionVal = log.emotions || log.emotion;
       if (emotionVal && emotionsCount[emotionVal] !== undefined) emotionsCount[emotionVal]++;
       if (log.pain && painCount[log.pain] !== undefined) painCount[log.pain]++;
       if (log.energy && energyCount[log.energy] !== undefined) energyCount[log.energy]++;
       // Soporte mapeo viejo
       if (log.libido === 'Alta') energyCount.high_libido++;
       if (log.libido === 'Baja') energyCount.low_energy++;
    });

    const radarData = [
       { subject: 'Feliz', A: emotionsCount.happy || 0, fullMark: totalLogs },
       { subject: 'Sensible', A: emotionsCount.sensitive || 0, fullMark: totalLogs },
       { subject: 'Triste', A: emotionsCount.sad || 0, fullMark: totalLogs },
       { subject: 'Irritable', A: emotionsCount.irritable || 0, fullMark: totalLogs }
    ];

    const painData = Object.keys(painCount)
       .map(k => ({ 
          name: k === 'none' ? 'Ninguno' : (k === 'cramps' ? 'Cólicos' : (k === 'headache' ? 'Cabeza' : 'Senos')), 
          cantidad: painCount[k] 
       }))
       .filter(x => x.cantidad > 0);
       
    const energyData = [
       { name: '🔥 Alta Líbido', valor: energyCount.high_libido },
       { name: '⭐ Normal', valor: energyCount.normal },
       { name: '🔋 Ausente', valor: energyCount.low_energy }
    ].filter(x => x.valor > 0);

    return { radarData, painData, energyData, totalLogs };
  }, [logs]);

  if (loading) return <GlobalLoader text="Analizando históricos..." />;

  return (
    <div className="app-wrapper responsive-container" style={{ display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

      <style>{`
        @keyframes insightOrb1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(25px,-20px) scale(1.1)} }
        @keyframes insightOrb2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-20px,15px) scale(1.12)} }
        @keyframes insightStagger1 { from{opacity:0;transform:translateY(25px)} to{opacity:1;transform:translateY(0)} }
        @keyframes insightStagger2 { from{opacity:0;transform:translateY(15px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes insightShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .insight-chart-card {
          border-radius: 22px;
          padding: 1.2rem;
          background: rgba(var(--color-primary-rgb, 244, 63, 94), 0.02);
          backdrop-filter: blur(12px);
          border: 1px solid var(--glass-border, rgba(255,255,255,0.1));
          box-shadow: 0 6px 24px rgba(0,0,0,0.08);
          position: relative;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .insight-chart-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.12);
        }
        .insight-chart-label {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 1rem 0;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--color-text-main);
        }
        .insight-chart-icon {
          width: 34px; height: 34px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
      `}</style>

      {/* Orbes decorativos */}
      <div style={{ position:'absolute', top:'-5%', right:'-10%', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, #8b5cf6, transparent 70%)', opacity:0.08, animation:'insightOrb1 16s ease-in-out infinite', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'10%', left:'-15%', width:250, height:250, borderRadius:'50%', background:'radial-gradient(circle, #3b82f6, transparent 70%)', opacity:0.06, animation:'insightOrb2 20s ease-in-out infinite', pointerEvents:'none' }} />

      {/* ═══ HERO HEADER ═══ */}
      <div style={{
        borderRadius: '24px',
        padding: '1.8rem 1.5rem 1.5rem',
        marginBottom: '1.5rem',
        background: 'linear-gradient(145deg, var(--color-primary), var(--color-secondary))',
        boxShadow: '0 14px 40px rgba(0,0,0,0.15)',
        position: 'relative', overflow: 'hidden',
        animation: mounted ? 'insightStagger1 0.7s cubic-bezier(0.16,1,0.3,1) forwards' : 'none',
        opacity: mounted ? 1 : 0
      }}>
        {/* Glass overlay */}
        <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, background:'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%, rgba(255,255,255,0.06) 100%)', pointerEvents:'none' }} />
        {/* Partículas */}
        <div style={{ position:'absolute', top:15, right:25, width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.2)', animation:'insightOrb1 5s ease-in-out infinite', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:20, left:15, width:25, height:25, borderRadius:'50%', background:'rgba(255,255,255,0.15)', animation:'insightOrb2 7s ease-in-out infinite', pointerEvents:'none' }} />

        {/* Volver */}
        <button onClick={() => navigate(-1)} style={{
          background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px',
          padding: '0.4rem 0.9rem', fontSize: '0.82rem', cursor: 'pointer',
          color: '#fff', display: 'flex', alignItems: 'center', gap: '5px',
          fontWeight: 600, marginBottom: '1rem', position: 'relative', zIndex: 2
        }}>
          <ArrowLeft size={14} /> Volver
        </button>

        {/* Título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 2 }}>
          <div style={{
            width: 46, height: 46, borderRadius: '14px',
            background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.25)'
          }}>
            <TrendingUp size={24} color="#fff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#fff', fontWeight: 800, letterSpacing: '-0.3px' }}>
              Insights Analíticos
            </h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
              Procesando últimos {logs.length} registros
            </p>
          </div>
        </div>

        {/* Stats chips fila */}
        <div style={{
          margin: '1rem 0 0', height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          backgroundSize: '200% 100%', animation: 'insightShimmer 3s linear infinite'
        }} />
        <div style={{ display: 'flex', gap: '8px', marginTop: '0.8rem', position: 'relative', zIndex: 2 }}>
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'2px', background:'rgba(255,255,255,0.12)', backdropFilter:'blur(6px)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'14px', padding:'0.55rem 0.3rem' }}>
            <span style={{ fontSize:'1rem' }}>📊</span>
            <span style={{ color:'#fff', fontSize:'1.05rem', fontWeight:800 }}>{logs.length}</span>
            <span style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.6rem', fontWeight:600 }}>Registros</span>
          </div>
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'2px', background:'rgba(255,255,255,0.12)', backdropFilter:'blur(6px)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'14px', padding:'0.55rem 0.3rem' }}>
            <span style={{ fontSize:'1rem' }}>🧠</span>
            <span style={{ color:'#fff', fontSize:'1.05rem', fontWeight:800 }}>
              {stats ? Object.values(stats.radarData).reduce((a,b) => a + b.A, 0) : 0}
            </span>
            <span style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.6rem', fontWeight:600 }}>Emociones</span>
          </div>
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'2px', background:'rgba(255,255,255,0.12)', backdropFilter:'blur(6px)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'14px', padding:'0.55rem 0.3rem' }}>
            <span style={{ fontSize:'1rem' }}>📅</span>
            <span style={{ color:'#fff', fontSize:'1.05rem', fontWeight:800 }}>90d</span>
            <span style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.6rem', fontWeight:600 }}>Rango</span>
          </div>
        </div>
      </div>

      {/* ═══ Separador ═══ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.2rem' }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, var(--color-primary), transparent)' }} />
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Análisis</span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(270deg, var(--color-primary), transparent)' }} />
      </div>
       
      {!stats || stats.totalLogs === 0 ? (
        <div className="glass-panel" style={{
          padding: '2.5rem 2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem',
          animation: mounted ? 'insightStagger2 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s both' : 'none'
        }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📊</div>
          <p style={{ fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>Sin datos suficientes</p>
          <p style={{ margin: 0, lineHeight: 1.5 }}>No hay suficientes registros diarios para generar modelos estadísticos. ¡Sigue completando tu diario!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '3rem' }}>
           
          {/* Frecuencia de Dolor */}
          <div className="insight-chart-card" style={{
            animation: mounted ? 'insightStagger2 0.6s cubic-bezier(0.16,1,0.3,1) 0.15s both' : 'none'
          }}>
            <div className="insight-chart-label">
              <div className="insight-chart-icon" style={{ background: 'rgba(139,92,246,0.12)' }}>
                <Zap size={18} color="#8b5cf6" />
              </div>
              Histórico de Molestias
            </div>
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.painData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} hide />
                  <Tooltip cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }} contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', backdropFilter: 'blur(8px)' }} />
                  <Bar dataKey="cantidad" fill="#8b5cf6" radius={[8, 8, 8, 8]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar Emocional */}
          <div className="insight-chart-card" style={{
            animation: mounted ? 'insightStagger2 0.6s cubic-bezier(0.16,1,0.3,1) 0.3s both' : 'none'
          }}>
            <div className="insight-chart-label">
              <div className="insight-chart-icon" style={{ background: 'rgba(59,130,246,0.12)' }}>
                <Heart size={18} color="#3b82f6" />
              </div>
              Radar Emocional
            </div>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius="65%" data={stats.radarData} margin={{ top: 0, right: 15, bottom: 0, left: 15 }}>
                  <PolarGrid gridType="polygon" />
                  <PolarAngleAxis dataKey="subject" fontSize={11} tick={{ fill: 'var(--color-text-muted)', fontWeight: 'bold' }} />
                  <Radar name="Días Registrados" dataKey="A" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.4} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Barras Horizontales de Líbido */}
          <div className="insight-chart-card" style={{
            animation: mounted ? 'insightStagger2 0.6s cubic-bezier(0.16,1,0.3,1) 0.45s both' : 'none'
          }}>
            <div className="insight-chart-label">
              <div className="insight-chart-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>
                <Activity size={18} color="#f59e0b" />
              </div>
              Tendencia de Deseo
            </div>
            <div style={{ width: '100%', height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={stats.energyData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(245, 158, 11, 0.05)' }} contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} />
                  <Bar dataKey="valor" fill="#f59e0b" radius={[0, 8, 8, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Resumen biológico */}
          <div style={{
            borderRadius: '20px', padding: '1.3rem',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            color: '#fff', display: 'flex', gap: '12px', alignItems: 'flex-start',
            boxShadow: '0 8px 28px rgba(var(--color-primary-rgb, 244, 63, 94), 0.2)',
            position: 'relative', overflow: 'hidden',
            animation: mounted ? 'insightStagger2 0.6s cubic-bezier(0.16,1,0.3,1) 0.6s both' : 'none'
          }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, background:'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)', pointerEvents:'none' }} />
            <span style={{ fontSize: '1.8rem', position: 'relative', zIndex: 2 }}>✨</span>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <h3 style={{ margin: '0 0 0.3rem 0', fontSize: '1rem', fontWeight: 800 }}>Resumen Biológico</h3>
              <p style={{ margin: 0, fontSize: '0.82rem', opacity: 0.9, lineHeight: 1.5 }}>Tus patrones nos ayudan a calcular con mayor precisión los días de riesgo y notificar proactivamente a tu pareja sobre tus necesidades.</p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
