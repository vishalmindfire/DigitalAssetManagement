// store/slices/fileSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { type Files } from '@entities/File';
import { FileService } from '@services/fileService';
import { ApiError } from '@entities/Error';
import type { RootState } from '@store/store';

type FileState = {
  files: Files[];
  nextCursor: {
    fileId: string;
    createDate: Date;
  } | null;
  hasMore: boolean;
  loading: boolean;
  error: unknown;
  limit: number;
  initialFetchDone: boolean;
  searchValue: string | null;
};

const initialState: FileState = {
  files: [],
  nextCursor: null,
  hasMore: true,
  loading: false,
  error: null,
  limit: 1,
  initialFetchDone: false,
  searchValue: null
};

export const fetchFiles = createAsyncThunk<
  Awaited<ReturnType<typeof FileService.getFiles>>,
  void,
  {
    state: RootState;
    rejectValue: ApiError;
  }
>(
  'files/fetchFiles',
  async (_, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const userId = state.auth.user?.id;
    if (!userId) {
      return thunkAPI.rejectWithValue({
        name: 'File Fetch Error',
        message: 'You are not logged in.',
        status: 400,
      });
    }
    try {
      const response = await FileService.getFiles(userId, state.file.nextCursor, state.file.limit, state.file.searchValue);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof ApiError
          ? { ...error }
          : { name: 'File Fetch Error', message: 'Unexpected error occured', status: 500 }
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const { loading, hasMore } = (getState() as RootState).file;
      return !loading && hasMore;
    },
  }
);

const fileSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    addFile: (state, action: PayloadAction<Files>) => {
      state.files = [action.payload, ...state.files];
    },
    updateFileProgress: (
      state,
      action: PayloadAction<{
        id: string;
        progress: number;
        status: Files['status'];
      }>
    ) => {
      const file = state.files.find((f) => f.id === action.payload.id);

      if (file) {
        file.progress = action.payload.progress;
        file.status = action.payload.status;
      }
    },
    updateFile: (
      state,
      action: PayloadAction<Files>
    ) => {
        state.files = state.files.map((file) => {
                                        if(file.id === action.payload.id){
                                                            file.url = action.payload.url;
                                                          }
                                                          return file;
                                      })
    },

    markFileUploaded: (
      state,
      action: PayloadAction<{
        id: string;
        url: string;
        objectKey: string;
      }>
    ) => {
      const file = state.files.find((f) => f.id === action.payload.id);

      if (file) {
        file.status = 'COMPLETED';
        file.progress = 100;
        file.url = action.payload.url;
        file.objectKey = action.payload.objectKey;
      }
    },

    markFileFailed: (
      state,
      action: PayloadAction<{
        id: string;
        error: string;
      }>
    ) => {
      const file = state.files.find((f) => f.id === action.payload.id);

      if (file) {
        file.status = 'FAILED';
        file.error = action.payload.error;
      }
    },

    removeFile: (state, action: PayloadAction<string>) => {
      state.files = state.files.filter((f) => f.id !== action.payload);
    },

    clearFiles: (state) => {
      state.files = [];
      state.initialFetchDone = false;
      state.nextCursor = null;
      state.hasMore = true;
      state.error = null;
    },

    setSearchValue: (state , action: PayloadAction<{
                        search: string | null;
                      }>) => {
       state.searchValue = action.payload.search;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.initialFetchDone = true;
      })

      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.files = [...state.files, ...action.payload.files];

        state.nextCursor = action.payload.nextCursor;

        state.hasMore = action.payload.nextCursor != null;
      })

      .addCase(fetchFiles.rejected, (state, action) => {
        state.loading = false;

        state.error = action.payload?.message ?? action.error.message ?? 'Failed to fetch files';
      });
  },
});

export const {
  addFile,
  updateFileProgress,
  markFileUploaded,
  markFileFailed,
  removeFile,
  clearFiles,
  setSearchValue,
  updateFile
} = fileSlice.actions;

export const selectFileById = (state: RootState, id: string) =>
  state.file.files.find((file) => file.id === id);

export const selectFilesByUserId = (state: RootState) =>
  state.file.files.filter((file) => file.userId === state.auth.user?.id);

export default fileSlice.reducer;
