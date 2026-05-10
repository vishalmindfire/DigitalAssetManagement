import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import type { RootState, AppDispatch } from '@store/store';
import { fetchFiles } from '@reducers/fileSlice';

export function useFiles() {
  const dispatch = useDispatch<AppDispatch>();
  const filesState = useSelector((state: RootState) => state.file);
  const { authenticated, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (authenticated && user?.id && filesState.files.length === 0 && !filesState.loading) {
      dispatch(fetchFiles());
    }
  }, [authenticated, user?.id, filesState.files.length, filesState.loading, dispatch]);

  const loadMore = async () => {
    if (filesState.loading || !filesState.hasMore || filesState.error) {
      return;
    }

    await dispatch(fetchFiles());
  };

  return {
    ...filesState,
    loadMore,
  };
}
