import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Database, Activity, Map, Share2, AlignEndHorizontal, ChevronLeft, Eye } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/data-management', label: 'Data Management', icon: Database },
  { path: '/chart/radial-tree', label: 'Radial Tree', icon: Share2 },
  { path: '/chart/map', label: 'Map Chart', icon: Map },
  { path: '/chart/force-graph', label: 'Force Graph', icon: Activity },
  { path: '/chart/streamgraph', label: 'Streamgraph', icon: AlignEndHorizontal },
  { path: '/visitors', label: 'Page Visitors Detail', icon: Eye }
];

const Sidebar = ({ isSidebarCollapsed, isMobileScreen, toggleSidebar }) => {

  const sidebarClass = isMobileScreen
    ? (isSidebarCollapsed ? 'hidden' : 'w-64 block')
    : (isSidebarCollapsed ? 'w-20 block' : 'w-64 block');

  return (
    <aside className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-white dark:bg-[#112D4E] border-r border-(--color-muted) dark:border-[#3F72AF]/30 ${sidebarClass}`}>
      <div className="flex flex-col h-full">
        <div className="h-16 flex items-center px-4 border-b border-(--color-muted) dark:border-[#3F72AF]/30">
          {!isSidebarCollapsed && <img src="/logo.png" alt="Logo" className="h-11 w-11 mr-3 bg-white rounded-md" />}
          {!isSidebarCollapsed && <span className="text-xl font-bold text-(--color-primary) dark:text-[#DBE2EF] tracking-wide uppercase">Grafikuy</span>}
          <button onClick={toggleSidebar} className={`p-2 cursor-pointer rounded-lg hover:bg-(--color-muted) dark:hover:bg-[#3F72AF]/20 text-(--color-dark) dark:text-white transition-colors ${!isSidebarCollapsed ? 'ml-auto' : 'mx-auto'}`}>
            <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `flex ${isSidebarCollapsed ? 'justify-center' : 'justify-start'} items-center px-3 py-2.5 rounded-lg transition-colors group ${isActive ? 'bg-(--color-primary) text-(--color-light)' : 'text-gray-600 dark:text-gray-300 hover:bg-(--color-muted) dark:hover:bg-[#3F72AF]/20 hover:text-(--color-dark) dark:hover:text-white'}`}
                title={!isSidebarCollapsed ? item.label : ''}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!isSidebarCollapsed && <span className="ml-3 truncate font-medium">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
