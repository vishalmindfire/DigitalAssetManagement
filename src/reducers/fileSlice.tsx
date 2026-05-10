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
};

const initialState: FileState = {
  files: [],
  nextCursor: null,
  hasMore: true,
  loading: false,
  error: null,
  limit: 100,
};

export const fetchFiles = createAsyncThunk<
  Awaited<ReturnType<typeof FileService.getFiles>>,
  void,
  {
    state: RootState;
    rejectValue: ApiError;
  }
>('files/fetchFiles', async (_, thunkAPI) => {
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
    const response = await FileService.getFiles(userId, state.file.nextCursor, state.file.limit);

    return response;
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error instanceof ApiError
        ? error
        : {
            name: 'File Fetch Error',
            message: 'Unexpected error occured',
            status: 500,
          }
    );
  }
});

const fileSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    addFile: (state, action: PayloadAction<Files>) => {
      state.files.push(action.payload);
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
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.loading = false;

        state.files.push(...action.payload.files);

        state.nextCursor = action.payload.nextCursor;

        state.hasMore = action.payload.nextCursor != null;
      })

      .addCase(fetchFiles.rejected, (state, action) => {
        state.loading = false;

        state.error = action.error.message ?? 'Failed to fetch files';
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
} = fileSlice.actions;

export default fileSlice.reducer;
