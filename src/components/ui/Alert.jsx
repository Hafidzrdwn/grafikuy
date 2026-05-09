import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const Alert = ({ type = 'info', message, onDismiss }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onDismiss) setTimeout(onDismiss, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!visible && !onDismiss) return null;

  const types = {
    success: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    error: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
    info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-[#3F72AF]/20 dark:text-blue-300 dark:border-[#3F72AF]/50'
  };

  return (
    <div className={`p-4 mb-4 border rounded-lg transition-all duration-300 transform ${visible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'} ${types[type]}`}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{message}</span>
        {onDismiss && (
          <button onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }} className="ml-4 opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
