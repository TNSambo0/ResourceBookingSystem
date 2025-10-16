export type User = {
    id: string;
    email: string;
    fullName: string;
    roles: string[];
};

export type UserRole = 'Admin' | 'User' | 'Manager';
