import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getAuditLogs, cleanupAuditLogs } from '../../services/auditLogsService';
import type { AuditLog } from '../../types/Audit';

interface AuditLogsState {
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

const initialState: AuditLogsState = {
    logs: [],
    totalCount: 0,
    loading: false,
    error: null,
    filters: { page: 1, pageSize: 20 },
};

export const fetchAuditLogs = createAsyncThunk(
    'auditLogs/fetch',
    async (_, { getState, rejectWithValue }) => {
        try {
            const state = getState() as { auditLogs: AuditLogsState };
            return await getAuditLogs(state.auditLogs.filters);
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Failed to load audit logs');
        }
    }
);

export const cleanupLogs = createAsyncThunk(
    'auditLogs/cleanup',
    async (days: number, { rejectWithValue }) => {
        try {
            return await cleanupAuditLogs(days);
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Cleanup failed');
        }
    }
);

const auditLogsSlice = createSlice({
    name: 'auditLogs',
    initialState,
    reducers: {
        setFilters(state, action) {
            state.filters = { ...state.filters, ...action.payload };
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAuditLogs.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAuditLogs.fulfilled, (state, action) => {
                state.loading = false;
                state.logs = action.payload.data;
                state.totalCount = action.payload.totalCount;
            })
            .addCase(fetchAuditLogs.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(cleanupLogs.fulfilled, (state) => {
                // refetch after cleanup
                state.loading = false;
            });
    },
});

export const { setFilters } = auditLogsSlice.actions;
export default auditLogsSlice.reducer;