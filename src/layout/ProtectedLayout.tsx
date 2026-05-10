import { Outlet } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import Spinner from '@components/ui/Spinner';
import ErrorBoundary from '@services/errorBoundry';
import Login from '@pages/AuthPages/SignIn';
import ErrorPage from '@pages/OtherPage/Error';

function ProtectedRoute() {
  const { authenticated, loading } = useAuth();

  return (
    <ErrorBoundary fallback={<ErrorPage />}>
      {!authenticated ? !loading ? <Login /> : <Spinner /> : <Outlet />}
    </ErrorBoundary>
  );
}

export default ProtectedRoute;
