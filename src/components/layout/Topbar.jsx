import { useContext } from "react";
import { ThemeContext } from "@/context/ThemeContext";
import { Menu, Sun, Moon } from "lucide-react";
import PageVisitors from "../ui/PageVisitors";

const Topbar = ({ toggleSidebar, isSidebarCollapsed }) => {
  const { isDark, toggleTheme } = useContext(ThemeContext);
  
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
        <PageVisitors />

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
