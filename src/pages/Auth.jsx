import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ArrowLeft, LogIn, UserPlus, Mail, Lock, User, Sparkles } from 'lucide-react';

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

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

  const inputStyle = {
    padding: '0.9rem 1rem 0.9rem 2.8rem',
    borderRadius: '14px',
    border: '1.5px solid var(--glass-border, rgba(255,255,255,0.12))',
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(6px)',
    outline: 'none',
    color: 'var(--color-text-main)',
    fontSize: '0.95rem',
    fontWeight: 500,
    width: '100%',
    boxSizing: 'border-box',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
  };

  const inputFocusGlow = 'focus:border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb, 244, 63, 94), 0.12);';

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>

      <style>{`
        @keyframes authOrb1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,-25px) scale(1.1)} }
        @keyframes authOrb2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-15px,20px) scale(1.15)} }
        @keyframes authStagger1 { from{opacity:0;transform:translateY(25px)} to{opacity:1;transform:translateY(0)} }
        @keyframes authStagger2 { from{opacity:0;transform:translateY(18px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes authShine { 0%{left:-100%} 100%{left:200%} }
        @keyframes authTabSlide { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
        .auth-input-wrap { position: relative; }
        .auth-input-wrap .auth-input-icon {
          position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
          color: var(--color-text-muted); opacity: 0.5; pointer-events: none;
          transition: color 0.3s ease, opacity 0.3s ease;
        }
        .auth-input-wrap:focus-within .auth-input-icon {
          color: var(--color-primary); opacity: 1;
        }
        .auth-input {
          padding: 0.9rem 1rem 0.9rem 2.8rem;
          border-radius: 14px;
          border: 1.5px solid var(--glass-border, rgba(255,255,255,0.12));
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(6px);
          outline: none;
          color: var(--color-text-main);
          font-size: 0.95rem;
          font-weight: 500;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .auth-input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb, 244, 63, 94), 0.12);
        }
        .auth-input::placeholder { color: var(--color-text-muted); opacity: 0.5; }
        .auth-submit-btn {
          position: relative;
          width: 100%;
          padding: 1rem;
          border: none;
          border-radius: 16px;
          background: var(--btn-primary-gradient);
          color: var(--btn-text-color, #fff);
          font-size: 1.05rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          overflow: hidden;
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease, opacity 0.2s;
          box-shadow: 0 8px 28px rgba(var(--color-primary-rgb, 244, 63, 94), 0.3);
        }
        .auth-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 12px 36px rgba(var(--color-primary-rgb, 244, 63, 94), 0.4);
        }
        .auth-submit-btn:active:not(:disabled) { transform: translateY(0) scale(0.98); }
        .auth-submit-btn::after {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: authShine 3s ease-in-out infinite;
        }
        .auth-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .auth-role-btn {
          flex: 1;
          padding: 0.85rem 0.5rem;
          border-radius: 14px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
          border: 2px solid transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .auth-toggle-link {
          background: none;
          border: none;
          color: var(--color-text-highlight);
          font-weight: 700;
          cursor: pointer;
          margin-left: 5px;
          font-size: inherit;
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: opacity 0.2s;
        }
        .auth-toggle-link:hover { opacity: 0.8; }
      `}</style>

      {/* Orbes de fondo */}
      <div style={{ position:'absolute', top:'-8%', right:'-12%', width:250, height:250, borderRadius:'50%', background:'radial-gradient(circle, var(--color-primary), transparent 70%)', opacity:0.1, animation:'authOrb1 14s ease-in-out infinite', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'-5%', left:'-15%', width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle, var(--color-secondary), transparent 70%)', opacity:0.08, animation:'authOrb2 18s ease-in-out infinite', pointerEvents:'none' }} />

      {/* Botón Volver */}
      <button
        onClick={() => navigate(-1)}
        style={{
          position: 'absolute', top: '1.5rem', left: '1.5rem',
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '14px',
          padding: '0.5rem 1rem',
          fontSize: '0.85rem',
          cursor: 'pointer',
          color: 'var(--color-text-muted)',
          display: 'flex', alignItems: 'center', gap: '6px',
          fontWeight: 600,
          transition: 'all 0.2s ease',
          zIndex: 10
        }}
      >
        <ArrowLeft size={15} /> Volver
      </button>

      {/* Header animado */}
      <div style={{
        marginBottom: '2rem', textAlign: 'center', position: 'relative', zIndex: 2,
        animation: mounted ? 'authStagger1 0.7s cubic-bezier(0.16,1,0.3,1) forwards' : 'none',
        opacity: mounted ? 1 : 0
      }}>
        {/* Ícono circular */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(145deg, var(--color-primary), var(--color-secondary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1rem',
          boxShadow: '0 10px 35px rgba(var(--color-primary-rgb, 244, 63, 94), 0.25)',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, background:'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 50%)', borderRadius:'50%', pointerEvents:'none' }} />
          {isLogin
            ? <LogIn size={30} color="#fff" style={{ position:'relative', zIndex:2 }} />
            : <UserPlus size={30} color="#fff" style={{ position:'relative', zIndex:2 }} />
          }
        </div>
        <h1 style={{
          fontSize: '1.8rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px',
          background: 'linear-gradient(135deg, var(--color-text-highlight), var(--color-primary))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
        }}>
          {isLogin ? '¡Hola otra vez!' : 'Comienza tu viaje'}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', marginTop: '0.4rem', fontWeight: 500 }}>
          {isLogin ? 'Nos alegra verte de nuevo.' : 'Crea tu espacio seguro y personal.'}
        </p>
      </div>

      {/* Tarjeta Principal */}
      <div style={{
        width: '100%', maxWidth: '360px', position: 'relative', zIndex: 2,
        animation: mounted ? 'authStagger2 0.7s cubic-bezier(0.16,1,0.3,1) 0.15s both' : 'none'
      }}>
        <div className="glass-panel" style={{
          padding: '2rem 1.8rem',
          background: 'rgba(var(--color-primary-rgb, 244, 63, 94), 0.02)',
          position: 'relative', overflow: 'hidden'
        }}>
          {/* Decoración esquina */}
          <div style={{ position:'absolute', top:0, right:0, width:100, height:100, background:'radial-gradient(circle at top right, rgba(var(--color-primary-rgb, 244, 63, 94), 0.06), transparent 70%)', pointerEvents:'none' }} />

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '12px',
              marginBottom: '1rem', fontSize: '0.82rem', textAlign: 'center', fontWeight: 600,
              backdropFilter: 'blur(4px)'
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {!isLogin && (
              <>
                {/* Selector de Rol */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipo de Perfil</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={() => setRole('mujer')}
                      className="auth-role-btn"
                      style={{
                        background: role === 'mujer' ? 'var(--btn-primary-gradient)' : 'rgba(255,255,255,0.05)',
                        color: role === 'mujer' ? '#fff' : 'var(--color-text-main)',
                        borderColor: role === 'mujer' ? 'transparent' : 'var(--glass-border)',
                        boxShadow: role === 'mujer' ? '0 4px 15px rgba(var(--color-primary-rgb, 244, 63, 94), 0.25)' : 'none',
                        transform: role === 'mujer' ? 'scale(1.03)' : 'scale(1)',
                      }}
                    >🌸 Mujer</button>
                    <button type="button" onClick={() => setRole('hombre')}
                      className="auth-role-btn"
                      style={{
                        background: role === 'hombre' ? 'var(--btn-primary-gradient)' : 'rgba(255,255,255,0.05)',
                        color: role === 'hombre' ? '#fff' : 'var(--color-text-main)',
                        borderColor: role === 'hombre' ? 'transparent' : 'var(--glass-border)',
                        boxShadow: role === 'hombre' ? '0 4px 15px rgba(var(--color-primary-rgb, 244, 63, 94), 0.25)' : 'none',
                        transform: role === 'hombre' ? 'scale(1.03)' : 'scale(1)',
                      }}
                    >💪 Hombre / Pareja</button>
                  </div>
                </div>

                {/* Nombre */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nombre</label>
                  <div className="auth-input-wrap">
                    <User size={16} className="auth-input-icon" />
                    <input type="text" placeholder="Ej. Ana o Carlos" value={name}
                      onChange={(e) => setName(e.target.value)} required={!isLogin}
                      className="auth-input" />
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Correo Electrónico</label>
              <div className="auth-input-wrap">
                <Mail size={16} className="auth-input-icon" />
                <input type="email" placeholder="tu@correo.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} required
                  className="auth-input" />
              </div>
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contraseña</label>
              <div className="auth-input-wrap">
                <Lock size={16} className="auth-input-icon" />
                <input type="password" placeholder="Mínimo 6 caracteres" value={password}
                  onChange={(e) => setPassword(e.target.value)} required
                  className="auth-input" />
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className="auth-submit-btn" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? (
                <span style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ width:18, height:18, border:'2.5px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'welcomeRingRotate 0.8s linear infinite', display:'inline-block' }} />
                  Cargando...
                </span>
              ) : (
                <>
                  {isLogin ? <LogIn size={18} /> : <Sparkles size={18} />}
                  {isLogin ? 'Entrar' : 'Crear Cuenta'}
                </>
              )}
            </button>
          </form>

          {/* Separador */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '1.3rem 0 0.8rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, var(--glass-border), transparent)' }} />
          </div>

          {/* Toggle */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: 0 }}>
              {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes una cuenta?'}
              <button
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="auth-toggle-link"
              >
                {isLogin ? 'Regístrate' : 'Inicia Sesión'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
