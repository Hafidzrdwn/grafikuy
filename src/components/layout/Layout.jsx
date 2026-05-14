import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { Link, Outlet } from 'react-router-dom';
import PageVisitors from '@/components/ui/PageVisitors';
import { Heart } from 'lucide-react';
import { incrementPageView } from '@/services/firebase';

const Layout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarCollapsed(false);
        setIsMobileScreen(false)
      } else {
        setIsSidebarCollapsed(true);
        setIsMobileScreen(true)
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const sessionKey = `grafikuy_already_visited`;

    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, 'true');
      incrementPageView();
    }
  }, []);

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

  return (
    <div className="min-h-screen bg-(--color-light) dark:bg-[#0a192f] text-(--color-dark) dark:text-white font-sans transition-colors duration-300">
      <Sidebar isSidebarCollapsed={isSidebarCollapsed} isMobileScreen={isMobileScreen} toggleSidebar={toggleSidebar} />
      <Topbar isSidebarCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      <main className={`transition-all duration-300 pt-16 min-h-screen ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center gap-y-2 mt-2 mb-4">
            <PageVisitors className='sm:hidden inline-flex' />
            <p className="text-gray-500 dark:text-gray-300">
              Made with <Heart className='inline-flex w-4 h-4' fill='red' strokeWidth={0} /> by <Link to="https://hafidzrdwn.my.id" target='_blank' className='text-(--color-primary) underline'>Hafidz Ridwan Cahya</Link>
            </p>
          </div>
          <Outlet />
        </div>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <p className="text-center text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Hafidz Ridwan Cahya. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Layout;
