import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { logout } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';

const INACTIVITY_TIMEOUT = 2 * 60 * 1000;
const WARNING_DURATION = 10 * 1000;

export function useInactivityLogout(onShowAuthModal: () => void) {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { token } = useAppSelector((state) => state.auth);

    const [showWarning, setShowWarning] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleLogout = () => {
        dispatch(logout());
        showToast('You have been logged out due to inactivity.', 'warning');
        navigate('/');
        onShowAuthModal();
        setShowWarning(false);
    };

    const resetTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setShowWarning(false);
        if (!token) return;

        timerRef.current = setTimeout(() => {
            setShowWarning(true);
            setTimeout(() => handleLogout(), WARNING_DURATION);
        }, INACTIVITY_TIMEOUT - WARNING_DURATION);
    };

    useEffect(() => {
        const events = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'];

        const handleActivity = () => resetTimer();

        events.forEach((e) => window.addEventListener(e, handleActivity));

        resetTimer();

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            events.forEach((e) => window.removeEventListener(e, handleActivity));
        };
    }, [token]);

    return { showWarning, setShowWarning, handleLogout, resetTimer };
}
