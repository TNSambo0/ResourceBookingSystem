export type User = {
    id: string;
    email: string;
    fullName: string;
    roles?: string[];
    token: string;
    refreshToken: string;
};

export type UserRole = 'Admin' | 'User' | 'Manager';
