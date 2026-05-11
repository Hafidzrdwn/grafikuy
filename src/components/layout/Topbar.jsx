import { useContext } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import { Menu, Sun, Moon, ChartColumnIncreasing, Eye } from "lucide-react";
import { usePageViews } from "../../hooks/usePageViews";

const Topbar = ({ toggleSidebar, isSidebarCollapsed }) => {
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const totalViews = usePageViews("main_dashboard");

  return (
    <header
      className={`fixed top-0 right-0 z-30 bg-white/80 dark:bg-[#1a365d]/80 backdrop-blur-md border-b border-(--color-muted) dark:border-[#3F72AF]/30 h-16 transition-all duration-300 flex items-center justify-between px-4 sm:px-6 w-full ${isSidebarCollapsed ? "md:w-[calc(100%-5rem)]" : "md:w-[calc(100%-16rem)]"}`}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="cursor-pointer md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-[#3F72AF]/20 dark:text-gray-300 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="flex items-center gap-4 ml-auto">
        {totalViews === null ? (
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#3F72AF]/10 px-3 py-1.5 rounded-full border border-gray-200 dark:border-[#3F72AF]/20 animate-pulse">
            <div className="h-2.5 w-2.5 bg-gray-300 dark:bg-[#3F72AF]/40 rounded-full"></div>
            <div className="h-4 w-14 bg-gray-300 dark:bg-[#3F72AF]/40 rounded-sm"></div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800/50 transition-all duration-500">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>

            <span className="text-sm flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400 leading-none">
              <Eye className="w-4 h-4 shrink-0" />
              <span>{totalViews} Visitors</span>
            </span>
          </div>
        )}

        <button
          onClick={toggleTheme}
          className="cursor-pointer p-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3F72AF]/20 rounded-full transition-colors"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-3 border-l border-gray-300 dark:border-gray-600 pl-4">
          <div className="block text-right">
            <div className="text-base font-medium text-(--color-dark) dark:text-white">
              Hafidz Ridwan Cahya
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-(--color-primary) text-(--color-light) flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-(--color-light)">
            HRC
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
