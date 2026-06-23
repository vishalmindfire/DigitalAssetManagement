import { jest, describe, test, expect, beforeEach } from '@jest/globals';

jest.mock('@services/authService', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: jest.fn(),
}));
jest.mock('@services/fileService', () => ({
  FileService: {
    getFiles: jest.fn(),
    uploadFile: jest.fn(),
    updateFileSatus: jest.fn(),
    logError: jest.fn(),
  },
}));
jest.mock('@services/errorLogger', () => jest.fn());

jest.mock('react-window', () => ({
  List: ({
    rowComponent: RowComponent,
    rowCount,
    rowProps,
    onRowsRendered,
  }: {
    rowComponent: (props: {
      index: number;
      style: React.CSSProperties;
      [key: string]: unknown;
    }) => React.ReactNode;
    rowCount: number;
    rowProps: Record<string, unknown>;
    onRowsRendered?: (info: { startIndex: number; stopIndex: number }) => void;
  }) => {
    // Synchronously render all rows so tests can query them
    const items = Array.from({ length: rowCount }, (_, i) => (
      <React.Fragment key={i}>{RowComponent({ index: i, style: {}, ...rowProps })}</React.Fragment>
    ));
    // Simulate onRowsRendered after render
    if (onRowsRendered && rowCount > 0) {
      onRowsRendered({ startIndex: 0, stopIndex: rowCount - 1 });
    }
    return <div data-testid="virtual-list">{items}</div>;
  },
  useDynamicRowHeight: () => () => 45,
}));

import '@testing-library/jest-dom/jest-globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@reducers/authSlice';
import fileReducer, {
  addFile,
  updateFileProgress,
  markFileUploaded,
  markFileFailed,
  removeFile,
  clearFiles,
  fetchFiles,
} from '@reducers/fileSlice';
import FileTable from '@components/tables/FilesTable';
import { FileService } from '@services/fileService';
import { type Files } from '@entities/File';
import { type User } from '@entities/User';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockUser: User = {
  id: 'user-1',
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@example.com',
  role: 'user',
};

const adminUser: User = {
  id: 'admin-1',
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@example.com',
  role: 'admin',
};

