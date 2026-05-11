import { useState } from 'react';
import { Sparkles, ChevronDown } from 'lucide-react';

const InsightAccordion = ({ insight }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3 relative">
      
      {isOpen && (
        <div className="absolute bottom-full left-0 w-full mb-3 z-20">
          <div className="text-sm text-gray-600 dark:text-gray-300 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 backdrop-blur-sm">
            {insight || 'Mock insight: The data shows a 15% increase in activity during weekends compared to weekdays. Consider allocating more resources for weekend campaigns.'}
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-sm font-medium text-(--color-primary) hover:text-opacity-80"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI Insight
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};

export default InsightAccordion;