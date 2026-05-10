import { SidebarProvider } from '@contexts/SidebarProvider';
import { useSidebar } from '@hooks/useSidebar';
import { Outlet } from 'react-router';
import AppHeader from '@layout/AppHeader';
import Backdrop from '@layout/Backdrop';
import AppSidebar from '@layout/AppSidebar';
import { useAuth } from '@hooks/useAuth';
import { useEffect } from 'react';
import { authenticate } from '@reducers/authSlice';

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { authenticated, checked, dispatch } = useAuth();

  useEffect(() => {
    if (!checked) {
      dispatch(authenticate());
    }
  }, [checked, dispatch]);

  return (
    <div className="min-h-screen xl:flex">
      {authenticated && (
        <div>
          <AppSidebar />
          <Backdrop />
        </div>
      )}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          authenticated && (isExpanded || isHovered ? 'lg:ml-[290px]' : 'lg:ml-[90px]')
        } ${isMobileOpen ? 'ml-0' : ''}`}
      >
        <AppHeader />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
