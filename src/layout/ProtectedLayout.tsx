import { Outlet } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import Spinner from '@components/ui/Spinner';
import ErrorBoundary from '@services/errorBoundry';
import Login from '@pages/AuthPages/SignIn';
import ErrorPage from '@pages/OtherPage/Error';

function ProtectedRoute() {
  const { authenticated, loading, checked } = useAuth();

  if (!checked || loading) return <Spinner />;

  return (
    <ErrorBoundary fallback={<ErrorPage />}>{authenticated ? <Outlet /> : <Login />}</ErrorBoundary>
  );
}

export default ProtectedRoute;
