import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuthUser, Company } from '@/types';

const STORAGE_KEY = 'jobnet_auth';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  company: Company | null;
  hydrated: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  company: null,
  hydrated: false,
};

function persistState(state: AuthState) {
  if (typeof window === 'undefined') return;
  if (state.user && state.accessToken) {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        user: state.user,
        accessToken: state.accessToken,
        company: state.company,
      }),
    );
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(
      state,
      action: PayloadAction<{ user: AuthUser; accessToken: string; company?: Company | null }>,
    ) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.company = action.payload.company ?? null;
      state.hydrated = true;
      persistState(state);
    },
    setCompany(state, action: PayloadAction<Company | null>) {
      state.company = action.payload;
      persistState(state);
    },
    hydrateSession(state) {
      if (typeof window === 'undefined') return;
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as {
            user?: AuthUser;
            accessToken?: string;
            company?: Company | null;
          };
          if (parsed.user && parsed.accessToken) {
            state.user = parsed.user;
            state.accessToken = parsed.accessToken;
            state.company = parsed.company ?? null;
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
      state.company = null;
      state.hydrated = true;
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    },
  },
});

export const { setSession, setCompany, hydrateSession, logout } = authSlice.actions;
export default authSlice.reducer;
