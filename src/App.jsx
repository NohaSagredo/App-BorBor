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

function AppContent() {
  const location = useLocation();
  const isWide = ['/academia', '/admin', '/insights'].includes(location.pathname);
  
  return (
    <div className="app-root-wrapper" style={{ 
      width: '100%', 
      maxWidth: isWide ? '1200px' : '500px', 
      margin: '0 auto', 
      background: 'transparent', 
      minHeight: '100vh', 
      position: 'relative', 
      overflowX: 'hidden',
      transition: 'max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <GlobalBackground />
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
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
