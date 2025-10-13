import type { User } from './User';

export type AuthResponse = {
    token: string;
    expires: string;
    refreshToken: string;
};

export interface AuthState {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    loading: boolean;
    error: string | null;
}

export interface LoginResponse {
    token: string;
    expires: string;
    refreshToken: string;
    userData: User
}

export interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
    register: (email: string, password: string, fullName: string) => Promise<{ ok: boolean; error?: string }>;
    forgotPassword: (email: string) => Promise<{ ok: boolean; error?: string }>;
    logout: () => Promise<void>;
    fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}

export interface RegisterResponse {
    success: boolean;
    message: string;
    user?: User;
}

export interface RefreshTokenResponse {
    token: string;
    refreshToken: string;
    expires: string;
    user?: User;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ForgotPasswordResponse {
    success: boolean;
    message: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}

export interface ResetPasswordResponse {
    success: boolean;
    message: string;
}
