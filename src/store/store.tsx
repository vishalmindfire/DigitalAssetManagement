import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@reducers/authSlice';
import fileReducer from '@reducers/fileSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    file: fileReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
