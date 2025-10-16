export interface AuditLog {
    id: number;
    userId: string;
    action: string;
    details: string;
    timestamp: string;
}

export interface AuditLogResponse {
    totalCount: number;
    page: number;
    pageSize: number;
    data: AuditLog[];
}

export interface AuditLogsState {
    logs: AuditLog[];
    totalCount: number;
    loading: boolean;
    error: string | null;
    filters: {
        userId?: string;
        action?: string;
        fromDate?: string;
        toDate?: string;
        page: number;
        pageSize: number;
    };
}