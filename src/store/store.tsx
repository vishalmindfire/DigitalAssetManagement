import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@reducers/authSlice';
import fileReducer from '@reducers/fileSlice';
import { useSelector, useDispatch, type TypedUseSelectorHook } from 'react-redux';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    file: fileReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
