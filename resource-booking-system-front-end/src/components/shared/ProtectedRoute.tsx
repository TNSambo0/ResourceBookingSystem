import React, { type JSX } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../hooks/reduxHooks';

interface ProtectedRouteProps {
    children: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { token } = useAppSelector((state) => state.auth);
    const location = useLocation();

    if (!token) {
        return <Navigate to="/" state={{ from: location.pathname }} replace />;
    }

    return children;
};

export default ProtectedRoute;
