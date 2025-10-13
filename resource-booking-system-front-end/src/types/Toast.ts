export type ToastType = 'success' | 'danger' | 'info' | 'warning';

export interface ToastMessage {
    id: number;
    message: string;
    type: ToastType;
}
export interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}