import type { ResponseMessage } from '../types/Response';
import type { LoginResponse, RefreshTokenResponse } from '../types/Auth';
import type { RegisterResponse } from '../types/Auth';

export function getToken(): string | null {
    return localStorage.getItem('rbs_token');
}

export function getCurrentUser() {
    const userJson = localStorage.getItem('rbs_user');
    if (!userJson) return null;
    try {
        return JSON.parse(userJson);
    } catch {
        return null;
    }
}

// Login API call
export async function login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
    }

    const data = await response.json();
    return data as LoginResponse;
}

// Register API call
export async function register(email: string, password: string, fullName: string): Promise<RegisterResponse> {
    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
    }

    const data = await response.json();
    return data as RegisterResponse;
}

// Refresh token API call
export async function refreshToken(token: string): Promise<RefreshTokenResponse> {
    const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Token refresh failed');
    }

    const data = await response.json();
    return {
        token: data.token,
        refreshToken: data.refreshToken ?? null,
        expires: data.expires,
        user: data.user,
    };
}

// Logout current session
export async function logout(accessToken: string, refreshToken: string): Promise<ResponseMessage> {
    const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ token: refreshToken }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || 'Logout failed');
    }

    return data.message || 'Logged out successfully';
}

// Forgot password
export async function forgotPassword(email: string): Promise<ResponseMessage> {
    const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Forgot password failed');
    }
    const data = await response.json().catch(() => ({}));
    return data.message;
}
