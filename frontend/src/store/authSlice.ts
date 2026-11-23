import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuthUser } from '@/types';

const STORAGE_KEY = 'jobnet_auth';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  hydrated: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  hydrated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<{ user: AuthUser; accessToken: string }>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.hydrated = true;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(action.payload));
      }
    },
    hydrateSession(state) {
      if (typeof window === 'undefined') return;
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { user?: AuthUser; accessToken?: string };
          if (parsed.user && parsed.accessToken) {
            state.user = parsed.user;
            state.accessToken = parsed.accessToken;
          }
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      state.hydrated = true;
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.hydrated = true;
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    },
  },
});

export const { setSession, hydrateSession, logout } = authSlice.actions;
export default authSlice.reducer;
