import type { User } from '@entities/User';
import logErrorToServer from '@services/errorLogger';
import { type ErrorDetail, ApiError } from '@entities/Error';
const API_URL = import.meta.env.VITE_API_URL;
interface LoginResponse {
  user: User | null;
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const bodyContent = {
    email: email,
    password: password,
  };
  try {
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
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const logout = async (): Promise<boolean> => {
  const response = await fetch(`${API_URL}/users/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(error.message ?? 'Failed to authenticate', response.status);
  }
  return true;
};

export const isAuthenticated = async (): Promise<{
  isAuthenticated: boolean;
  user: User | null;
}> => {
  try {
    const response = await fetch(`${API_URL}/users/checkAuth`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const error = await response.json();
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
  } catch (error) {
    logError(error, 'Authentication check failed');
    throw error;
  }
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
