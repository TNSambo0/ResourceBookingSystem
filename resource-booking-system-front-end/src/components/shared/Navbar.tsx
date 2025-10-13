import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { User } from '../../types/User';
import { useToast } from '../../contexts/ToastContext';
import { getErrorMessage } from '../../utils/errorHelpers';
import { logoutUser } from '../../store/slices/authSlice';
import { useAppDispatch } from '../../hooks/reduxHooks';

interface NavbarProps {
    user: User | null;
    onLoginClick: (mode: 'login' | 'register') => void;
    onLogoutSuccess: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLoginClick, onLogoutSuccess }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToast();
    const dispatch = useAppDispatch();


    useEffect(() => {
        setMenuOpen(false);
    }, [location]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            const resultAction = await dispatch(logoutUser());

            if (logoutUser.fulfilled.match(resultAction)) {
                const message = getErrorMessage(resultAction.payload) || 'Logout successful!';
                showToast(message, 'success');
                onLogoutSuccess?.();
            } else {
                const errorMessage =
                    getErrorMessage(resultAction.payload) || 'Logout failed. Please try again.';
                showToast(errorMessage, 'danger');
            }
        } catch (error) {
            showToast('An unexpected error occurred during logout.', 'danger');
        }
    };


    return (
        <nav className="navbar navbar-light bg-white border-bottom shadow-sm px-4">
            <div className="container-fluid d-flex justify-content-between align-items-center">
                {/* LEFT — Brand */}
                <Link
                    className="navbar-brand fw-bold text-primary"
                    to="/"
                    onClick={() => setMenuOpen(false)}
                >
                    📅 Internal Resource Booking
                </Link>

                {/* RIGHT — Toggle + Dropdown */}
                <div className="position-relative" ref={dropdownRef}>
                    {/* Toggler */}
                    <button
                        className="navbar-toggler border-0"
                        type="button"
                        aria-expanded={menuOpen}
                        aria-label="Toggle menu"
                        onClick={() => setMenuOpen((prev) => !prev)}
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    {/* Dropdown Menu */}
                    {menuOpen && (
                        <div
                            className="dropdown-menu dropdown-menu-end show p-2 shadow-sm"
                            style={{
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                minWidth: '200px',
                            }}
                        >
                            {/* Links for logged-in users */}
                            {user && (
                                <>
                                    <Link
                                        className="dropdown-item"
                                        to="/resources"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        Resources
                                    </Link>
                                    <Link
                                        className="dropdown-item"
                                        to="/dashboard"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                    <hr className="dropdown-divider" />
                                </>
                            )}

                            {/* Auth options */}
                            {user ? (
                                <>
                                    <span className="dropdown-item-text fw-semibold">
                                        {user.fullName || user.email}
                                    </span>
                                    <button
                                        className="dropdown-item text-danger"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            handleLogout();
                                        }}
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            onLoginClick('login');
                                        }}
                                    >
                                        Log In
                                    </button>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            onLoginClick('register');
                                        }}
                                    >
                                        Register
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
