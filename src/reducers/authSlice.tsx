import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { type User } from '@entities/User';
import { isAuthenticated } from '@services/authService';

interface AuthState {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
  checked: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  authenticated: false,
  checked: false,
  error: null,
};

export const authenticate = createAsyncThunk('auth/isAuthenticate', async () => {
  const res = await isAuthenticated();
  return res;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      state.user = action.payload;
      state.loading = false;
      state.authenticated = true;
      state.checked = true;
    },
    logout: (state) => {
      state.user = null;
      state.authenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(authenticate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(authenticate.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.authenticated = action.payload.isAuthenticated;
        state.checked = true;
      })
      .addCase(authenticate.rejected, (state) => {
        state.loading = false;
        state.error = 'Login failed';
        state.checked = true;
      });
  },
});

export const { logout, login } = authSlice.actions;
export default authSlice.reducer;