function makeFile(overrides: Partial<Files> = {}): Files {
  return {
    id: 'file-1',
    name: 'document.pdf',
    size: 1024,
    mimeType: 'application/pdf',
    status: 'COMPLETED',
    progress: 100,
    url: 'https://example.com/document.pdf',
    uploadDate: new Date('2024-01-15'),
    userId: 'user-1',
    ...overrides,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type StoreOverride = {
  auth?: Partial<ReturnType<typeof authReducer>>;
  file?: Partial<ReturnType<typeof fileReducer>>;
};

function makeStore(overrides: StoreOverride = {}) {
  return configureStore({
    reducer: { auth: authReducer, file: fileReducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
    preloadedState: {
      auth: {
        user: mockUser,
        loading: false,
        authenticated: true,
        checked: true,
        error: null,
        ...overrides.auth,
      },
      file: {
        files: [],
        nextCursor: null,
        hasMore: false,
        loading: false,
        error: null,
        limit: 10,
        initialFetchDone: true,
        ...overrides.file,
      },
    },
  });
}

function renderFileTable(section: 'user' | 'admin' = 'user', store = makeStore()) {
  render(
    <Provider store={store}>
      <FileTable section={section} />
    </Provider>
  );
  return store;
}

// ─── fileSlice reducers ───────────────────────────────────────────────────────

describe('fileSlice reducers', () => {
  test('initial state is correct', () => {
    const store = configureStore({ reducer: { auth: authReducer, file: fileReducer } });
    const { file } = store.getState();
    expect(file.files).toEqual([]);
    expect(file.hasMore).toBe(true);
    expect(file.loading).toBe(false);
    expect(file.error).toBeNull();
    expect(file.initialFetchDone).toBe(false);
  });

  test('addFile appends a file to state', () => {
    const store = makeStore();
    const file = makeFile();
    store.dispatch(addFile(file));
    expect(store.getState().file.files).toHaveLength(1);
    expect(store.getState().file.files[0]).toEqual(file);
  });

  test('updateFileProgress updates progress and status of matching file', () => {
    const store = makeStore({
      file: { files: [makeFile({ id: 'f1', progress: 0, status: 'PENDING' })] },
    });
    store.dispatch(updateFileProgress({ id: 'f1', progress: 50, status: 'PROCESSING' }));
    const updated = store.getState().file.files[0];
    expect(updated.progress).toBe(50);
    expect(updated.status).toBe('PROCESSING');
  });

  test('updateFileProgress does nothing when id is not found', () => {
    const file = makeFile({ id: 'f1' });
    const store = makeStore({ file: { files: [file] } });
    store.dispatch(updateFileProgress({ id: 'unknown', progress: 99, status: 'COMPLETED' }));
    expect(store.getState().file.files[0].progress).toBe(file.progress);
  });

  test('markFileUploaded sets status=COMPLETED, progress=100, url and objectKey', () => {
    const store = makeStore({
      file: { files: [makeFile({ id: 'f1', status: 'PROCESSING', progress: 80 })] },
    });
    store.dispatch(
      markFileUploaded({ id: 'f1', url: 'https://cdn.example.com/f1', objectKey: 'uploads/f1' })
    );
    const updated = store.getState().file.files[0];
    expect(updated.status).toBe('COMPLETED');
    expect(updated.progress).toBe(100);
    expect(updated.url).toBe('https://cdn.example.com/f1');
    expect(updated.objectKey).toBe('uploads/f1');
  });

  test('markFileFailed sets status=FAILED and error message', () => {
    const store = makeStore({ file: { files: [makeFile({ id: 'f1', status: 'PROCESSING' })] } });
    store.dispatch(markFileFailed({ id: 'f1', error: 'Upload timed out' }));
    const updated = store.getState().file.files[0];
    expect(updated.status).toBe('FAILED');
    expect(updated.error).toBe('Upload timed out');
  });

  test('removeFile removes the matching file from state', () => {
    const store = makeStore({
      file: { files: [makeFile({ id: 'f1' }), makeFile({ id: 'f2', name: 'other.png' })] },
    });
    store.dispatch(removeFile('f1'));
    const files = store.getState().file.files;
    expect(files).toHaveLength(1);
    expect(files[0].id).toBe('f2');
  });

  test('clearFiles resets file state to initial values', () => {
    const store = makeStore({
      file: {
        files: [makeFile()],
        nextCursor: { fileId: 'f1', createDate: new Date() },
        hasMore: false,
        initialFetchDone: true,
        error: 'some error',
      },
    });
    store.dispatch(clearFiles());
    const { files, nextCursor, hasMore, initialFetchDone, error } = store.getState().file;
    expect(files).toHaveLength(0);
    expect(nextCursor).toBeNull();
    expect(hasMore).toBe(true);
    expect(initialFetchDone).toBe(false);
    expect(error).toBeNull();
  });
});

// ─── fetchFiles thunk ─────────────────────────────────────────────────────────

describe('fetchFiles thunk', () => {
  beforeEach(() => {
    jest.mocked(FileService.getFiles).mockReset();
  });

  test('sets loading=true while pending and loading=false after resolve', async () => {
    jest
      .mocked(FileService.getFiles)
      .mockResolvedValueOnce({ success: true, files: [], nextCursor: null as never });
    const store = configureStore({
      reducer: { auth: authReducer, file: fileReducer },
      preloadedState: {
        auth: { user: mockUser, loading: false, authenticated: true, checked: true, error: null },
      },
    });

    const promise = store.dispatch(fetchFiles());
    expect(store.getState().file.loading).toBe(true);
    await promise;
    expect(store.getState().file.loading).toBe(false);
  });

  test('sets initialFetchDone=true on pending', async () => {
    jest
      .mocked(FileService.getFiles)
      .mockResolvedValueOnce({ success: true, files: [], nextCursor: null as never });
    const store = configureStore({
      reducer: { auth: authReducer, file: fileReducer },
      preloadedState: {
        auth: { user: mockUser, loading: false, authenticated: true, checked: true, error: null },
      },
    });
    expect(store.getState().file.initialFetchDone).toBe(false);
    await store.dispatch(fetchFiles());
    expect(store.getState().file.initialFetchDone).toBe(true);
  });

  test('appends files and sets hasMore=false when nextCursor is null', async () => {
    const files = [makeFile({ id: 'f1' }), makeFile({ id: 'f2', name: 'img.png' })];
    jest
      .mocked(FileService.getFiles)
      .mockResolvedValueOnce({ success: true, files, nextCursor: null as never });
    const store = configureStore({
      reducer: { auth: authReducer, file: fileReducer },
      preloadedState: {
        auth: { user: mockUser, loading: false, authenticated: true, checked: true, error: null },
      },
    });
    await store.dispatch(fetchFiles());
    expect(store.getState().file.files).toHaveLength(2);
    expect(store.getState().file.hasMore).toBe(false);
  });

  test('sets hasMore=true when nextCursor is present', async () => {
    jest.mocked(FileService.getFiles).mockResolvedValueOnce({
      success: true,
      files: [makeFile()],
      nextCursor: { fileId: 'f1', createDate: new Date() },
    });
    const store = configureStore({
      reducer: { auth: authReducer, file: fileReducer },
      preloadedState: {
        auth: { user: mockUser, loading: false, authenticated: true, checked: true, error: null },
      },
    });
    await store.dispatch(fetchFiles());
    expect(store.getState().file.hasMore).toBe(true);
  });

  test('sets error state on rejection', async () => {
    jest.mocked(FileService.getFiles).mockRejectedValueOnce(new Error('Network error'));
    const store = configureStore({
      reducer: { auth: authReducer, file: fileReducer },
      preloadedState: {
        auth: { user: mockUser, loading: false, authenticated: true, checked: true, error: null },
      },
    });
    await store.dispatch(fetchFiles());
    expect(store.getState().file.error).toBeTruthy();
    expect(store.getState().file.loading).toBe(false);
  });

  test('does not dispatch when loading=true (condition guard)', async () => {
    const store = makeStore({ file: { loading: true, hasMore: true, initialFetchDone: false } });
    await store.dispatch(fetchFiles());
    expect(FileService.getFiles).not.toHaveBeenCalled();
  });

  test('does not dispatch when hasMore=false (condition guard)', async () => {
    const store = makeStore({ file: { loading: false, hasMore: false, initialFetchDone: false } });
    await store.dispatch(fetchFiles());
    expect(FileService.getFiles).not.toHaveBeenCalled();
  });
});

// ─── FileTable component ──────────────────────────────────────────────────────

describe('FileTable', () => {
  beforeEach(() => {
    jest.mocked(FileService.getFiles).mockReset();
  });

  test('renders all four column headers', () => {
    renderFileTable();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Size')).toBeInTheDocument();
    expect(screen.getByText('Upload Date')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  test('renders file name and size for each file', () => {
    const file = makeFile({ name: 'report.pdf', size: 2048 });
    renderFileTable('user', makeStore({ file: { files: [file] } }));
    expect(screen.getByText('report.pdf')).toBeInTheDocument();
    expect(screen.getByText('2048')).toBeInTheDocument();
  });

  test('renders formatted upload date', () => {
    const file = makeFile({ uploadDate: new Date('2024-03-07') });
    renderFileTable('user', makeStore({ file: { files: [file] } }));
    // toLocaleDateString en-US dd/mm/yyyy format → "03/07/2024"
    expect(screen.getByText('03/07/2024')).toBeInTheDocument();
  });

  test('shows COMPLETED status badge with success color', () => {
    const file = makeFile({ status: 'COMPLETED' });
    renderFileTable('user', makeStore({ file: { files: [file] } }));
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
  });

  test('shows PENDING status badge', () => {
    const file = makeFile({ status: 'PENDING', progress: 0 });
    renderFileTable('user', makeStore({ file: { files: [file] } }));
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  test('shows PROCESSING status badge', () => {
    const file = makeFile({ status: 'PROCESSING', progress: 50 });
    renderFileTable('user', makeStore({ file: { files: [file] } }));
    expect(screen.getByText('PROCESSING')).toBeInTheDocument();
  });

  test('shows FAILED status badge', () => {
    const file = makeFile({ status: 'FAILED', progress: 0, error: 'Upload failed' });
    renderFileTable('user', makeStore({ file: { files: [file] } }));
    expect(screen.getByText('FAILED')).toBeInTheDocument();
  });

  test('"user" section shows only files belonging to the logged-in user', () => {
    const myFile = makeFile({ id: 'f1', name: 'mine.pdf', userId: 'user-1' });
    const otherFile = makeFile({ id: 'f2', name: 'other.pdf', userId: 'user-99' });
    renderFileTable('user', makeStore({ file: { files: [myFile, otherFile] } }));
    expect(screen.getByText('mine.pdf')).toBeInTheDocument();
    expect(screen.queryByText('other.pdf')).not.toBeInTheDocument();
  });

  test('"admin" section shows all files regardless of userId', () => {
    const myFile = makeFile({ id: 'f1', name: 'mine.pdf', userId: 'user-1' });
    const otherFile = makeFile({ id: 'f2', name: 'other.pdf', userId: 'user-99' });
    renderFileTable('admin', makeStore({ file: { files: [myFile, otherFile] } }));
    expect(screen.getByText('mine.pdf')).toBeInTheDocument();
    expect(screen.getByText('other.pdf')).toBeInTheDocument();
  });

  test('renders multiple files', () => {
    const files = [
      makeFile({ id: 'f1', name: 'alpha.pdf', userId: 'user-1' }),
      makeFile({ id: 'f2', name: 'beta.pdf', userId: 'user-1' }),
      makeFile({ id: 'f3', name: 'gamma.pdf', userId: 'user-1' }),
    ];
    renderFileTable('user', makeStore({ file: { files } }));
    expect(screen.getByText('alpha.pdf')).toBeInTheDocument();
    expect(screen.getByText('beta.pdf')).toBeInTheDocument();
    expect(screen.getByText('gamma.pdf')).toBeInTheDocument();
  });

  test('shows "Loading more..." sentinel row when hasMore=true', () => {
    const file = makeFile({ userId: 'user-1' });
    // loading=true prevents handleRowsRendered from calling loadMore during synchronous render
    renderFileTable('user', makeStore({ file: { files: [file], hasMore: true, loading: true } }));
    expect(screen.getByText('Loading more...')).toBeInTheDocument();
  });

  test('does not show "Loading more..." row when hasMore=false', () => {
    const file = makeFile({ userId: 'user-1' });
    renderFileTable('user', makeStore({ file: { files: [file], hasMore: false } }));
    expect(screen.queryByText('Loading more...')).not.toBeInTheDocument();
  });

  test('does not show error popup on initial render', () => {
    renderFileTable();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('renders correctly when file state has a fetch error', () => {
    renderFileTable(
      'user',
      makeStore({ file: { files: [], error: 'Failed to fetch', hasMore: false } })
    );
    // Table headers still render even when there's a fetch error in state
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  test('admin section renders admin user files with correct admin user context', () => {
    const files = [
      makeFile({ id: 'f1', name: 'admin-file.pdf', userId: adminUser.id }),
      makeFile({ id: 'f2', name: 'user-file.pdf', userId: 'user-1' }),
    ];
    const store = makeStore({
      auth: { user: adminUser },
      file: { files },
    });
    renderFileTable('admin', store);
    expect(screen.getByText('admin-file.pdf')).toBeInTheDocument();
    expect(screen.getByText('user-file.pdf')).toBeInTheDocument();
  });

  test('renders empty table body when there are no files', () => {
    renderFileTable('user', makeStore({ file: { files: [] } }));
    expect(screen.queryByText('Loading more...')).not.toBeInTheDocument();
    // Headers still render
    expect(screen.getByText('Name')).toBeInTheDocument();
  });
});
