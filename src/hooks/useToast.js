import { useContext } from 'react';
import { ToastContext } from '@/components/ui/Toast';

export const useToast = () => {
  return useContext(ToastContext);
};
