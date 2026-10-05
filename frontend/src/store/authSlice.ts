import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthUser { id: string; email: string; fullName?: string; role: 'candidate' | 'employer' | 'admin' }
interface AuthState { user: AuthUser | null; accessToken: string | null }

const initialState: AuthState = { user: null, accessToken: null };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<{ user: AuthUser; accessToken: string }>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
    },
  },
});

export const { setSession, logout } = authSlice.actions;
export default authSlice.reducer;
