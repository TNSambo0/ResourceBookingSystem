export type ApiError = {
    message: string;
    status?: number;
};

export interface ApiResponse<T> {
    ok: boolean;
    data?: T;
    error?: string;
}