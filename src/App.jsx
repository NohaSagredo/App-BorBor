import './App.css';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Auth from './pages/Auth';
import MujerHome from './pages/MujerHome';
import HombreHome from './pages/HombreHome';
import KegelsModule from './pages/KegelsModule';
import Profile from './pages/Profile';
import InsightsModule from './pages/InsightsModule';
import AcademyModule from './pages/AcademyModule';
import AdminDashboard from './pages/AdminDashboard';
import { ThemeProvider } from './components/ThemeProvider';
import GlobalBackground from './components/GlobalBackground';
import TopAppBar from './components/TopAppBar';
import BottomNavBar from './components/BottomNavBar';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { LEVELS } from './utils/kegelLevels';

function AppContent() {
  const location = useLocation();
  const isWide = ['/academia', '/admin', '/insights'].includes(location.pathname);
  
  const [userData, setUserData] = useState(null);
  const [partnerData, setPartnerData] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          
          if (data.linkedPartnerId) {
            const partnerRef = doc(db, 'users', data.linkedPartnerId);
            const partnerSnap = await getDoc(partnerRef);
            if (partnerSnap.exists()) {
              setPartnerData(partnerSnap.data());
            } else {
              setPartnerData(null);
            }
          } else {
            setPartnerData(null);
          }
        }
      } else {
        setUserData(null);
        setPartnerData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const hideNavbars = ['/', '/auth', '/admin'].includes(location.pathname);
  const homeRoute = userData?.role === 'Hombre' ? '/hombre' : '/mujer';

  const userXp = userData?.xp || 0;
  const currentLevelObj = [...LEVELS].reverse().find(l => l.xpRequired <= userXp) || LEVELS[0];
  const currentLevel = currentLevelObj.id;
  
  return (
    <div className="app-root-wrapper" style={{ 
      width: '100%', 
      maxWidth: isWide ? '1200px' : '500px', 
      margin: '0 auto', 
      background: 'transparent', 
      minHeight: '100vh', 
      position: 'relative', 
      transition: 'max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      paddingTop: hideNavbars ? '0px' : '80px',
      paddingBottom: hideNavbars ? '0px' : '80px'
    }}>
      <GlobalBackground />
      {!hideNavbars && <TopAppBar avatarUrl={userData?.photoURL} partnerAvatarUrl={partnerData?.photoURL} coins={userData?.kegelCoins || 0} level={currentLevel} homeRoute={homeRoute} />}
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/mujer" element={<MujerHome />} />
        <Route path="/hombre" element={<HombreHome />} />
        <Route path="/kegels" element={<KegelsModule />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/insights" element={<InsightsModule />} />
        <Route path="/academia" element={<AcademyModule />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
      {!hideNavbars && <BottomNavBar homeRoute={homeRoute} />}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
