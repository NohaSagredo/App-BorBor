import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../firebase';
import { doc, getDoc, updateDoc, collection, getDocs, query, where, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged, signOut, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../components/ThemeProvider';
import GlobalLoader from '../components/GlobalLoader';
import { ArrowLeft, Camera, Save, Palette, Link2, FileUp, LogOut, Shield, Settings } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const { themeId, setTheme, themes, animMode, setAnimMode } = useTheme();
  const [userData, setUserData] = useState(null);
  const [partnerData, setPartnerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [showRoleAuth, setShowRoleAuth] = useState(false);
  const [roleChangePassword, setRoleChangePassword] = useState('');
  const [pendingNewRole, setPendingNewRole] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/auth');
        return;
      }
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setNewName(data.name || '');

          if (data.linkedPartnerId) {
            const partnerSnap = await getDoc(doc(db, 'users', data.linkedPartnerId));
            if (partnerSnap.exists()) {
               setPartnerData(partnerSnap.data());
            } else {
               await updateDoc(docRef, { linkedPartnerId: '' });
               setUserData({ ...data, linkedPartnerId: '' });
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleUpdateName = async () => {
    if (!newName.trim() || !auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { name: newName });
      setUserData(prev => ({ ...prev, name: newName }));
      alert('Nombre actualizado correctamente. âœ…');
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangeRole = (e) => {
    const newRole = e.target.value;
    if (!auth.currentUser || newRole === userData.role) return;
    if (userData.roleChanged) {
       alert("Solo se permite realizar un cambio de perfil por cuenta.");
       return;
    }
    setPendingNewRole(newRole);
    setShowRoleAuth(true); // Mostrar popup inline
  };

  const handleConfirmRoleChange = async () => {
    if (!auth.currentUser || !roleChangePassword) return;
    
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, roleChangePassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Credenciales correctas, proceder con el cambio
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { 
        role: pendingNewRole, 
        roleChanged: true 
      });
      
      setUserData(prev => ({ ...prev, role: pendingNewRole, roleChanged: true }));
      setShowRoleAuth(false);
      setRoleChangePassword('');
      alert('Â¡Tipo de perfil cambiado exitosamente!');
      navigate(pendingNewRole === 'mujer' ? '/mujer' : '/hombre');
      
    } catch (err) {
      console.error(err);
      alert('ContraseÃ±a incorrecta o hubo un error de verificaciÃ³n.');
    }
  };

  const handleUploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file || !auth.currentUser) return;
    
    setUploadLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 150;
          canvas.width = MAX_SIZE;
          canvas.height = MAX_SIZE;
          const ctx = canvas.getContext('2d');
          
          const size = Math.min(img.width, img.height);
          const x = (img.width - size) / 2;
          const y = (img.height - size) / 2;
          
          ctx.drawImage(img, x, y, size, size, 0, 0, MAX_SIZE, MAX_SIZE);
          
          const photoURL = canvas.toDataURL('image/jpeg', 0.8);
          
          try {
            const newPhotoEntry = { url: photoURL, timestamp: new Date().toISOString() };
            await updateDoc(doc(db, 'users', auth.currentUser.uid), { 
              photoURL,
              photoHistory: arrayUnion(newPhotoEntry)
            });
            setUserData(prev => ({ 
              ...prev, 
              photoURL,
              photoHistory: [...(prev.photoHistory || []), newPhotoEntry]
            }));
            alert('Foto de perfil actualizada exitosamente. âœ¨');
          } catch (err) {
            console.error(err);
            alert('Error al guardar la foto.');
          } finally {
            setUploadLoading(false);
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert('Error procesando tu foto. IntÃ©ntalo mÃ¡s tarde.');
      setUploadLoading(false);
    }
  };

  const handleLinkPartner = async (e) => {
    e.preventDefault();
    setLinkError(''); setLinkSuccess('');
    if (linkInput.length !== 6) { setLinkError('El cÃ³digo debe tener 6 caracteres.'); return; }

    try {
      const q = query(collection(db, 'users'), where('linkCode', '==', linkInput.toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) { setLinkError('No se encontrÃ³ cuenta con ese cÃ³digo.'); return; }

      const partnerDoc = querySnapshot.docs[0];
      const partnerObj = partnerDoc.data();
      const user = auth.currentUser;
      
      await updateDoc(doc(db, 'users', user.uid), {
        linkedPartnerId: partnerObj.uid,
        linkedPartners: arrayUnion({ uid: partnerObj.uid, name: partnerObj.name })
      });

      await updateDoc(doc(db, 'users', partnerObj.uid), {
        linkedPartnerId: user.uid
      });

      setLinkSuccess(`Â¡VinculaciÃ³n exitosa con ${partnerObj.name}!`);
      setUserData(prev => ({ ...prev, linkedPartnerId: partnerObj.uid }));
      setPartnerData(partnerObj);
      setLinkInput('');

    } catch (err) {
      console.error(err);
      setLinkError('Error al intentar vincular.');
    }
  };

  const handleUnlink = async () => {
    if (!window.confirm("Â¿Seguro que deseas desvincular a tu pareja actual?")) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { linkedPartnerId: '' });
      if (partnerData?.uid) {
         try { await updateDoc(doc(db, 'users', partnerData.uid), { linkedPartnerId: '' }); } catch(e) {}
      }
      setPartnerData(null);
      setUserData(prev => ({ ...prev, linkedPartnerId: '' }));
      alert("DesvinculaciÃ³n exitosa.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportClover = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!window.confirm("Â¿Importar historial de ciclos?")) {
       event.target.value = null;
       return;
    }

    setImportStatus('â³ Leyendo archivo...');
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        let data;
        
        try {
           data = JSON.parse(text);
        } catch (normalParseError) {
           const cleanBase64 = text.replace(/~./g, '');
           const decodedText = atob(cleanBase64);
           data = JSON.parse(decodedText);
        }
        
        let logsToUpload = {};

        if (data.cycle_items && Array.isArray(data.cycle_items)) {
           data.cycle_items.forEach(item => {
               if (item.date && item.type === 'bleeding') {
                   const dateString = Array.isArray(item.date) ? item.date.join('-') : item.date;
                   logsToUpload[dateString] = { bleedingIntensity: item.intensity || 1, details: 'Importado de Clover' };
               }
           });
        }
        
        if (Object.keys(logsToUpload).length > 0) {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            const userSnap = await getDoc(userRef);
            let currentLogs = userSnap.data()?.dailyLogs || {};
            await updateDoc(userRef, { dailyLogs: { ...currentLogs, ...logsToUpload } });
            setImportStatus(`âœ… ImportaciÃ³n completada: ${Object.keys(logsToUpload).length} dÃ­as agregados.`);
        } else {
            setImportStatus('â„¹ï¸ No se encontraron registros de sangrado compatibles.');
        }
      } catch (err) {
        console.error(err);
        setImportStatus('âŒ Error al procesar el archivo. Formato invÃ¡lido.');
      }
      event.target.value = null;
    };
    reader.readAsText(file);
  };

  if (loading) return <GlobalLoader />;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '500px', margin: '0 auto', minHeight: '100vh', paddingBottom: '90px', position: 'relative', overflow: 'hidden' }}>

      <style>{`
        @keyframes profOrb1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,-18px) scale(1.08)} }
        @keyframes profOrb2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-15px,12px) scale(1.1)} }
        @keyframes profStagger { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes profShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes profAvatarFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes profSpin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        .prof-section-card {
          border-radius: 22px;
          padding: 1.5rem;
          background: rgba(var(--color-primary-rgb, 244, 63, 94), 0.02);
          backdrop-filter: blur(12px);
          border: 1px solid var(--glass-border, rgba(255,255,255,0.1));
          box-shadow: 0 6px 24px rgba(0,0,0,0.06);
          margin-bottom: 1rem;
          position: relative;
          overflow: hidden;
        }
        .prof-section-header {
          display: flex; align-items: center; gap: 10px;
          margin: 0 0 1rem 0;
          font-size: 1.05rem; font-weight: 800;
          color: var(--color-text-highlight);
        }
        .prof-section-icon {
          width: 36px; height: 36px; border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .prof-input {
          width: 100%; padding: 0.85rem 1rem; border-radius: 14px;
          border: 1.5px solid var(--glass-border, rgba(255,255,255,0.12));
          background: rgba(255,255,255,0.06); backdrop-filter: blur(6px);
          outline: none; color: var(--color-text-main);
          font-size: 0.95rem; font-weight: 600; box-sizing: border-box;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .prof-input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb, 244, 63, 94), 0.1);
        }
        .prof-btn-primary {
          padding: 0.85rem 1.5rem; border: none; border-radius: 14px;
          background: var(--btn-primary-gradient); color: var(--btn-text-color, #fff);
          font-weight: 700; font-size: 0.9rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          transition: transform 0.2s ease, box-shadow 0.3s ease;
          box-shadow: 0 6px 20px rgba(var(--color-primary-rgb, 244, 63, 94), 0.2);
        }
        .prof-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(var(--color-primary-rgb, 244, 63, 94), 0.3); }
        .prof-theme-btn {
          width: 44px; height: 44px; border-radius: 50%; cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); position: relative;
        }
        .prof-theme-btn:hover { transform: scale(1.15); }
        .prof-anim-btn {
          flex: 1; padding: 0.75rem 0.5rem; border-radius: 14px;
          font-weight: 700; font-size: 0.8rem; cursor: pointer;
          transition: all 0.25s ease; text-align: center;
        }
      `}</style>

      {/* Orbes */}
      <div style={{ position:'absolute', top:'-5%', right:'-10%', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, var(--color-primary), transparent 70%)', opacity:0.08, animation:'profOrb1 14s ease-in-out infinite', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'15%', left:'-12%', width:220, height:220, borderRadius:'50%', background:'radial-gradient(circle, var(--color-secondary), transparent 70%)', opacity:0.06, animation:'profOrb2 18s ease-in-out infinite', pointerEvents:'none' }} />

      {/* BotÃ³n Volver */}
      <button onClick={() => navigate(-1)} style={{
        background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px',
        padding: '0.5rem 1rem', fontSize: '0.85rem', cursor: 'pointer',
        marginBottom: '1.2rem', color: 'var(--color-text-muted)',
        display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600,
        transition: 'all 0.2s ease'
      }}>
        <ArrowLeft size={15} /> Volver
      </button>

      {/* â•â•â• HERO HEADER â•â•â• */}
      <div style={{
        borderRadius: '26px', padding: '2rem 1.5rem',
        marginBottom: '1.5rem', textAlign: 'center',
        background: 'linear-gradient(145deg, var(--color-primary), var(--color-secondary))',
        boxShadow: '0 14px 40px rgba(0,0,0,0.15)',
        position: 'relative', overflow: 'hidden',
        animation: 'profStagger 0.7s cubic-bezier(0.16,1,0.3,1) forwards'
      }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, background:'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%, rgba(255,255,255,0.06) 100%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:12, right:25, width:45, height:45, borderRadius:'50%', background:'rgba(255,255,255,0.18)', animation:'profOrb1 5s ease-in-out infinite', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:15, left:15, width:25, height:25, borderRadius:'50%', background:'rgba(255,255,255,0.12)', animation:'profOrb2 7s ease-in-out infinite', pointerEvents:'none' }} />

        {/* Avatar */}
        <label style={{ display: 'inline-block', position: 'relative', cursor: 'pointer', marginBottom: '1rem', animation: 'profAvatarFloat 4s ease-in-out infinite' }}>
          <div style={{
            width: 90, height: 90, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.8rem', overflow: 'hidden',
            border: '3px solid rgba(255,255,255,0.35)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            position: 'relative', zIndex: 2
          }}>
            {uploadLoading ? (
              <span style={{ width:24, height:24, border:'3px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'profSpin 0.8s linear infinite', display:'inline-block' }} />
            ) : userData?.photoURL ? (
              <img src={userData.photoURL} alt="Perfil" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            ) : (
              userData?.role === 'mujer' ? 'ðŸŒ¸' : 'ðŸ‘¨'
            )}
          </div>
          <div style={{
            position: 'absolute', bottom: 2, right: -2,
            background: '#fff', borderRadius: '50%',
            width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 3
          }}>
            <Camera size={14} color="var(--color-primary)" />
          </div>
          <input type="file" accept="image/*" onChange={handleUploadAvatar} style={{ display: 'none' }} disabled={uploadLoading} />
        </label>

        <h1 style={{ color: '#fff', fontSize: '1.6rem', margin: '0 0 0.2rem', fontWeight: 800, letterSpacing: '-0.3px', position: 'relative', zIndex: 2 }}>
          {userData?.name || 'Tu Perfil'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', margin: 0, fontWeight: 500, position: 'relative', zIndex: 2 }}>
          {userData?.email}
        </p>

        {/* Mini stats */}
        <div style={{
          margin: '1rem 0 0', height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          backgroundSize: '200% 100%', animation: 'profShimmer 3s linear infinite'
        }} />
        <div style={{ display: 'flex', gap: '8px', marginTop: '0.8rem', position: 'relative', zIndex: 2 }}>
          <div style={{ flex:1, background:'rgba(255,255,255,0.12)', backdropFilter:'blur(6px)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'14px', padding:'0.5rem 0.3rem', display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
            <span style={{ fontSize:'0.95rem' }}>{userData?.role === 'mujer' ? 'ðŸŒ¸' : 'ðŸ’ª'}</span>
            <span style={{ color:'#fff', fontSize:'0.75rem', fontWeight:700 }}>{userData?.role === 'mujer' ? 'Mujer' : 'Hombre'}</span>
          </div>
          <div style={{ flex:1, background:'rgba(255,255,255,0.12)', backdropFilter:'blur(6px)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'14px', padding:'0.5rem 0.3rem', display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
            <span style={{ fontSize:'0.95rem' }}>{userData?.linkedPartnerId ? 'ðŸ’•' : 'ðŸ”—'}</span>
            <span style={{ color:'#fff', fontSize:'0.75rem', fontWeight:700 }}>{userData?.linkedPartnerId ? 'Vinculado' : 'Sin pareja'}</span>
          </div>
          <div style={{ flex:1, background:'rgba(255,255,255,0.12)', backdropFilter:'blur(6px)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'14px', padding:'0.5rem 0.3rem', display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
            <span style={{ fontSize:'0.95rem' }}>ðŸ’°</span>
            <span style={{ color:'#fff', fontSize:'0.75rem', fontWeight:700 }}>{userData?.kegelCoins || 0}</span>
          </div>
        </div>
      </div>

      {/* â•â•â• Admin Access â•â•â• */}
      {(userData?.role === 'admin' || auth.currentUser?.uid === 'O4uALBlfRGZgqmxxGoEOKicgd0F2') && (
        <div className="prof-section-card" style={{
          border: '1.5px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.04)',
          animation: 'profStagger 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s both'
        }}>
          <div className="prof-section-header" style={{ color: '#f59e0b' }}>
            <div className="prof-section-icon" style={{ background: 'rgba(251,191,36,0.12)' }}>
              <Shield size={18} color="#f59e0b" />
            </div>
            Acceso Administrativo
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '1rem', marginTop: 0 }}>GestiÃ³n de plataforma, usuarios y mÃ©tricas.</p>
          <button onClick={() => navigate('/admin')} style={{
            width: '100%', padding: '0.9rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#fff', border: 'none', borderRadius: '14px', cursor: 'pointer',
            fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: '0 6px 20px rgba(251,191,36,0.25)', transition: 'transform 0.2s ease'
          }}>
            <Settings size={17} /> Entrar al Dashboard
          </button>
        </div>
      )}

      {/* â•â•â• Separador â•â•â• */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '0.5rem 0 1rem' }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, var(--color-primary), transparent)' }} />
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>ConfiguraciÃ³n</span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(270deg, var(--color-primary), transparent)' }} />
      </div>

      {/* â•â•â• Nombre y Rol â•â•â• */}
      <div className="prof-section-card" style={{ animation: 'profStagger 0.6s cubic-bezier(0.16,1,0.3,1) 0.15s both' }}>
        <div className="prof-section-header">
          <div className="prof-section-icon" style={{ background: 'rgba(var(--color-primary-rgb, 244, 63, 94), 0.1)' }}>
            <Save size={18} color="var(--color-primary)" />
          </div>
          Datos Personales
        </div>

        <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.4rem' }}>Nombre visible</label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.2rem' }}>
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="prof-input" style={{ flex: 1 }} />
          <button onClick={handleUpdateName} className="prof-btn-primary">
            <Save size={15} /> Guardar
          </button>
        </div>

        <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.4rem' }}>Tipo de perfil</label>
        <select
          value={userData?.role || 'mujer'}
          onChange={handleChangeRole}
          disabled={userData?.roleChanged}
          className="prof-input"
          style={{ appearance: 'none', opacity: userData?.roleChanged ? 0.5 : 1 }}
        >
          <option value="mujer">ðŸŒ¸ Mujer</option>
          <option value="hombre">ðŸ’ª Hombre / Pareja</option>
        </select>
        {userData?.roleChanged && (
          <span style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '0.4rem', display: 'block' }}>âš ï¸ Cambio de rol ya utilizado.</span>
        )}
      </div>

      {/* â•â•â• Apariencia â•â•â• */}
      <div className="prof-section-card" style={{ animation: 'profStagger 0.6s cubic-bezier(0.16,1,0.3,1) 0.25s both' }}>
        <div className="prof-section-header">
          <div className="prof-section-icon" style={{ background: 'rgba(139,92,246,0.1)' }}>
            <Palette size={18} color="#8b5cf6" />
          </div>
          Apariencia
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: '0 0 1rem' }}>Selecciona la paleta visual de tu plataforma:</p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
          {Object.entries(themes).map(([id, themeData]) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              className="prof-theme-btn"
              style={{
                background: `linear-gradient(135deg, ${themeData.vars['--color-primary']}, ${themeData.vars['--color-secondary']})`,
                border: themeId === id ? '3px solid white' : '2px solid transparent',
                boxShadow: themeId === id ? '0 0 0 3px var(--color-primary), 0 4px 15px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.08)',
              }}
              title={themeData.name}
            />
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '0.8rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
          Tema actual: <strong style={{ color: 'var(--color-text-main)' }}>{themes[themeId]?.name}</strong> {themes[themeId]?.icon}
        </div>

        {/* Divider interno */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, var(--glass-border), transparent)', margin: '1.2rem 0' }} />

        <h4 style={{ color: 'var(--color-text-main)', margin: '0 0 0.8rem', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>âœ¨ Fondo Animado</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { key: 'none', label: 'Apagado' },
            { key: 'aura', label: 'Aura' },
            { key: 'particles', label: 'LuciÃ©rnagas' }
          ].map(opt => (
            <button key={opt.key} onClick={() => setAnimMode(opt.key)} className="prof-anim-btn"
              style={{
                background: animMode === opt.key ? 'var(--btn-primary-gradient)' : 'rgba(255,255,255,0.05)',
                color: animMode === opt.key ? '#fff' : 'var(--color-text-main)',
                border: animMode === opt.key ? 'none' : '1.5px solid var(--glass-border)',
                boxShadow: animMode === opt.key ? '0 4px 12px rgba(var(--color-primary-rgb, 244, 63, 94), 0.2)' : 'none',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* â•â•â• Importar Datos â•â•â• */}
      {userData?.role === 'mujer' && (
        <div className="prof-section-card" style={{ animation: 'profStagger 0.6s cubic-bezier(0.16,1,0.3,1) 0.35s both' }}>
          <div className="prof-section-header">
            <div className="prof-section-icon" style={{ background: 'rgba(16,185,129,0.1)' }}>
              <FileUp size={18} color="#10b981" />
            </div>
            Importar Datos ClÃ­nicos
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: '0 0 1rem' }}>Sube tu archivo de respaldo de rastreadores externos (ej. Clover) para integrar tu historial menstrual.</p>
          <label style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '0.9rem', background: 'rgba(16,185,129,0.06)',
            border: '1.5px dashed rgba(16,185,129,0.4)', borderRadius: '14px',
            color: '#10b981', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
            transition: 'all 0.2s ease'
          }}>
            <FileUp size={16} /> Subir Archivo .json / .csv
            <input type="file" accept=".json,.csv" onChange={handleImportClover} style={{ display: 'none' }} />
          </label>
          {importStatus && <p style={{ fontSize: '0.82rem', color: 'var(--color-text-highlight)', marginTop: '0.8rem', textAlign: 'center', fontWeight: 600 }}>{importStatus}</p>}
        </div>
      )}

      {/* â•â•â• VÃ­nculo de Pareja â•â•â• */}
      <div className="prof-section-card" style={{ animation: 'profStagger 0.6s cubic-bezier(0.16,1,0.3,1) 0.4s both' }}>
        <div className="prof-section-header">
          <div className="prof-section-icon" style={{ background: 'rgba(236,72,153,0.1)' }}>
            <Link2 size={18} color="#ec4899" />
          </div>
          VÃ­nculo de Pareja
        </div>

        {userData?.linkedPartnerId && (
          <div style={{ marginBottom: '1.2rem', paddingBottom: '1.2rem', borderBottom: '1px solid var(--glass-border)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '0.9rem', borderRadius: '14px',
              background: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.12)',
              marginBottom: '0.8rem'
            }}>
              <span style={{ fontSize: '1.3rem' }}>ðŸ’•</span>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block' }}>Vinculad@ con</span>
                <strong style={{ color: 'var(--color-text-main)', fontSize: '0.95rem' }}>{partnerData?.name || 'Cargando...'}</strong>
              </div>
            </div>
            <button onClick={handleUnlink} style={{
              width: '100%', padding: '0.8rem', background: 'transparent',
              color: '#ef4444', border: '1.5px solid rgba(239,68,68,0.3)',
              borderRadius: '14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
              transition: 'all 0.2s ease'
            }}>
              Desvincular
            </button>
          </div>
        )}

        <div>
          {userData?.role === 'mujer' ? (
            <>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '0.8rem', marginTop: 0, fontWeight: 600 }}>
                {userData?.linkedPartnerId ? 'Vincular nueva cuenta' : 'Comparte tu cÃ³digo con tu pareja:'}
              </p>
              <div style={{
                padding: '1rem', borderRadius: '16px', textAlign: 'center',
                background: 'rgba(var(--color-primary-rgb,244,63,94),0.05)',
                border: '1.5px dashed rgba(var(--color-primary-rgb,244,63,94),0.25)'
              }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Tu cÃ³digo de acceso</span>
                <strong style={{ fontSize: '1.8rem', letterSpacing: '6px', color: 'var(--color-text-main)', fontFamily: 'monospace' }}>{userData?.linkCode || '------'}</strong>
              </div>
            </>
          ) : (
            <form onSubmit={handleLinkPartner}>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '0.8rem', marginTop: 0, fontWeight: 600 }}>
                {userData?.linkedPartnerId ? 'Vincular otra cuenta' : 'Ingresa el cÃ³digo de 6 caracteres:'}
              </p>
              <input
                type="text" maxLength={6} value={linkInput}
                onChange={e => setLinkInput(e.target.value.toUpperCase())}
                placeholder="EJ: XB72PA"
                className="prof-input"
                style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem', marginBottom: '0.8rem', textTransform: 'uppercase' }}
              />
              {linkError && <p style={{ color: '#ef4444', fontSize: '0.82rem', margin: '0 0 0.5rem', fontWeight: 600 }}>âš ï¸ {linkError}</p>}
              {linkSuccess && <p style={{ color: '#10b981', fontSize: '0.82rem', margin: '0 0 0.5rem', fontWeight: 600 }}>âœ… {linkSuccess}</p>}
              <button type="submit" className="prof-btn-primary" style={{ width: '100%' }}>
                <Link2 size={16} /> Vincular ahora
              </button>
            </form>
          )}
        </div>
      </div>

      {/* â•â•â• Cerrar SesiÃ³n â•â•â• */}
      <button onClick={() => signOut(auth)} style={{
        width: '100%', padding: '1rem', background: 'rgba(239,68,68,0.06)',
        color: '#ef4444', border: '1.5px solid rgba(239,68,68,0.2)',
        borderRadius: '16px', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        transition: 'all 0.2s ease',
        animation: 'profStagger 0.6s cubic-bezier(0.16,1,0.3,1) 0.5s both'
      }}>
        <LogOut size={17} /> Cerrar SesiÃ³n Segura
      </button>

      {/* â•â•â• Role Change Auth Modal â•â•â• */}
      {showRoleAuth && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backdropFilter: 'blur(8px)' }}>
          <div style={{
            background: 'var(--color-surface)', width: '100%', maxWidth: '380px',
            padding: '2rem', borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center',
            border: '1px solid var(--glass-border)',
            animation: 'profStagger 0.4s cubic-bezier(0.16,1,0.3,1) forwards'
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', margin: '0 auto 1rem',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(var(--color-primary-rgb, 244, 63, 94), 0.25)'
            }}>
              <Shield size={26} color="#fff" />
            </div>
            <h2 style={{ color: 'var(--color-text-highlight)', margin: '0 0 0.5rem', fontSize: '1.2rem', fontWeight: 800 }}>VerificaciÃ³n de Seguridad</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.2rem', lineHeight: 1.5 }}>
              Cambio a <strong>{pendingNewRole === 'mujer' ? 'Mujer' : 'Hombre / Pareja'}</strong>.
              <br/><span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.8rem' }}>Â¡Este cambio es definitivo y solo se permite una vez!</span>
            </p>
            <input
              type="password" placeholder="Ingresa tu contraseÃ±a actual"
              value={roleChangePassword} onChange={e => setRoleChangePassword(e.target.value)}
              className="prof-input" style={{ marginBottom: '1.2rem' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleConfirmRoleChange} className="prof-btn-primary" style={{ flex: 1 }}>Confirmar</button>
              <button onClick={() => { setShowRoleAuth(false); setRoleChangePassword(''); }} style={{
                flex: 1, padding: '0.85rem', background: 'rgba(255,255,255,0.08)',
                color: 'var(--color-text-main)', border: '1.5px solid var(--glass-border)',
                borderRadius: '14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem'
              }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
