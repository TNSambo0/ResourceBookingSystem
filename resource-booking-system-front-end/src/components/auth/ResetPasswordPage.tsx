import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import { resetPassword } from '../../store/slices/authSlice';
import { useToast } from '../../contexts/ToastContext';
import { getErrorMessage } from '../../utils/errorHelpers';
import LoadingOverlay from '../shared/LoadingOverlay';
import 'bootstrap-icons/font/bootstrap-icons.css';

type ResetPasswordPageProps = {
    onResetSuccess: () => void;
};

const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onResetSuccess }) => {
    const dispatch = useAppDispatch();
    const { showToast } = useToast();
    const { loading } = useAppSelector((state) => state.auth);
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetSuccess, setResetSuccess] = useState(false);

    const email = searchParams.get('email') || '';
    const token = searchParams.get('code') || '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !token) {
            showToast('Invalid password reset link.', 'danger');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match', 'danger');
            return;
        }

        try {
            await dispatch(resetPassword({ email, newPassword, token })).unwrap();
            showToast('Password reset successful! You can now log in.', 'success');
            setResetSuccess(true);

            setTimeout(() => {
                onResetSuccess();
                navigate('/', { replace: true });
            }, 2000);
        } catch (err: any) {
            const errorMessage = getErrorMessage(err) || 'Failed to reset password.';
            showToast(errorMessage, 'danger');
        }
    };

    return (
        <div
            className="modal d-block"
            tabIndex={-1}
            role="dialog"
            style={{
                background: 'rgba(0,0,0,0.5)',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <div className="modal-dialog modal-dialog-centered" role="document">
                <div className="modal-content p-4 shadow-sm rounded-4 position-relative auth-modal-content">
                    <div className="modal-header border-0 pb-2">
                        <h5 className="modal-title fw-bold">Reset Password</h5>
                    </div>

                    <div className="modal-body">
                        {resetSuccess ? (
                            <div className="text-center p-3">
                                <i className="bi bi-check-circle text-success display-4 mb-2"></i>
                                <h6 className="fw-semibold">Password reset successful!</h6>
                                <p className="text-muted">Redirecting you to login...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3 input-group">
                                    <span className="input-group-text">
                                        <i className="bi bi-lock"></i>
                                    </span>
                                    <input
                                        type="password"
                                        className="form-control"
                                        placeholder="New Password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
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

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100"
                                    disabled={loading}
                                >
                                    Reset Password
                                </button>
                            </form>
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
    );
};

export default ResetPasswordPage;
