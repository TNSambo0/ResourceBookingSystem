import React, { type JSX } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppSelector } from '../../hooks/reduxHooks';

interface ProtectedRouteProps {
    children: JSX.Element;
    role?: string;
    handleProtectedNavigation: (path: string) => void; // <-- callback from App
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role, handleProtectedNavigation }) => {
    const { user, token } = useAppSelector((state) => state.auth);
    const location = useLocation();

    // If user not logged in
    if (!token) {
        handleProtectedNavigation(location.pathname); // opens login modal and sets redirect
        return null; // don’t render children yet
    }

    // If user does not have required role
    if (role && !user?.roles?.includes(role)) {
        handleProtectedNavigation('/'); // optional: redirect to home
        return null;
    }

    return children;
};

export default ProtectedRoute;
