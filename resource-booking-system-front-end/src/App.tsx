// App.tsx
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './hooks/reduxHooks';
import { checkSession } from './store/slices/authSlice';
import { useToast } from './contexts/ToastContext';
import Navbar from './components/shared/Navbar';
import Footer from './components/shared/Footer';
import LandingPage from './components/home/LandingPage';
import Dashboard from './components/dashboard/Dashboard';
import AuthModal from './components/auth/AuthModal';
import ProtectedRoute from './components/shared/ProtectedRoute';
import { useInactivityLogout } from './hooks/useInactivityLogout';
import SessionTimeoutModal from './components/shared/SessionTimeoutModal';

function App() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAppSelector((state) => state.auth);
  const { showToast } = useToast();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [redirectAfterLogin, setRedirectAfterLogin] = useState<string | null>(null);

  const {
    showWarning,
    setShowWarning,
    handleLogout,
    resetTimer,
  } = useInactivityLogout(() => setShowAuthModal(true));

  const handleLogoutSuccess = () => {
    setShowAuthModal(false);
  }

  useEffect(() => {
    const from = (location.state as { from?: string })?.from;
    if (from && !token) {
      setAuthMode('login');
      setShowAuthModal(true);
      setRedirectAfterLogin(from);
      navigate('/', { replace: true, state: {} });
    }
  }, [location.state, token, navigate]);

  useEffect(() => {
    const hadSession = !!sessionStorage.getItem('token');

    dispatch(checkSession()).then((result) => {
      if (checkSession.rejected.match(result)) {
        if (hadSession) {
          showToast('Session expired. Please log in again.', 'danger');
          setAuthMode('login');
          setShowAuthModal(true);
        }
        if (location.pathname !== '/') {
          navigate('/', { replace: true });
        }
      }
    });
  }, [dispatch, location.pathname, navigate, showToast]);

  const openLoginModal = (path?: string) => {
    setAuthMode('login');
    setShowAuthModal(true);
    if (path) setRedirectAfterLogin(path);
  };

  const handleLoginSuccess = () => {
    setShowAuthModal(false);
    if (redirectAfterLogin) {
      navigate(redirectAfterLogin, { replace: true });
      setRedirectAfterLogin(null);
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="app-container d-flex flex-column min-vh-100">
      <Navbar user={user} onLoginClick={() => openLoginModal()} onLogoutSuccess={handleLogoutSuccess} />

      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<LandingPage onLoginClick={openLoginModal} />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          show
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Session Timeout Warning */}
      <SessionTimeoutModal
        show={showWarning}
        countdown={10}
        onStayLoggedIn={() => {
          setShowWarning(false);
          resetTimer();
        }}
        onLogout={handleLogout}
      />
    </div>
  );
}

export default App;
