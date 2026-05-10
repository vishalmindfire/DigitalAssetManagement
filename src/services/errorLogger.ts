import { type User } from '@entities/User';
import { type ErrorDetail } from '@entities/Error';

const logErrorToServer = async (errorDetail: ErrorDetail, user: User | null) => {
  const API_URL = import.meta.env.VITE_API_URL;
  const { error, errorInfo, context } = errorDetail;
  let loginUser = user;
  if (user === null) {
    loginUser = JSON.parse(localStorage.getItem('user') || 'null');
  }
  const errorData = {
    timeStamp: new Date().toISOString(),
    environment: import.meta.env.MODE,
    url: window.location.href,
    user: loginUser,
    error: {
      message: error.message || 'Unknown error',
      stack: error.stack || 'No stack trace available',
      name: error.name || 'Error',
    },
    errorInfo: errorInfo?.componentStack || 'No component stack info',
    ...context,
  };

  try {
    await fetch(`${API_URL}/log-error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData),
      keepalive: true,
    });
  } catch (error) {
    const failedErrorLogs = JSON.parse(localStorage.getItem('failedErrorLogs') || '[]');
    failedErrorLogs.push({
      Error: error,
    });
    localStorage.setItem('failedErrorLogs', JSON.stringify(failedErrorLogs));
  }
};

export default logErrorToServer;
