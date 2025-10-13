import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import { login, register, forgotPassword } from '../../store/slices/authSlice';
import { useToast } from '../../contexts/ToastContext';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { getErrorMessage } from '../../utils/errorHelpers';
import LoadingOverlay from '../shared/LoadingOverlay';

type AuthModalProps = {
    show: boolean;
    mode?: 'login' | 'register';
    onClose: () => void;
    onLoginSuccess: () => void;
};

type ViewMode = 'login' | 'register' | 'forgot';

const AuthModal: React.FC<AuthModalProps> = ({ show, mode = 'login', onClose, onLoginSuccess }) => {
    const dispatch = useAppDispatch();
    const { showToast } = useToast();
    const { loading } = useAppSelector((state) => state.auth);

    const [viewMode, setViewMode] = useState<ViewMode>(mode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');

    const [resetSuccess, setResetSuccess] = useState(false);

    useEffect(() => {
        setViewMode(mode);
        resetFields();
    }, [mode]);

    const resetFields = () => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setFullName('');
        setResetSuccess(false);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const resultAction = await dispatch(login({ email, password }));
            if (login.fulfilled.match(resultAction)) {
                showToast('Login successful!', 'success');
                resetFields();
                onLoginSuccess();
            } else {
                const errorMessage = getErrorMessage(resultAction.payload) || 'Invalid email or password';
                showToast(errorMessage, 'danger');
            }
        } catch {
            showToast('An unexpected error occurred.', 'danger');
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'danger');
            return;
        }

        try {
            const resultAction = await dispatch(register({ email, password, fullName }));
            if (register.fulfilled.match(resultAction)) {
                showToast('Registration successful! Please log in.', 'success');
                setViewMode('login');
                resetFields();
            } else {
                const errorMessage = getErrorMessage(resultAction.payload) || 'Registration failed. Please try again.';
                showToast(errorMessage, 'danger');
            }
        } catch {
            showToast('Registration failed. Please try again.', 'danger');
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const resultAction = await dispatch(forgotPassword(email));
            if (forgotPassword.fulfilled.match(resultAction)) {
                setResetSuccess(true);
                showToast('Password reset link sent to your email.', 'success');
            } else {
                showToast(resultAction.payload || 'Failed to send reset link.', 'danger');
            }
        } catch {
            showToast('Failed to send reset link. Please try again.', 'danger');
        }
    };

    if (!show) return null;

    return (
        <>
            <div
                className="modal d-block"
                tabIndex={-1}
                role="dialog"
                style={{ background: 'rgba(0,0,0,0.5)' }}
            >
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content p-3 shadow-sm rounded-4 position-relative auth-modal-content">
                        <div className="modal-header border-0">
                            <h5 className="modal-title fw-bold">
                                {viewMode === 'login'
                                    ? 'Login'
                                    : viewMode === 'register'
                                        ? 'Register'
                                        : 'Reset Password'}
                            </h5>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>

                        <div className={`modal-body ${loading ? 'blurred' : ''}`}>
                            {/* LOGIN FORM */}
                            {viewMode === 'login' && (
                                <form onSubmit={handleLogin}>
                                    <div className="mb-3 input-group">
                                        <span className="input-group-text">
                                            <i className="bi bi-envelope"></i>
                                        </span>
                                        <input
                                            type="email"
                                            className="form-control"
                                            placeholder="Email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="mb-3 input-group">
                                        <span className="input-group-text">
                                            <i className="bi bi-lock"></i>
                                        </span>
                                        <input
                                            type="password"
                                            className="form-control"
                                            placeholder="Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                                        Login
                                    </button>

                                    <div className="text-center mt-3">
                                        <button
                                            type="button"
                                            className="btn btn-link text-decoration-none"
                                            onClick={() => setViewMode('register')}
                                        >
                                            Don’t have an account? Register
                                        </button>
                                        <br />
                                        <button
                                            type="button"
                                            className="btn btn-link text-decoration-none"
                                            onClick={() => setViewMode('forgot')}
                                        >
                                            Forgot password?
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* REGISTER FORM */}
                            {viewMode === 'register' && (
                                <form onSubmit={handleRegister}>
                                    <div className="mb-3 input-group">
                                        <span className="input-group-text">
                                            <i className="bi bi-person"></i>
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Full Name"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3 input-group">
                                        <span className="input-group-text">
                                            <i className="bi bi-envelope"></i>
                                        </span>
                                        <input
                                            type="email"
                                            className="form-control"
                                            placeholder="Email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3 input-group">
                                        <span className="input-group-text">
                                            <i className="bi bi-lock"></i>
                                        </span>
                                        <input
                                            type="password"
                                            className="form-control"
                                            placeholder="Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3 input-group">
                                        <span className="input-group-text">
                                            <i className="bi bi-shield-lock"></i>
                                        </span>
                                        <input
                                            type="password"
                                            className="form-control"
                                            placeholder="Confirm Password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                                        Register
                                    </button>

                                    <div className="text-center mt-3">
                                        <button
                                            type="button"
                                            className="btn btn-link text-decoration-none"
                                            onClick={() => setViewMode('login')}
                                        >
                                            Already have an account? Login
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* FORGOT PASSWORD VIEW */}
                            {viewMode === 'forgot' && (
                                <>
                                    {!resetSuccess ? (
                                        <form onSubmit={handleForgotPassword}>
                                            <div className="mb-3 input-group">
                                                <span className="input-group-text">
                                                    <i className="bi bi-envelope"></i>
                                                </span>
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    placeholder="Enter your registered email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                className="btn btn-primary w-100"
                                                disabled={loading}
                                            >
                                                Send Reset Link
                                            </button>

                                            <div className="text-center mt-3">
                                                <button
                                                    type="button"
                                                    className="btn btn-link text-decoration-none"
                                                    onClick={() => setViewMode('login')}
                                                >
                                                    Back to Login
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="text-center p-3">
                                            <i className="bi bi-check-circle text-success display-4 mb-2"></i>
                                            <h6 className="fw-semibold">Reset link sent!</h6>
                                            <p className="text-muted">
                                                Please check your email for instructions to reset your password.
                                            </p>
                                            <button
                                                type="button"
                                                className="btn btn-primary mt-2"
                                                onClick={() => {
                                                    setResetSuccess(false);
                                                    setViewMode('login');
                                                }}
                                            >
                                                Back to Login
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {loading && (
                            <div className={`global-loading-overlay ${loading ? 'show' : ''}`}>
                                <LoadingOverlay />
                            </div>

                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default AuthModal;
