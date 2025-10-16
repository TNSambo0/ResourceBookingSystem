import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../types/User';
import * as authService from '../../services/authService';
import type { AuthState, JwtPayloadWithRoles } from '../../types/Auth';
import type { ResponseMessage } from '../../types/Response';
import { jwtDecode } from 'jwt-decode';

// === Initial State ===
const initialState: AuthState = {
    user: null,
    token: localStorage.getItem('token'),
    refreshToken: localStorage.getItem('refreshToken'),
    loading: false,
    error: null,
    role: localStorage.getItem('role'),
};

// === Async Thunks ===

// login
export const login = createAsyncThunk(
    'auth/login',
    async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
        try {
            const data = await authService.login(email, password);
            return {
                user: data.userData,
                token: data.token,
                refreshToken: data.refreshToken,
                expires: data.expires,
            };
        } catch (err: any) {
            return rejectWithValue(err?.response?.data?.message || err.message || 'Login failed');
        }
    }
);

// register
export const register = createAsyncThunk(
    'auth/register',
    async (
        { email, password, fullName }: { email: string; password: string; fullName: string },
        { rejectWithValue }
    ) => {
        try {
            await authService.register(email, password, fullName);
            return true;
        } catch (err: any) {
            return rejectWithValue(err?.response?.data?.message || err.message || 'Registration failed');
        }
    }
);

// refreshToken
export const refreshToken = createAsyncThunk(
    'auth/refreshToken',
    async (refreshToken: string, { rejectWithValue }) => {
        try {
            const data = await authService.refreshToken(refreshToken);
            return {
                token: data.token,
                refreshToken: data.refreshToken,
                expires: data.expires,
                user: data.user || null,
            };
        } catch (err: any) {
            return rejectWithValue(err?.response?.data?.message || err.message || 'Token refresh failed');
        }
    }
);

// checkSession
export const checkSession = createAsyncThunk<
    { user: User; token: string; refreshToken: string; expires: string } | null,
    void,
    { rejectValue: string }
>(
    'auth/checkSession',
    async (_, { rejectWithValue, getState }) => {
        const state = (getState() as any).auth as AuthState;
        const rt = state.refreshToken;
        if (!rt) return null;

        try {
            const data = await authService.refreshToken(rt);
            return {
                user: data.user!,
                token: data.token,
                refreshToken: data.refreshToken,
                expires: data.expires,
            };
        } catch {
            return rejectWithValue('Session expired');
        }
    }
);

// forgotPassword
export const forgotPassword = createAsyncThunk<ResponseMessage, string, { rejectValue: string }>(
    'auth/forgot-password',
    async (email, { rejectWithValue }) => {
        try {
            return await authService.forgotPassword(email);
        } catch (error: any) {
            return rejectWithValue(error?.message || 'Failed to send reset link');
        }
    }
);

// resetPassword
export const resetPassword = createAsyncThunk(
    'auth/reset-password',
    async (
        { email, newPassword, token }: { email: string; newPassword: string; token: string },
        { rejectWithValue }
    ) => {
        try {
            const response = await authService.resetPassword(email, newPassword, token);
            return response.message;
        } catch (err: any) {
            return rejectWithValue(err?.response?.data?.message || err.message || 'Password reset failed');
        }
    }
);

// logoutUser
export const logoutUser = createAsyncThunk('auth/logout', async (_, { getState, rejectWithValue }) => {
    try {
        const state = (getState() as any).auth as AuthState;
        const token = state.token;
        const refreshToken = state.refreshToken;

        if (!token || !refreshToken) return rejectWithValue('No active session found');

        return await authService.logout(token, refreshToken);
    } catch (err: any) {
        return rejectWithValue(err?.message || 'Logout failed');
    }
});

// === Helper: Decode roles from JWT ===
export const extractRolesFromToken = (token: string): string[] => {
    try {
        const decoded: JwtPayloadWithRoles = jwtDecode(token);
        const roleClaimKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
        const roles = decoded[roleClaimKey];
        if (!roles) return [];
        return Array.isArray(roles) ? roles : [roles];
    } catch {
        return [];
    }
};

// === Slice ===
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout(state) {
            state.user = null;
            state.token = null;
            state.refreshToken = null;
            state.error = null;
            state.loading = false;
            state.role = null;
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('role');
        },
        setUser(state, action: PayloadAction<User>) {
            state.user = action.payload;
        },
    },
    extraReducers: (builder) => {
        // === LOGIN ===
        builder.addCase(login.pending, (state) => {
            state.user;
            state.loading = true;
            state.error = null;
        });
        builder.addCase(login.fulfilled, (state, action) => {
            state.loading = false;
            const roles = extractRolesFromToken(action.payload.token);

            const user = (action.payload.user ?? {}) as Partial<User>;
            state.user = {
                id: user.id ?? '',
                email: user.email ?? '',
                fullName: user.fullName ?? '',
                roles,
            };

            state.token = action.payload.token;
            state.refreshToken = action.payload.refreshToken;

            localStorage.setItem('token', action.payload.token);
            localStorage.setItem('refreshToken', action.payload.refreshToken);
            localStorage.setItem('role', JSON.stringify(roles));
        });
        builder.addCase(login.rejected, (state, action) => {
            state.user;
            state.loading = false;
            state.error = action.payload as string;
        });

        // === REGISTER ===
        builder.addCase(register.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(register.fulfilled, (state) => {
            state.loading = false;
            state.error = null;
        });
        builder.addCase(register.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // === REFRESH TOKEN ===
        builder.addCase(refreshToken.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(refreshToken.fulfilled, (state, action) => {
            state.loading = false;
            state.token = action.payload.token;
            state.refreshToken = action.payload.refreshToken;

            const roles = extractRolesFromToken(action.payload.token);
            const user = (action.payload.user ?? {}) as Partial<User>;
            state.user = {
                id: user.id ?? '',
                email: user.email ?? '',
                fullName: user.fullName ?? '',
                roles,
            };

            localStorage.setItem('token', action.payload.token);
            localStorage.setItem('refreshToken', action.payload.refreshToken);
            localStorage.setItem('role', JSON.stringify(roles));
        });
        builder.addCase(refreshToken.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
            state.user = null;
            state.token = null;
            state.refreshToken = null;
        });

        // === CHECK SESSION ===
        builder.addCase(checkSession.pending, (state) => {
            state.user;
            state.loading = true;
            state.error = null;
        });
        builder.addCase(checkSession.fulfilled, (state, action) => {
            state.loading = false;
            if (action.payload) {
                const roles = extractRolesFromToken(action.payload.token);
                state.user = {
                    ...action.payload.user,
                    roles,
                };
                state.token = action.payload.token;
                state.refreshToken = action.payload.refreshToken;
                localStorage.setItem('role', JSON.stringify(roles));
            } else {
                state.user = null;
                state.token = null;
                state.refreshToken = null;
            }
        });
        builder.addCase(checkSession.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || 'Session invalid';
            state.user = null;
            state.token = null;
            state.refreshToken = null;
        });

        // === FORGOT PASSWORD ===
        builder.addCase(forgotPassword.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(forgotPassword.fulfilled, (state) => {
            state.loading = false;
        });
        builder.addCase(forgotPassword.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || 'Failed to send reset link';
        });

        // === LOGOUT ===
        builder.addCase(logoutUser.fulfilled, (state) => {
            state.user = null;
            state.token = null;
            state.refreshToken = null;
            state.loading = false;
            state.error = null;
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('role');
        });
    },
});

export const { logout, setUser } = authSlice.actions;
export default authSlice.reducer;
