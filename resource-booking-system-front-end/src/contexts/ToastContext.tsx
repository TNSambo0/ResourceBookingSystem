import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ToastType, ToastItem } from '../types/Toast'


type ToastContextType = {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within a ToastProvider');
    return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const showToast = useCallback((message: string, type: ToastType = 'info', duration = 9000) => {
        const id = crypto.randomUUID();
        setToasts((prev) => [...prev, { id, message, type, duration }]);
        setTimeout(() => removeToast(id), duration);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast container */}
            <div
                className="position-fixed top-0 end-0 p-3 d-flex flex-column gap-2"
                style={{ zIndex: 2000 }}
            >
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`toast align-items-center text-white bg-${toast.type} border-0 show`}
                        style={{
                            opacity: 1,
                            minWidth: '250px',
                            boxShadow: '0 0.5rem 1rem rgba(0,0,0,0.2)',
                            borderRadius: '0.5rem',
                            animation: 'slideDown 0.4s ease',
                        }}
                    >
                        <div className="toast-body d-flex justify-content-between align-items-center">
                            <span>{toast.message}</span>
                            <button
                                type="button"
                                className="btn-close btn-close-white ms-2"
                                aria-label="Close"
                                onClick={() => removeToast(toast.id)}
                            ></button>
                        </div>
                    </div>
                ))}
            </div>

            <style>
                {`
                    @keyframes slideDown {
                        from { transform: translateY(-20px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                    `}
            </style>
        </ToastContext.Provider>

    );
};
