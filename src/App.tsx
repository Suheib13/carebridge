import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import BottomNav from './components/BottomNav';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import AiCheck from './pages/AiCheck';
import HospitalFinder from './pages/HospitalFinder';
import Medications from './pages/Medications';
import EmergencyProfile from './pages/EmergencyProfile';
import ResetPassword from './pages/ResetPassword';

const APP_ROUTES = ['/dashboard', '/ai-check', '/hospital-finder', '/medications'];

function AppContent() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const showBottomNav = !!user && APP_ROUTES.includes(pathname);

  return (
    <div className="min-h-screen text-white font-sans selection:bg-white/30 selection:text-white relative">
      {/* Global Background */}
      <div className="fixed inset-0 z-[-1]">
        <img
          src="https://i.postimg.cc/V6HPxSHg/Chat-GPT-Image-Mar-4-2026-09-56-35-PM.png"
          alt="Background"
          className="w-full h-full object-cover opacity-50"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-[#050505]/60" />
      </div>

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/ai-check"
          element={
            <ProtectedRoute>
              <AiCheck />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/hospital-finder" element={<HospitalFinder />} />
        <Route path="/emergency/:id" element={<EmergencyProfile />} />
        <Route
          path="/medications"
          element={
            <ProtectedRoute>
              <Medications />
            </ProtectedRoute>
          }
        />
      </Routes>

      {showBottomNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  useEffect(() => {
    const isLight = localStorage.getItem('theme') === 'light';
    if (isLight) {
      document.documentElement.classList.add('light');
    }
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
