import { useContext } from "react";
import { ThemeContext } from "@/context/ThemeContext";
import { AuthContext } from "@/context/AuthContext";
import { Menu, Sun, Moon, LogIn, LogOut } from "lucide-react";
import PageVisitors from "@/components/ui/PageVisitors";

const Topbar = ({ toggleSidebar, isSidebarCollapsed }) => {
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const { user, loginWithGoogle, logoutGoogle } = useContext(AuthContext);
  
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
              {user ? user.displayName : "Guest"}
            </div>
            {user && (
              <button 
                onClick={logoutGoogle}
                className="text-xs text-red-500 hover:text-red-600 flex items-center justify-end gap-1 cursor-pointer w-full"
              >
                <LogOut className="w-3 h-3" /> Logout
              </button>
            )}
            {!user && (
              <button 
                onClick={loginWithGoogle}
                className="text-xs text-blue-500 hover:text-blue-600 flex items-center justify-end gap-1 cursor-pointer w-full"
              >
                <LogIn className="w-3 h-3" /> Login
              </button>
            )}
          </div>
          <div className="w-10 h-10 rounded-full bg-(--color-primary) text-(--color-light) flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-(--color-light) overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              "G"
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
