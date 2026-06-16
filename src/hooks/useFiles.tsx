import { useDispatch, useSelector, useStore } from 'react-redux';
import { useEffect, useCallback } from 'react';
import type { RootState, AppDispatch } from '@store/store';
import { fetchFiles } from '@reducers/fileSlice';

export function useFiles() {
  const dispatch = useDispatch<AppDispatch>();
  const store = useStore<RootState>();
  const filesState = useSelector((state: RootState) => state.file);
  const { authenticated, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (authenticated && user?.id && !filesState.initialFetchDone) {
      dispatch(fetchFiles());
    }
  }, [authenticated, user?.id, filesState.initialFetchDone, dispatch, filesState.searchValue]);

  const loadMore = useCallback(async () => {
    const { loading, hasMore, error } = store.getState().file;
    if (loading || !hasMore || error) return;
    await dispatch(fetchFiles());
  }, [dispatch, store]);

  return {
    ...filesState,
    loadMore,
  };
}
