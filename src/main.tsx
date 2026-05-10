import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from '@store/store';
import logErrorToServer from '@services/errorLogger';
import { type errorComponent } from '@entities/Error';

import './index.css';
import App from './App.tsx';

window.addEventListener('error', function (event) {
  const errorContext: errorComponent = {
    source: event.filename,
    lineNumber: event.lineno,
    columnNumber: event.colno,
  };
  logErrorToServer(
    {
      error: event.error instanceof Error ? event.error : new Error(String(event.message)),
      errorInfo: event.error,
      context: errorContext,
    },
    null
  );
});
window.addEventListener('unhandledrejection', function (event) {
  logErrorToServer(
    {
      error: event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      errorInfo: { componentStack: 'Unhandled Promise Rejection' },
      context: {
        type: 'UnhandledPromiseRejection',
      },
    },
    null
  );
  event.preventDefault();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
