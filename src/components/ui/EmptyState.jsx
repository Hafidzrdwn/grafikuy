// src/components/ui/EmptyState.jsx
import Button from './Button';
import { Database } from 'lucide-react';

const EmptyState = ({ icon: Icon = Database, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-[#112D4E] rounded-xl border border-dashed border-(--color-muted) dark:border-[#3F72AF]/50">
      <div className="mb-4 text-gray-400 dark:text-[#3F72AF]">
        <Icon className="w-16 h-16" />
      </div>
      <h3 className="text-lg font-medium text-(--color-dark) dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-300 mb-6 max-w-md">{description}</p>
      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
