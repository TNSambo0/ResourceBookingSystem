import React, { createContext, useContext, useState, type ReactNode, useCallback } from 'react';
import type { ToastType, ToastMessage } from '../../types/Toast'

type ToastContextType = {
    showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div
                aria-live="polite"
                aria-atomic="true"
                className="toast-container position-fixed top-0 end-0 p-3"
                style={{ zIndex: 1050 }}
            >
                {toasts.map(({ id, message, type }) => (
                    <div
                        key={id}
                        className={`toast align-items-center text-bg-${type} border-0 show mb-2`}
                        role="alert"
                        aria-live="assertive"
                        aria-atomic="true"
                    >
                        <div className="d-flex">
                            <div className="toast-body">{message}</div>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
