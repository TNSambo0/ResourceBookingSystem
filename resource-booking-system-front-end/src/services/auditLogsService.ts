import api from '../api/axiosInstance';
import type { AuditLog, AuditLogResponse } from '../types/Audit';

export const getAuditLogs = async (params: {
    userId?: string;
    action?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    pageSize?: number;
}): Promise<AuditLogResponse> => {
    const res = await api.get<AuditLogResponse>('/AuditLogs', { params });
    return res.data;
};

// --- Fetch a single audit log by ID ---
export const getAuditLog = async (id: number): Promise<AuditLog> => {
    const res = await api.get<AuditLog>(`/auditlogs/${id}`);
    return res.data;
};

// --- Cleanup old audit logs (default olderThanDays = 90) ---
export const cleanupAuditLogs = async (olderThanDays = 90): Promise<{ message: string }> => {
    const res = await api.delete<{ message: string }>('/auditlogs/cleanup', {
        params: { olderThanDays },
    });
    return res.data;
};
