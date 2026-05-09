// src/components/ui/Spinner.jsx
import { Loader2 } from 'lucide-react';

const Spinner = ({ size = 'md' }) => {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className="flex justify-center items-center">
      <Loader2 className={`animate-spin text-(--color-primary) ${sizes[size]}`} />
    </div>
  );
};

export default Spinner;
