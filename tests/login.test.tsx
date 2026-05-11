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

import '@testing-library/jest-dom/jest-globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { authenticate, login, logout } from '@reducers/authSlice';
import fileReducer from '@reducers/fileSlice';
import SignInForm from '@components/auth/SignInForm';
import { login as loginService, isAuthenticated } from '@services/authService';
import { type User } from '@entities/User';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockUser: User = {
  id: 'user-1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  role: 'user',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

type AuthOverride = Partial<ReturnType<typeof authReducer>>;

function makeStore(authOverride?: AuthOverride) {
  return configureStore({
    reducer: { auth: authReducer, file: fileReducer },
    preloadedState: authOverride
      ? {
          auth: {
            user: null,
            loading: false,
            authenticated: false,
            checked: false,
            error: null,
            ...authOverride,
          },
        }
      : undefined,
  });
}

function renderSignInForm(store = makeStore()) {
  render(
    <Provider store={store}>
      <SignInForm />
    </Provider>
  );
  return store;
}

// ─── authSlice – reducers ─────────────────────────────────────────────────────

describe('authSlice reducers', () => {
  test('initial state is correct', () => {
    const { auth } = makeStore().getState();
    expect(auth.user).toBeNull();
    expect(auth.loading).toBe(false);
    expect(auth.authenticated).toBe(false);
    expect(auth.checked).toBe(false);
    expect(auth.error).toBeNull();
  });

  test('login sets user, authenticated=true, checked=true, loading=false', () => {
    const store = makeStore();
    store.dispatch(login(mockUser));
    const { user, authenticated, checked, loading } = store.getState().auth;
    expect(user).toEqual(mockUser);
    expect(authenticated).toBe(true);
    expect(checked).toBe(true);
    expect(loading).toBe(false);
  });

  test('login with null user sets user=null', () => {
    const store = makeStore();
    store.dispatch(login(null));
    expect(store.getState().auth.user).toBeNull();
    expect(store.getState().auth.authenticated).toBe(true);
  });

  test('logout clears user and resets authenticated to false', () => {
    const store = makeStore();
    store.dispatch(login(mockUser));
    store.dispatch(logout());
    const { user, authenticated } = store.getState().auth;
    expect(user).toBeNull();
    expect(authenticated).toBe(false);
  });

  test('logout does not change checked or loading', () => {
    const store = makeStore({ checked: true, loading: false });
    store.dispatch(logout());
    expect(store.getState().auth.checked).toBe(true);
    expect(store.getState().auth.loading).toBe(false);
  });
});

// ─── authenticate thunk ───────────────────────────────────────────────────────

describe('authenticate thunk', () => {
  test('sets loading=true while pending, loading=false after resolve', async () => {
    jest.mocked(isAuthenticated).mockResolvedValueOnce({
      isAuthenticated: true,
      user: mockUser,
    });
    const store = makeStore();
    const promise = store.dispatch(authenticate());

    expect(store.getState().auth.loading).toBe(true);

    await promise;
    expect(store.getState().auth.loading).toBe(false);
  });

  test('sets user and authenticated=true when server confirms active session', async () => {
    jest.mocked(isAuthenticated).mockResolvedValueOnce({
      isAuthenticated: true,
      user: mockUser,
    });
    const store = makeStore();
    await store.dispatch(authenticate());
    const { user, authenticated, checked } = store.getState().auth;
    expect(user).toEqual(mockUser);
    expect(authenticated).toBe(true);
    expect(checked).toBe(true);
  });

  test('sets authenticated=false and user=null when no active session', async () => {
    jest.mocked(isAuthenticated).mockResolvedValueOnce({
      isAuthenticated: false,
      user: null,
    });
    const store = makeStore();
    await store.dispatch(authenticate());
    const { user, authenticated, checked } = store.getState().auth;
    expect(user).toBeNull();
    expect(authenticated).toBe(false);
    expect(checked).toBe(true);
  });

  test('sets error="Login failed" and checked=true on rejection', async () => {
    jest.mocked(isAuthenticated).mockRejectedValueOnce(new Error('Network error'));
    const store = makeStore();
    await store.dispatch(authenticate());
    const { error, checked, loading } = store.getState().auth;
    expect(error).toBe('Login failed');
    expect(checked).toBe(true);
    expect(loading).toBe(false);
  });

  test('clears previous error when a new authenticate call starts', async () => {
    const store = makeStore({ error: 'old error' });
    jest.mocked(isAuthenticated).mockResolvedValueOnce({
      isAuthenticated: true,
      user: mockUser,
    });
    const promise = store.dispatch(authenticate());
    // pending clears error
    expect(store.getState().auth.error).toBeNull();
    await promise;
  });
});

// ─── SignInForm component ─────────────────────────────────────────────────────

describe('SignInForm', () => {
  beforeEach(() => {
    jest.mocked(loginService).mockReset();
  });

  test('renders email input, password input, and sign in button', () => {
    renderSignInForm();
    expect(screen.getByPlaceholderText('info@gmail.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('sign in button is disabled when auth state has loading=true', () => {
    renderSignInForm(makeStore({ loading: true }));
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
  });

  test('sign in button is enabled when not loading', () => {
    renderSignInForm();
    expect(screen.getByRole('button', { name: /sign in/i })).not.toBeDisabled();
  });

  test('calls login service with entered email and password', async () => {
    jest.mocked(loginService).mockResolvedValueOnce({ user: mockUser });
    renderSignInForm();

    fireEvent.change(screen.getByPlaceholderText('info@gmail.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(loginService).toHaveBeenCalledWith('test@example.com', 'password123')
    );
  });

  test('updates Redux store on successful login', async () => {
    jest.mocked(loginService).mockResolvedValueOnce({ user: mockUser });
    const store = renderSignInForm();

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      const { user, authenticated } = store.getState().auth;
      expect(user).toEqual(mockUser);
      expect(authenticated).toBe(true);
    });
  });

  test('shows error message when login service rejects', async () => {
    jest.mocked(loginService).mockRejectedValueOnce(new Error('Invalid credentials'));
    renderSignInForm();

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeInTheDocument());
  });

  test('shows generic error when rejection is not an Error instance', async () => {
    jest.mocked(loginService).mockRejectedValueOnce('string error');
    renderSignInForm();

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(screen.getByText('Login failed')).toBeInTheDocument());
  });

  test('clears previous error at the start of a new login attempt', async () => {
    jest
      .mocked(loginService)
      .mockRejectedValueOnce(new Error('Wrong password'))
      .mockResolvedValueOnce({ user: mockUser });
    renderSignInForm();

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(screen.getByText('Wrong password')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(screen.queryByText('Wrong password')).not.toBeInTheDocument());
  });

  test('calls login service with empty strings when no input provided', async () => {
    jest.mocked(loginService).mockResolvedValueOnce({ user: mockUser });
    renderSignInForm();

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(loginService).toHaveBeenCalledWith('', ''));
  });
});
