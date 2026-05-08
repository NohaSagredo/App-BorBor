import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="app-wrapper responsive-container relative flex flex-col items-center justify-center min-h-screen text-center z-10"
    >
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-15%] w-[300px] h-[300px] rounded-full bg-primary/20 blur-[80px] animate-pulse" style={{ pointerEvents: 'none' }} />
      <div className="absolute bottom-[-5%] left-[-20%] w-[350px] h-[350px] rounded-full bg-secondary/20 blur-[90px] animate-pulse" style={{ animationDelay: '2s', pointerEvents: 'none' }} />
      
      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.8, type: "spring" }}
        className="mb-10 relative z-10"
      >
        <div className="relative w-28 h-28 mx-auto mb-6">
          <div className="absolute inset-[-10px] border-2 border-dashed border-primary/30 rounded-full animate-[spin_20s_linear_infinite]" />
          <div className="absolute inset-[-4px] border border-secondary/20 rounded-full animate-[spin_30s_linear_infinite_reverse]" />
          <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_12px_40px_rgba(244,63,94,0.3)] relative overflow-hidden animate-[pulse_3s_ease-in-out_infinite]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent pointer-events-none" />
            <span className="text-5xl relative z-10 drop-shadow-md">🌸</span>
          </div>
        </div>

        <h1 className="text-5xl font-black mb-2 tracking-tight bg-gradient-to-br from-white to-slate-300 bg-clip-text text-transparent">
          BorBor
        </h1>
        <p className="text-slate-400 text-lg font-medium tracking-wide">
          Tu espacio íntimo, conectado y seguro.
        </p>
      </motion.div>

      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8, type: "spring" }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full pointer-events-none blur-2xl" />
          
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">Comienza tu viaje</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Bienestar pélvico, consciencia corporal y salud integral.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={() => navigate('/auth')}
              className="relative w-full py-4 px-6 rounded-2xl bg-primary text-white font-bold text-lg flex items-center justify-center gap-3 overflow-hidden group hover:scale-[1.02] transition-all shadow-[0_8px_30px_rgba(244,63,94,0.3)] hover:shadow-[0_12px_40px_rgba(244,63,94,0.45)]"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
              Iniciar Sesión
              <ArrowRight size={20} />
            </button>
            
            <button 
              onClick={() => navigate('/auth?signup=true')}
              className="w-full py-4 px-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-white font-semibold flex items-center justify-center gap-2 hover:bg-white/10 hover:border-primary/50 transition-all hover:-translate-y-0.5"
            >
              <Sparkles size={18} className="text-primary" />
              Crear Cuenta Nueva
            </button>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex flex-wrap justify-center gap-2 mt-6"
        >
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">🧘 Kegel Training</span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">📊 Insights</span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">📚 Academia</span>
        </motion.div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="mt-12 flex items-center gap-2 text-slate-500 text-xs font-medium relative z-10"
      >
        <Shield size={14} />
        Sincronización encriptada de extremo a extremo
      </motion.div>
    </motion.div>
  );
}
