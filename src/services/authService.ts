import type { User } from '@entities/User';
import logErrorToServer from '@services/errorLogger';
import { type ErrorDetail, ApiError } from '@entities/Error';
import type { Dispatch } from '@reduxjs/toolkit';
import { clearFiles } from '@reducers/fileSlice';
import { logout as dispatchLogout } from '@reducers/authSlice';
const API_URL = import.meta.env.VITE_API_URL;
interface LoginResponse {
  user: User | null;
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const bodyContent = {
    email: email,
    password: password,
  };
  const response = await fetch(`${API_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyContent),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(
      error.message ?? 'Failed to Login. Please try after some time.',
      response.status
    );
  }

  const data = await response.json();
  return { user: data };
};

export const logout = async (appDispatcher: Dispatch): Promise<boolean> => {
  const response = await fetch(`${API_URL}/users/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(error.message ?? 'Failed to authenticate', response.status);
  }
  appDispatcher(dispatchLogout());
  appDispatcher(clearFiles());
  return true;
};

export const isAuthenticated = async (): Promise<{
  isAuthenticated: boolean;
  user: User | null;
}> => {
  const response = await fetch(`${API_URL}/users/checkAuth`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    const error = await response.json();
    logError(error, 'Authentication fetch');
    throw new ApiError(error.message ?? 'Failed to authenticate', response.status);
  }
  if (response.status === 401 || response.status === 403) {
    return {
      isAuthenticated: false,
      user: null,
    };
  }

  const data = await response.json();
  return {
    isAuthenticated: true,
    user: data,
  };
};

function logError(error: unknown, stack: string): void {
  const errorDetail: ErrorDetail = {
    error: error instanceof Error ? error : new Error(String(error)),
    errorInfo: {
      componentStack: stack,
    },
    context: {
      component: 'FileService',
    },
  };
  logErrorToServer(errorDetail, null);
}
