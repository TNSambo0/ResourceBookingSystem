import { jwtDecode } from 'jwt-decode';
import type { JwtPayload } from '../types/Auth';

export const getRolesFromToken = (token: string | null): string[] => {
    if (!token) return [];

    try {
        const decoded: JwtPayload = jwtDecode(token);
        if (!decoded.role) return [];
        return Array.isArray(decoded.role) ? decoded.role : [decoded.role];
    } catch (err) {
        console.error('Failed to decode JWT:', err);
        return [];
    }
};

export const getUserIdFromToken = (token: string | null): string => {
    if (!token) return '';
    try {
        const decoded: JwtPayload = jwtDecode(token);
        return decoded.sub ?? '';
    } catch (err) {
        console.error('Failed to decode JWT:', err);
        return '';
    }
};
