import { useRef, useState } from 'react';
import { useAuth } from '@hooks/useAuth';
import { EyeCloseIcon, EyeIcon } from '@icons';
import Label from '@components/form/Label';
import Input from '@components/form/input/InputField';
import Button from '@components/ui/button/Button';
import { login } from '@services/authService';
import { login as dispatchLogin } from '@reducers/authSlice';

export default function SignInForm() {
  const { loading, dispatch } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);

  const handleLogin = async () => {
    setError(null);
    try {
      const userEmail = emailRef.current?.value ?? '';
      const userPassword = passRef.current?.value ?? '';
      console.log(userEmail);
      const response = await login(userEmail, userPassword);
      console.log(response);
      dispatch(dispatchLogin(response.user));
    } catch (err) {
      console.log(err);
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>
          <div>
            <form>
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>{' '}
                  </Label>
                  <Input placeholder="info@gmail.com" ref={emailRef} />
                </div>
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>{' '}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      ref={passRef}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                {error && <p className="text-sm text-error-500">{error}</p>}
                <div>
                  <Button className="w-full" size="sm" onClick={handleLogin} disabled={loading}>
                    Sign in
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
