import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged
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
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        await getRedirectResult(auth);
      } catch (err) {
        console.error(err);
        if (err.code === 'auth/unauthorized-domain') {
          setError('Este dominio no está autorizado en Firebase. Añádelo en la consola.');
        } else {
          setError('Error al completar el inicio de sesión con Google.');
        }
        localStorage.removeItem('google_auth_in_progress');
      }
    };
    checkAuthAndRedirect();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoading(true);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          const googleAuthInProgress = localStorage.getItem('google_auth_in_progress') === 'true';
          const isGoogleUser = user.providerData.some(p => p.providerId === 'google.com');

          if (userDoc.exists()) {
            localStorage.removeItem('google_auth_in_progress');
            const userData = userDoc.data();
            if (userData.role) {
              navigate(userData.role === 'mujer' ? '/mujer' : '/hombre');
            } else {
              setGoogleUser(user);
              setName(user.displayName || '');
              setShowRoleSelection(true);
            }
          } else {
            if (googleAuthInProgress || isGoogleUser) {
              setGoogleUser(user);
              setName(user.displayName || '');
              setShowRoleSelection(true);
            }
          }
        } catch (err) {
          console.error(err);
          setError('Error al verificar el perfil del usuario.');
        } finally {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    localStorage.setItem('google_auth_in_progress', 'true');
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
    } catch (err) {
      console.error(err);
      setError('Error al iniciar sesión con Google. Inténtalo de nuevo.');
      localStorage.removeItem('google_auth_in_progress');
      setLoading(false);
    }
  };

  const handleCompleteGoogleRegistration = async () => {
    if (!googleUser) return;
    setLoading(true);
    setError('');
    try {
      const generatedLinkCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await setDoc(doc(db, 'users', googleUser.uid), {
        uid: googleUser.uid,
        name: name || googleUser.displayName || 'Usuario',
        email: googleUser.email,
        role: role,
        createdAt: new Date().toISOString(),
        linkCode: generatedLinkCode,
        linkedPartnerId: ''
      });
      localStorage.removeItem('google_auth_in_progress');
      navigate(role === 'mujer' ? '/mujer' : '/hombre');
    } catch (err) {
      console.error(err);
      setError('Error al crear el perfil en la base de datos.');
    } finally {
      setLoading(false);
      setShowRoleSelection(false);
      setGoogleUser(null);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Ingresa tu correo electrónico primero.');
      return;
    }
    setResetLoading(true);
    setError('');
    setResetSent(false);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('No existe una cuenta con ese correo.');
      } else if (err.code === 'auth/invalid-email') {
        setError('El correo ingresado no es válido.');
      } else {
        setError('Error al enviar el correo. Inténtalo de nuevo.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
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
          linkCode: generatedLinkCode, 
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

          <AnimatePresence mode="wait">
            {showRoleSelection ? (
              <motion.div
                key="role-selection"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-5"
              >
                <div className="text-center">
                  <h3 className="text-lg font-bold text-white mb-1">Paso final 🚀</h3>
                  <p className="text-slate-400 text-xs font-medium">
                    Queremos personalizar tu experiencia. ¿Cuál es tu tipo de perfil?
                  </p>
                </div>

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
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tu Nombre</label>
                  <div className="relative group">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Tu nombre" 
                      value={name}
                      onChange={(e) => setName(e.target.value)} 
                      required
                      className="w-full bg-white/5 border border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl py-3 pl-11 pr-4 text-white text-sm outline-none transition-all"
                    />
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={handleCompleteGoogleRegistration}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-primary text-white font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-[0_8px_28px_rgba(244,63,94,0.3)] disabled:opacity-70"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Completar Registro
                    </>
                  )}
                </button>

                <button 
                  type="button" 
                  onClick={() => {
                    setShowRoleSelection(false);
                    setGoogleUser(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white font-semibold text-sm transition-all"
                >
                  Cancelar
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="auth-form-container"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
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
                    {isLogin && (
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={resetLoading}
                        className="text-xs text-slate-400 hover:text-primary font-semibold transition-colors mt-1 self-end disabled:opacity-50"
                      >
                        {resetLoading ? 'Enviando...' : '¿Olvidaste tu contraseña?'}
                      </button>
                    )}
                  </div>

                  <AnimatePresence>
                    {resetSent && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs font-semibold text-center backdrop-blur-sm overflow-hidden"
                      >
                        ✅ Se envió un enlace de recuperación a <strong>{email}</strong>. Revisa tu bandeja de entrada.
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {isLogin && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none', marginTop: '0.25rem' }}>
                      <div
                        onClick={() => setRememberMe(r => !r)}
                        style={{
                          width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                          border: rememberMe ? '2px solid var(--color-primary, #f43f5e)' : '2px solid rgba(255,255,255,0.15)',
                          background: rememberMe ? 'var(--color-primary, #f43f5e)' : 'rgba(255,255,255,0.04)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          boxShadow: rememberMe ? '0 0 10px rgba(244,63,94,0.3)' : 'none',
                        }}
                      >
                        {rememberMe && <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 900, lineHeight: 1 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>Recordar mi sesión</span>
                    </label>
                  )}

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
                <div className="flex items-center my-5 gap-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">o</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Botón Google */}
                <button 
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Iniciar sesión con Google
                </button>

                <div className="text-center text-sm text-slate-400 mt-6">
                  {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes una cuenta? '}
                  <button
                    onClick={() => { setIsLogin(!isLogin); setError(''); }}
                    className="text-primary font-bold hover:underline underline-offset-2 transition-all"
                  >
                    {isLogin ? 'Regístrate' : 'Inicia Sesión'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
