import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { Outlet } from 'react-router-dom';
import PageVisitors from '../ui/PageVisitors';

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

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

  return (
    <div className="min-h-screen bg-(--color-light) dark:bg-[#0a192f] text-(--color-dark) dark:text-white font-sans transition-colors duration-300">
      <Sidebar isSidebarCollapsed={isSidebarCollapsed} isMobileScreen={isMobileScreen} toggleSidebar={toggleSidebar} />
      <Topbar isSidebarCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      <main className={`transition-all duration-300 pt-16 min-h-screen ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <PageVisitors className='sm:hidden inline-flex mt-2 mb-4' />
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
