import AppLayout from '@layout/AppLayout';
import NotFound from '@pages/OtherPage/NotFound';
import SignIn from '@pages/AuthPages/SignIn';
import Error from '@pages/OtherPage/NotFound';
import type { RouteObject } from 'react-router';
export const routes: RouteObject = {
  element: <AppLayout />,
  errorElement: <Error />,
  children: [
    {
      path: '/login',
      Component: SignIn,
    },
    {
      path: '/admin',
      lazy: async () => {
        const mod = await import('@pages/AdminDashboard');
        return {
          Component: mod.default,
        };
      },
    },
    {
      path: '/*',
      Component: NotFound,
    },
  ],
};
