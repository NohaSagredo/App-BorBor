import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ArrowLeft, LogIn, UserPlus, Mail, Lock, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialIsSignup = queryParams.get('signup') === 'true';
  const [isLogin, setIsLogin] = useState(!initialIsSignup);
  const [role, setRole] = useState('mujer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        let userRole = 'mujer';
        const userDoc = await getDoc(doc(db, 'users', userCred.user.uid));
        if (userDoc.exists() && userDoc.data().role) {
           userRole = userDoc.data().role;
        }
        navigate(userRole === 'mujer' ? '/mujer' : '/hombre');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: name });
        const generatedLinkCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: name,
          email: email,
          role: role,
          createdAt: new Date().toISOString(),
          linkCode: role === 'mujer' ? generatedLinkCode : '', 
          linkedPartnerId: ''
        });
        navigate(role === 'mujer' ? '/mujer' : '/hombre');
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('El correo ya está en uso. Por favor, inicia sesión.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Correo o contraseña incorrectos.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError('Ocurrió un error. Inténtalo nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="app-wrapper responsive-container relative flex flex-col items-center justify-center min-h-screen z-10"
    >
      {/* Background Orbs */}
      <div className="absolute top-[-8%] right-[-12%] w-64 h-64 rounded-full bg-primary/20 blur-[80px] animate-pulse" style={{ pointerEvents: 'none' }} />
      <div className="absolute bottom-[-5%] left-[-15%] w-72 h-72 rounded-full bg-secondary/20 blur-[90px] animate-pulse" style={{ animationDelay: '2s', pointerEvents: 'none' }} />

      {/* Botón Volver */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 text-sm font-semibold text-slate-400 flex items-center gap-2 hover:bg-white/20 hover:text-white transition-all z-20 shadow-sm"
      >
        <ArrowLeft size={16} /> Volver
      </button>

      {/* Header animado */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="mb-8 text-center relative z-10 w-full max-w-sm"
      >
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_10px_35px_rgba(244,63,94,0.25)] relative overflow-hidden mb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent pointer-events-none" />
          {isLogin ? <LogIn size={32} className="text-white relative z-10" /> : <UserPlus size={32} className="text-white relative z-10" />}
        </div>
        <h1 className="text-3xl font-extrabold mb-1 tracking-tight bg-gradient-to-br from-white to-slate-300 bg-clip-text text-transparent">
          {isLogin ? '¡Hola otra vez!' : 'Comienza tu viaje'}
        </h1>
        <p className="text-slate-400 text-sm font-medium">
          {isLogin ? 'Nos alegra verte de nuevo.' : 'Crea tu espacio seguro y personal.'}
        </p>
      </motion.div>

      {/* Tarjeta Principal */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full pointer-events-none blur-2xl" />

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl mb-4 text-xs font-semibold text-center backdrop-blur-sm overflow-hidden"
              >
                ⚠️ {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col gap-4 overflow-hidden"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tipo de Perfil</label>
                    <div className="flex gap-2">
                      <button 
                        type="button" 
                        onClick={() => setRole('mujer')}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                          role === 'mujer' 
                            ? 'bg-primary text-white shadow-[0_4px_15px_rgba(244,63,94,0.25)] scale-[1.02]' 
                            : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        🌸 Mujer
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setRole('hombre')}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                          role === 'hombre' 
                            ? 'bg-primary text-white shadow-[0_4px_15px_rgba(244,63,94,0.25)] scale-[1.02]' 
                            : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        💪 Hombre
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Nombre</label>
                    <div className="relative group">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                      <input 
                        type="text" 
                        placeholder="Ej. Ana o Carlos" 
                        value={name}
                        onChange={(e) => setName(e.target.value)} 
                        required={!isLogin}
                        className="w-full bg-white/5 border border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl py-3 pl-11 pr-4 text-white text-sm outline-none transition-all"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Correo Electrónico</label>
              <div className="relative group">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input 
                  type="email" 
                  placeholder="tu@correo.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)} 
                  required
                  className="w-full bg-white/5 border border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl py-3 pl-11 pr-4 text-white text-sm outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Contraseña</label>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input 
                  type="password" 
                  placeholder="Mínimo 6 caracteres" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} 
                  required
                  className="w-full bg-white/5 border border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl py-3 pl-11 pr-4 text-white text-sm outline-none transition-all"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="relative w-full mt-2 py-3.5 rounded-xl bg-primary text-white font-bold flex items-center justify-center gap-2 overflow-hidden hover:scale-[1.02] transition-all shadow-[0_8px_28px_rgba(244,63,94,0.3)] hover:shadow-[0_12px_36px_rgba(244,63,94,0.4)] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? <LogIn size={18} /> : <Sparkles size={18} />}
                  {isLogin ? 'Entrar' : 'Crear Cuenta'}
                </>
              )}
            </button>
          </form>

          {/* Separador */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          <div className="text-center text-sm text-slate-400">
            {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes una cuenta? '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-primary font-bold hover:underline underline-offset-2 transition-all"
            >
              {isLogin ? 'Regístrate' : 'Inicia Sesión'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
