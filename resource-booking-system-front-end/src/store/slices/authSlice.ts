import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../types/User';
import * as authService from '../../services/authService';
import type { AuthState } from '../../types/Auth'
import type { ResponseMessage } from '../../types/Response';

const initialState: AuthState = {
    user: null,
    token: localStorage.getItem('token'),
    refreshToken: localStorage.getItem('refreshToken'),
    loading: false,
    error: null,
};

// Async thunk for login
export const login = createAsyncThunk(
    'auth/login',
    async (
        { email, password }: { email: string; password: string },
        { rejectWithValue }
    ) => {
        try {
            const data = await authService.login(email, password);

            return {
                user: data.userData,
                token: data.token,
                refreshToken: data.refreshToken,
                expires: data.expires,
            };
        } catch (err: any) {
            return rejectWithValue(
                err?.response?.data?.message || err.message || 'Login failed'
            );
        }
    }
);

// Async thunk for register
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
            return rejectWithValue(
                err?.response?.data?.message || err.message || 'Registration failed'
            );
        }
    }
);

// Async thunk for refresh token
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
            return rejectWithValue(
                err?.response?.data?.message || err.message || 'Token refresh failed'
            );
        }
    }
);

// Async thunk for checking session
export const checkSession = createAsyncThunk<
    { user: User; token: string; refreshToken: string; expires: string } | null,
    void,
    { rejectValue: string }
>(
    'auth/checkSession',
    async (_, { rejectWithValue, getState }) => {
        const state = (getState() as any).auth as AuthState;
        const rt = state.refreshToken;
        if (!rt) {
            return null;
        }

        try {
            const data = await authService.refreshToken(rt);
            return {
                user: data.user!,
                token: data.token,
                refreshToken: data.refreshToken,
                expires: data.expires,
            };
        } catch (err: any) {
            return rejectWithValue('Session expired');
        }
    }
);

// Async thunk for forgotPassword
export const forgotPassword = createAsyncThunk<
    ResponseMessage,
    string,
    { rejectValue: string }
>(
    'auth/forgot-password',
    async (email, { rejectWithValue }) => {
        try {
            const response = await authService.forgotPassword(email);
            return response;
        } catch (error: any) {
            return rejectWithValue(error?.message || 'Failed to send reset link');
        }
    }
);

// Async thunk for logging out a user
export const logoutUser = createAsyncThunk(
    'auth/logout',
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = (getState() as any).auth as AuthState;
            const token = state.token;
            const refreshToken = state.refreshToken;

            if (!token || !refreshToken) {
                return rejectWithValue('No active session found');
            }

            const message = await authService.logout(token, refreshToken);

            return message;
        } catch (err: any) {
            return rejectWithValue(err?.message || 'Logout failed');
        }
    }
);

// Slice
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
        },
        setUser(state, action: PayloadAction<User>) {
            state.user = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(login.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(login.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.refreshToken = action.payload.refreshToken;
            state.error = null;

            localStorage.setItem('token', action.payload.token);
            localStorage.setItem('refreshToken', action.payload.refreshToken);
        });
        builder.addCase(login.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // register
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

        // refreshToken
        builder.addCase(refreshToken.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(refreshToken.fulfilled, (state, action) => {
            state.loading = false;
            state.token = action.payload.token;
            state.refreshToken = action.payload.refreshToken;
            if (action.payload.user) state.user = action.payload.user;
            state.error = null;
        });
        builder.addCase(refreshToken.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
            state.user = null;
            state.token = null;
            state.refreshToken = null;
        });

        //checkSession
        builder.addCase(checkSession.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(checkSession.fulfilled, (state, action) => {
            state.loading = false;
            if (action.payload) {
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.refreshToken = action.payload.refreshToken;
                state.error = null;
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


        // forgotPassword
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

        // 🔹 Logout
        builder.addCase(logoutUser.fulfilled, (state) => {
            state.user = null;
            state.token = null;
            state.refreshToken = null;
            state.loading = false;
            state.error = null;
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('refreshToken');
            sessionStorage.clear();
        });
    },
});

export const { logout, setUser } = authSlice.actions;
export default authSlice.reducer;
