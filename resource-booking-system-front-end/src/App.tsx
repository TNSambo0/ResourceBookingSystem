import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import 'react-datepicker/dist/react-datepicker.css';
import { useAppDispatch, useAppSelector } from './hooks/reduxHooks';
import { checkSession, logout, setUser } from './store/slices/authSlice';
import { useToast } from './contexts/ToastContext';
import Navbar from './components/shared/Navbar';
import Footer from './components/shared/Footer';
import LandingPage from './components/home/LandingPage';
import DashboardPage from './components/dashboard/DashboardPage';
import AuthModalPage from './components/auth/AuthModalPage';
import ProtectedRoute from './components/shared/ProtectedRoute';
import { useInactivityLogout } from './hooks/useInactivityLogout';
import SessionTimeoutModal from './components/shared/SessionTimeoutModal';
import ResetPasswordPage from './components/auth/ResetPasswordPage';
import AuditLogsPage from './components/Audit/AuditLogsPage';
import { getRolesFromToken, getUserIdFromToken } from './utils/authHelpers';

function App() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAppSelector((state) => state.auth);
  const { showToast } = useToast();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [redirectAfterLogin, setRedirectAfterLogin] = useState<string | null>(null);

  const { showWarning, setShowWarning, handleLogout, resetTimer } =
    useInactivityLogout(() => setShowAuthModal(true));

  const pagesWithoutLayout = ['/reset-password'];
  const hideLayout = pagesWithoutLayout.some((path) => location.pathname.startsWith(path));

  // --- Handlers ---
  const handleLogoutSuccess = () => {
    setShowAuthModal(false);
    navigate('/', { replace: true });
  }

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

  const handleResetSuccess = () => setShowAuthModal(true);

  const handleProtectedNavigation = (path: string) => {
    if (user && token) {
      // User is logged in, just navigate
      navigate(path, { replace: true });
    } else {
      // User not logged in, open auth modal and save redirect path
      setRedirectAfterLogin(path);
      setAuthMode('login');
      setShowAuthModal(true);
    }
  };


  // --- Token & Session Restoration ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    if (token && refreshToken) {
      const roles = getRolesFromToken(token);
      const id = getUserIdFromToken(token);
      dispatch(setUser({ id, email: '', fullName: '', roles }));
    }
  }, [dispatch]);

  // --- Session check on route change ---
  useEffect(() => {
    const from = (location.state as { from?: string })?.from;
    if (from && !token) {
      setAuthMode('login');
      setShowAuthModal(true);
      setRedirectAfterLogin(from);
      navigate('/', { replace: true, state: {} });
    }

    const hadSession = !!sessionStorage.getItem('token');
    const publicPaths = ['/', '/reset-password', '/admin/audit-logs'];

    dispatch(checkSession()).then((result) => {
      if (checkSession.rejected.match(result)) {
        if (hadSession) {
          showToast('Session expired. Please log in again.', 'danger');
          setAuthMode('login');
          setShowAuthModal(true);
        }
        if (!publicPaths.includes(location.pathname)) {
          navigate('/', { replace: true });
        }
      }
    });
  }, [location.pathname, location.state, dispatch, navigate, showToast, token]);

  useEffect(() => {
    if (user && token) {
      setShowAuthModal(false);
    }
  }, [user, token]);

  return (
    <div className="app-container d-flex flex-column min-vh-100">
      {/* Navbar */}
      {!hideLayout && (
        <Navbar user={user} onLoginClick={() => openLoginModal()} onLogoutSuccess={handleLogoutSuccess} />
      )}

      {/* Main Routes */}
      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<LandingPage onLoginClick={handleProtectedNavigation} />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute handleProtectedNavigation={handleProtectedNavigation}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/audit-logs"
            element={
              //<ProtectedRoute role="Admin" handleProtectedNavigation={handleProtectedNavigation}>
              <AuditLogsPage />
              //</ProtectedRoute>
            }
          />
          <Route path="/reset-password" element={<ResetPasswordPage onResetSuccess={handleResetSuccess} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      {!hideLayout && <Footer />}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModalPage
          show
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Session Timeout Modal */}
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
