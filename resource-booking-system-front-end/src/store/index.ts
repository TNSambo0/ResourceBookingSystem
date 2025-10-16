import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import auditLogsReducer from './slices/auditLogsSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        auditLogs: auditLogsReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
