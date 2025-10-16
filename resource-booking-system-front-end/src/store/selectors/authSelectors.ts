import type { RootState } from '../index';

export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectUserRoles = (state: RootState) => state.auth.user?.roles ?? [];
export const selectIsAuthenticated = (state: RootState) => !!state.auth.token;
