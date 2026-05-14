import { usePageViews } from "@/hooks/usePageViews";
import { Eye } from "lucide-react";

const PageVisitors = ({ className = "sm:flex hidden" }) => {
  const totalViews = usePageViews();

  return (
    <div>
      {totalViews === null ? (
        <div className={`${className} items-center gap-2 bg-gray-100 dark:bg-[#3F72AF]/10 px-3 py-1.5 rounded-full border border-gray-200 dark:border-[#3F72AF]/20 animate-pulse`}>
          <div className="h-2.5 w-2.5 bg-gray-300 dark:bg-[#3F72AF]/40 rounded-full"></div>
          <div className="h-4 w-14 bg-gray-300 dark:bg-[#3F72AF]/40 rounded-sm"></div>
        </div>
      ) : (
        <div className={`${className} items-center gap-2.5 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800/50 transition-all duration-500`}>
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
    </div>
  );
};

export default PageVisitors;
