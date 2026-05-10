import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@store/store';

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();

  const authState = useSelector((state: RootState) => state.auth);

  return {
    ...authState,
    dispatch,
  };
}
