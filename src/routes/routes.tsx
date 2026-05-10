import AppLayout from '@layout/AppLayout';
import NotFound from '@pages/OtherPage/NotFound';
import SignIn from '@pages/AuthPages/SignIn';
import Error from '@pages/OtherPage/NotFound';
import type { RouteObject } from 'react-router';
import Spinner from '@components/ui/Spinner';

import ProtectedLayout from '@layout/ProtectedLayout';
export const routes: RouteObject = {
  element: <AppLayout />,
  errorElement: <Error />,
  HydrateFallback: () => <Spinner />,
  children: [
    {
      Component: ProtectedLayout,
      children: [
        {
          path: '/admin',
          lazy: async () => {
            const mod = await import('@pages/AdminDashboard');
            return {
              Component: mod.default,
              HydrateFallback: () => <Spinner />,
            };
          },
        },
        {
          path: '/files',
          lazy: async () => {
            const mod = await import('@pages/Files');
            return {
              Component: mod.default,
              HydrateFallback: () => <Spinner />,
            };
          },
        },
      ],
    },
    {
      path: '/login',
      Component: SignIn,
    },
    {
      path: '/*',
      Component: NotFound,
    },
  ],
};
