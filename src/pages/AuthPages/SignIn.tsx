import { useEffect } from 'react';
import PageMeta from '@components/common/PageMeta';
import AuthLayout from '@pages/AuthPages/AuthPageLayout';
import SignInForm from '@components/auth/SignInForm';
import { useAuth } from '@hooks/useAuth';
import { useNavigate } from 'react-router';
import Spinner from '@components/ui/Spinner';

export default function SignIn() {
  const navigate = useNavigate();
  const { authenticated, loading } = useAuth();

  useEffect(() => {
    if (authenticated) {
      navigate('/files', { replace: true });
    }
  }, [authenticated, navigate]);
  return (
    <>
      <PageMeta
        title="React.js SignIn Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js SignIn Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      {!loading && authenticated ? (
        <Spinner />
      ) : (
        <AuthLayout>
          <SignInForm />
        </AuthLayout>
      )}
    </>
  );
}
