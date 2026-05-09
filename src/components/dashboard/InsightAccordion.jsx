import { useState } from 'react';
import { Sparkles, ChevronDown } from 'lucide-react';

const InsightAccordion = ({ insight }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-4 border-t border-(--color-muted) dark:border-gray-700 pt-3">
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
      {isOpen && (
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 p-3 bg-(--color-muted)/20 dark:bg-gray-800/50 rounded-lg">
          {insight || 'Mock insight: The data shows a 15% increase in activity during weekends compared to weekdays. Consider allocating more resources for weekend campaigns.'}
        </div>
      )}
    </div>
  );
};

export default InsightAccordion;
