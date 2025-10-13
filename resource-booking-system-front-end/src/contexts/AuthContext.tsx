import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useRef,
} from 'react';
import type { User } from '../types/User';
import type { AuthContextType } from '../types/Auth';
import * as authService from '../services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
    return ctx;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());
    const [token, setToken] = useState<string | null>(() => authService.getToken());
    const [refreshToken, setRefreshToken] = useState<string | null>(() =>
        localStorage.getItem('rbs_refresh_token')
    );
    const [loading, setLoading] = useState(false);
    const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const storeAuth = useCallback(
        (
            accessToken: string | null,
            newRefreshToken: string | null,
            userData: User | null
        ) => {
            if (accessToken) {
                localStorage.setItem('rbs_token', accessToken);
                setToken(accessToken);
            } else {
                localStorage.removeItem('rbs_token');
                setToken(null);
            }

            if (newRefreshToken) {
                localStorage.setItem('rbs_refresh_token', newRefreshToken);
                setRefreshToken(newRefreshToken);
            } else {
                localStorage.removeItem('rbs_refresh_token');
                setRefreshToken(null);
            }

            if (userData) {
                localStorage.setItem('rbs_user', JSON.stringify(userData));
                setUser(userData);
            } else {
                localStorage.removeItem('rbs_user');
                setUser(null);
            }
        },
        []
    );

    const clearAuth = useCallback(() => {
        localStorage.removeItem('rbs_token');
        localStorage.removeItem('rbs_refresh_token');
        localStorage.removeItem('rbs_user');
        setToken(null);
        setRefreshToken(null);
        setUser(null);
    }, []);

    const scheduleTokenRefresh = useCallback(
        (expiresAtISO: string) => {
            if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
            const expiresAt = new Date(expiresAtISO).getTime();
            const now = Date.now();
            const refreshDelay = Math.max(expiresAt - now - 5 * 60 * 1000, 0);
            refreshTimeoutRef.current = setTimeout(() => {
                refreshAuthToken();
            }, refreshDelay);
        },
        []
    );

    const refreshAuthToken = useCallback(async (): Promise<boolean> => {
        if (!refreshToken) return false;
        try {
            const data = await authService.refreshToken(refreshToken);
            storeAuth(data.token, data.refreshToken, user);
            scheduleTokenRefresh(data.expires);
            return true;
        } catch (err) {
            clearAuth();
            return false;
        }
    }, [refreshToken, scheduleTokenRefresh, storeAuth, user, clearAuth]);

    const login = useCallback(
        async (email: string, password: string) => {
            setLoading(true);
            try {
                const data = await authService.login(email, password);

                storeAuth(data.token, data.refreshToken, data.userData);
                scheduleTokenRefresh(data.expires);
                setLoading(false);
                return { ok: true };
            } catch (err: any) {
                setLoading(false);
                const message =
                    typeof err.response?.data === 'string'
                        ? err.response.data
                        : err.response?.data?.message || err.message;
                return { ok: false, error: message };
            }
        },
        [storeAuth, scheduleTokenRefresh]
    );

    const register = useCallback(
        async (email: string, password: string, fullName: string) => {
            setLoading(true);
            try {
                await authService.register(email, password, fullName);
                setLoading(false);
                return { ok: true };
            } catch (err: any) {
                setLoading(false);
                const message = err?.response?.data?.message || err.message;
                return { ok: false, error: message };
            }
        },
        []
    );

    const forgotPassword = useCallback(
        async (email: string) => {
            setLoading(true);
            try {
                await authService.forgotPassword(email);
                setLoading(false);
                return { ok: true };
            } catch (err: any) {
                setLoading(false);
                const message = err?.response?.data?.message || err.message;
                return { ok: false, error: message };
            }
        },
        []
    );

    const logout = useCallback(async () => {
        if (token && refreshToken) {
            try {
                await authService.logout(token, refreshToken);
            } catch (error) {
                console.error('Logout failed:', error);
            }
        }
        clearAuth();
        if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    }, [token, refreshToken, clearAuth]);

    const fetchWithAuth = useCallback(
        async (url: string, options: RequestInit = {}) => {
            if (!token) {
                throw new Error('No auth token found');
            }
            const headers = {
                ...options.headers,
                Authorization: `Bearer ${token}`,
            };
            const response = await fetch(url, { ...options, headers });
            return response;
        },
        [token]
    );

    useEffect(() => {
        if (refreshToken) {
            refreshAuthToken();
        }
    }, [refreshToken, refreshAuthToken]);

    const value: AuthContextType = {
        user,
        token,
        loading,
        login,
        register,
        forgotPassword,
        logout,
        fetchWithAuth,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
