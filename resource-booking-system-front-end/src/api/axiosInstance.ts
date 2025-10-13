import axios, { AxiosHeaders } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import eventBus from '../utils/eventBus';

// Create the instance
const instance = axios.create({
    baseURL: 'https://localhost:7028/api',
    withCredentials: true,
    timeout: 15000,
});

instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
        try {
            const token = localStorage.getItem('rbs_token');
            if (token) {
                if (!config.headers) {
                    config.headers = new AxiosHeaders();
                }
                config.headers.set('Authorization', `Bearer ${token}`);
            }
        } catch (err: any) {
            // silent fail – no crash even if localStorage is unavailable
        }
        return config;
    },
    (error) => Promise.reject(error)
);

//handle global 401 (unauthorized) errors
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const requestUrl = error.config?.url || '';

        if (status === 401 && !requestUrl.includes('/auth/login')) {
            localStorage.removeItem('rbs_token');
            localStorage.removeItem('rbs_user');

            const message =
                error.response?.data ||
                error.response?.data?.message ||
                'Session expired. Please log in again.';

            eventBus.emit('unauthorized', message);
        }

        return Promise.reject(error);
    }
);

export default instance;
